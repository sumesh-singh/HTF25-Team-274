import { Socket } from "socket.io";
import logger from "@/utils/logger";
import { messageService } from "@/services/messageService";
import { conversationService } from "@/services/conversationService";
import { onlinePresenceService } from "@/services/onlinePresenceService";
import prisma from "@/lib/prisma";

interface AuthenticatedSocket extends Socket {
  userId: string;
  user: any;
}

interface SendMessageData {
  conversationId: string;
  content: string;
  type?: "TEXT" | "FILE" | "IMAGE";
}

interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export const handleConnection = (socket: Socket) => {
  const authenticatedSocket = socket as AuthenticatedSocket;
  logger.info(
    `User connected: ${authenticatedSocket.user.email} (${authenticatedSocket.userId})`
  );

  // Join user to their personal room for notifications
  authenticatedSocket.join(`user:${authenticatedSocket.userId}`);

  // Handle user coming online
  onlinePresenceService.setUserOnline(authenticatedSocket.userId);
  authenticatedSocket.broadcast.emit("user_online", {
    userId: authenticatedSocket.userId,
  });

  // Join conversation room
  authenticatedSocket.on(
    "join_conversation",
    async (conversationId: string) => {
      try {
        // Verify user is part of this conversation
        const hasAccess = await conversationService.hasUserAccess(
          conversationId,
          authenticatedSocket.userId
        );

        if (!hasAccess) {
          authenticatedSocket.emit("error", {
            message: "Access denied to conversation",
          });
          return;
        }

        authenticatedSocket.join(`conversation:${conversationId}`);
        logger.debug(
          `User ${authenticatedSocket.userId} joined conversation ${conversationId}`
        );

        // Mark messages as read when joining
        await messageService.markMessagesAsRead(
          conversationId,
          authenticatedSocket.userId
        );

        // Notify other participants that user joined
        authenticatedSocket
          .to(`conversation:${conversationId}`)
          .emit("user_joined_conversation", {
            userId: authenticatedSocket.userId,
            conversationId,
          });
      } catch (error) {
        logger.error("Error joining conversation:", error);
        authenticatedSocket.emit("error", {
          message: "Failed to join conversation",
        });
      }
    }
  );

  // Leave conversation room
  authenticatedSocket.on("leave_conversation", (conversationId: string) => {
    authenticatedSocket.leave(`conversation:${conversationId}`);
    logger.debug(
      `User ${authenticatedSocket.userId} left conversation ${conversationId}`
    );

    // Notify other participants that user left
    authenticatedSocket
      .to(`conversation:${conversationId}`)
      .emit("user_left_conversation", {
        userId: authenticatedSocket.userId,
        conversationId,
      });
  });

  // Send message
  authenticatedSocket.on("send_message", async (data: SendMessageData) => {
    try {
      // Verify user has access to conversation
      const hasAccess = await conversationService.hasUserAccess(
        data.conversationId,
        authenticatedSocket.userId
      );

      if (!hasAccess) {
        authenticatedSocket.emit("error", {
          message: "Access denied to conversation",
        });
        return;
      }

      // Create message
      const message = await messageService.createMessage({
        conversationId: data.conversationId,
        senderId: authenticatedSocket.userId,
        content: data.content,
        type: data.type || "TEXT",
      });

      // Emit to all participants in the conversation
      authenticatedSocket
        .to(`conversation:${data.conversationId}`)
        .emit("message_received", message);

      // Also emit back to sender for confirmation
      authenticatedSocket.emit("message_sent", message);

      logger.debug(
        `Message sent in conversation ${data.conversationId} by user ${authenticatedSocket.userId}`
      );
    } catch (error) {
      logger.error("Error sending message:", error);
      authenticatedSocket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicators
  authenticatedSocket.on("typing_start", (conversationId: string) => {
    authenticatedSocket
      .to(`conversation:${conversationId}`)
      .emit("typing_indicator", {
        userId: authenticatedSocket.userId,
        conversationId,
        isTyping: true,
      });
  });

  authenticatedSocket.on("typing_stop", (conversationId: string) => {
    authenticatedSocket
      .to(`conversation:${conversationId}`)
      .emit("typing_indicator", {
        userId: authenticatedSocket.userId,
        conversationId,
        isTyping: false,
      });
  });

  // Message read receipts
  authenticatedSocket.on(
    "mark_messages_read",
    async (conversationId: string) => {
      try {
        const result = await messageService.markMessagesAsRead(
          conversationId,
          authenticatedSocket.userId
        );

        // Notify other participants about read status
        authenticatedSocket
          .to(`conversation:${conversationId}`)
          .emit("messages_read", {
            userId: authenticatedSocket.userId,
            conversationId,
            readAt: result.lastReadAt,
            markedCount: result.markedCount,
          });

        // Send confirmation back to the user
        authenticatedSocket.emit("messages_marked_read", {
          conversationId,
          markedCount: result.markedCount,
          readAt: result.lastReadAt,
        });
      } catch (error) {
        logger.error("Error marking messages as read:", error);
        authenticatedSocket.emit("error", {
          message: "Failed to mark messages as read",
        });
      }
    }
  );

  // Handle notification acknowledgment
  authenticatedSocket.on(
    "notification_acknowledged",
    async (notificationId: string) => {
      try {
        // Mark notification as read when user acknowledges it
        await prisma.notification.updateMany({
          where: {
            id: notificationId,
            userId: authenticatedSocket.userId,
          },
          data: { isRead: true },
        });

        logger.debug(
          `Notification ${notificationId} acknowledged by user ${authenticatedSocket.userId}`
        );
      } catch (error) {
        logger.error("Error acknowledging notification:", error);
      }
    }
  );

  // Handle notification preferences update
  authenticatedSocket.on(
    "update_notification_preferences",
    async (preferences: any) => {
      try {
        // Update user's notification preferences
        await prisma.userPreferences.upsert({
          where: { userId: authenticatedSocket.userId },
          create: {
            userId: authenticatedSocket.userId,
            ...preferences,
          },
          update: preferences,
        });

        authenticatedSocket.emit("notification_preferences_updated", {
          success: true,
          preferences,
        });

        logger.debug(
          `Notification preferences updated for user ${authenticatedSocket.userId}`
        );
      } catch (error) {
        logger.error("Error updating notification preferences:", error);
        authenticatedSocket.emit("notification_preferences_updated", {
          success: false,
          error: "Failed to update preferences",
        });
      }
    }
  );

  // Handle disconnection
  authenticatedSocket.on("disconnect", (reason) => {
    logger.info(
      `User disconnected: ${authenticatedSocket.user.email} (${authenticatedSocket.userId}) - Reason: ${reason}`
    );

    // Handle user going offline
    onlinePresenceService.setUserOffline(authenticatedSocket.userId);
    authenticatedSocket.broadcast.emit("user_offline", {
      userId: authenticatedSocket.userId,
    });
  });

  // Handle errors
  authenticatedSocket.on("error", (error) => {
    logger.error(`Socket error for user ${authenticatedSocket.userId}:`, error);
  });
};
