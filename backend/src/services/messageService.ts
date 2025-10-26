import prisma from "@/lib/prisma";
import { MessageType } from "@prisma/client";
import logger from "@/utils/logger";
import crypto from "crypto";
import { contentModerationService } from "./contentModerationService";

interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
}

interface MessageWithSender {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  sentAt: Date;
  readAt: Date | null;
  editedAt: Date | null;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  attachments: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
}

class MessageService {
  // Encryption key for message content (in production, use proper key management)
  private encryptionKey =
    process.env.MESSAGE_ENCRYPTION_KEY || "your-32-character-secret-key-here";

  private encrypt(text: string): string {
    try {
      const algorithm = "aes-256-cbc";
      const key = Buffer.from(this.encryptionKey.padEnd(32, "0").slice(0, 32));
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      return iv.toString("hex") + ":" + encrypted;
    } catch (error) {
      logger.error("Encryption error:", error);
      return text; // Fallback to unencrypted in case of error
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      if (!encryptedText.includes(":")) {
        return encryptedText; // Not encrypted
      }

      const algorithm = "aes-256-cbc";
      const key = Buffer.from(this.encryptionKey.padEnd(32, "0").slice(0, 32));
      const [ivHex, encrypted] = encryptedText.split(":");
      const iv = Buffer.from(ivHex, "hex");

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      logger.error("Decryption error:", error);
      return encryptedText; // Fallback to encrypted text
    }
  }

  async createMessage(data: CreateMessageData): Promise<MessageWithSender> {
    try {
      // Moderate content before creating message
      const moderationResult = contentModerationService.moderateContent(
        data.content,
        data.senderId
      );

      if (moderationResult.shouldBlock) {
        logger.warn(
          `Message blocked for user ${data.senderId}:`,
          moderationResult.reasons
        );
        throw new Error(
          "Message contains inappropriate content and cannot be sent"
        );
      }

      let contentToStore = data.content;

      // If flagged but not blocked, clean the content
      if (moderationResult.shouldFlag) {
        contentToStore = contentModerationService.cleanContent(data.content);
        logger.info(
          `Message content cleaned for user ${data.senderId}:`,
          moderationResult.reasons
        );
      }

      // Encrypt message content
      const encryptedContent = this.encrypt(contentToStore);

      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: encryptedContent,
          type: data.type,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      // Update conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      // Send notifications to other conversation participants
      await this.sendMessageNotifications(
        data.conversationId,
        data.senderId,
        data.content
      );

      // Decrypt content for response
      const decryptedMessage = {
        ...message,
        content: this.decrypt(message.content),
      };

      logger.debug(`Message created: ${message.id}`);
      return decryptedMessage;
    } catch (error) {
      logger.error("Error creating message:", error);
      throw new Error("Failed to create message");
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: MessageWithSender[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Verify user has access to conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: userId,
              isActive: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new Error("Conversation not found or access denied");
      }

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            attachments: true,
          },
          orderBy: { sentAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: { conversationId },
        }),
      ]);

      // Decrypt message contents
      const decryptedMessages = messages.map((message) => ({
        ...message,
        content: this.decrypt(message.content),
      }));

      const hasMore = skip + messages.length < total;

      return {
        messages: decryptedMessages,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error("Error getting messages:", error);
      throw new Error("Failed to get messages");
    }
  }

  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ markedCount: number; lastReadAt: Date }> {
    try {
      const lastReadAt = new Date();

      // Get count of messages that will be marked as read
      const unreadCount = await prisma.message.count({
        where: {
          conversationId,
          senderId: { not: userId }, // Don't mark own messages as read
          readAt: null,
        },
      });

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId }, // Don't mark own messages as read
          readAt: null,
        },
        data: {
          readAt: lastReadAt,
        },
      });

      // Update user's last read timestamp in conversation
      await prisma.conversationUser.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt,
        },
      });

      logger.debug(
        `${unreadCount} messages marked as read for user ${userId} in conversation ${conversationId}`
      );

      return {
        markedCount: unreadCount,
        lastReadAt,
      };
    } catch (error) {
      logger.error("Error marking messages as read:", error);
      throw new Error("Failed to mark messages as read");
    }
  }

  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    messages: MessageWithSender[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        content: {
          contains: query,
          mode: "insensitive",
        },
        conversation: {
          participants: {
            some: {
              userId: userId,
              isActive: true,
            },
          },
        },
      };

      if (conversationId) {
        whereClause.conversationId = conversationId;
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: whereClause,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            attachments: true,
            conversation: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { sentAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: whereClause,
        }),
      ]);

      // Decrypt message contents
      const decryptedMessages = messages.map((message) => ({
        ...message,
        content: this.decrypt(message.content),
      }));

      const hasMore = skip + messages.length < total;

      return {
        messages: decryptedMessages,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error("Error searching messages:", error);
      throw new Error("Failed to search messages");
    }
  }

  async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<MessageWithSender> {
    try {
      // Verify user owns the message
      const existingMessage = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId,
        },
      });

      if (!existingMessage) {
        throw new Error("Message not found or access denied");
      }

      // Encrypt new content
      const encryptedContent = this.encrypt(newContent);

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: encryptedContent,
          editedAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          attachments: true,
        },
      });

      // Decrypt content for response
      const decryptedMessage = {
        ...updatedMessage,
        content: this.decrypt(updatedMessage.content),
      };

      logger.debug(`Message edited: ${messageId}`);
      return decryptedMessage;
    } catch (error) {
      logger.error("Error editing message:", error);
      throw new Error("Failed to edit message");
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Verify user owns the message
      const existingMessage = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId,
        },
      });

      if (!existingMessage) {
        throw new Error("Message not found or access denied");
      }

      await prisma.message.delete({
        where: { id: messageId },
      });

      logger.debug(`Message deleted: ${messageId}`);
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw new Error("Failed to delete message");
    }
  }
  /**
   * Send message notifications to conversation participants
   */
  private async sendMessageNotifications(
    conversationId: string,
    senderId: string,
    messageContent: string
  ): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependency
      const { notificationService } = await import("./notificationService");

      // Get conversation participants (excluding sender)
      const participants = await prisma.conversationUser.findMany({
        where: {
          conversationId,
          userId: { not: senderId },
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              preferences: true,
            },
          },
        },
      });

      // Send notification to each participant
      for (const participant of participants) {
        // Check if user wants message notifications
        if (participant.user.preferences?.messageNotifications !== false) {
          await notificationService.sendMessageNotification(
            participant.userId,
            senderId,
            conversationId,
            messageContent
          );
        }
      }
    } catch (error) {
      logger.error("Failed to send message notifications:", error);
      // Don't throw error as message was already created successfully
    }
  }
}

export const messageService = new MessageService();
