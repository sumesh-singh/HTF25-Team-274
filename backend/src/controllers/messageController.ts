import { Response } from "express";
import { messageService } from "@/services/messageService";
import { conversationService } from "@/services/conversationService";
import { fileUploadService } from "@/services/fileUploadService";
import { getSocketIO } from "@/lib/socket";
import { AuthenticatedRequest } from "@/types";
import logger from "@/utils/logger";

export const messageController = {
  // Get user conversations
  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await conversationService.getUserConversations(
        userId,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        meta: {
          pagination: {
            page,
            limit,
            total: result.total,
            hasMore: result.hasMore,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error getting conversations:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CONVERSATIONS_FETCH_FAILED",
          message: "Failed to fetch conversations",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Create new conversation
  async createConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const { participantIds, title, isGroup } = req.body;

      if (!participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "participantIds is required and must be an array",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      const conversation = await conversationService.createConversation(
        {
          participantIds,
          title,
          isGroup,
        },
        userId
      );

      // Notify participants via Socket.io
      const io = getSocketIO();
      participantIds.forEach((participantId: string) => {
        if (participantId !== userId) {
          io.to(`user:${participantId}`).emit("conversation_created", {
            conversation,
            createdBy: userId,
          });
        }
      });

      res.status(201).json({
        success: true,
        data: conversation,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error creating conversation:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CONVERSATION_CREATE_FAILED",
          message: "Failed to create conversation",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Get conversation details
  async getConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      const conversation = await conversationService.getConversation(
        conversationId,
        userId
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found or access denied",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      res.json({
        success: true,
        data: conversation,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error getting conversation:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CONVERSATION_FETCH_FAILED",
          message: "Failed to fetch conversation",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Get conversation messages
  async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await messageService.getMessages(
        conversationId,
        userId,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        meta: {
          pagination: {
            page,
            limit,
            total: result.total,
            hasMore: result.hasMore,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error getting messages:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MESSAGES_FETCH_FAILED",
          message: "Failed to fetch messages",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Send message (HTTP endpoint - real-time handled via Socket.io)
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const { content, type = "TEXT" } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Message content is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      // Verify user has access to conversation
      const hasAccess = await conversationService.hasUserAccess(
        conversationId,
        userId
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "Access denied to conversation",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      const message = await messageService.createMessage({
        conversationId,
        senderId: userId,
        content: content.trim(),
        type,
      });

      // Emit to Socket.io for real-time delivery
      const io = getSocketIO();
      io.to(`conversation:${conversationId}`).emit("message_received", message);

      res.status(201).json({
        success: true,
        data: message,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MESSAGE_SEND_FAILED",
          message: "Failed to send message",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Update message
  async updateMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Message content is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      const updatedMessage = await messageService.editMessage(
        messageId,
        userId,
        content.trim()
      );

      // Emit to Socket.io for real-time update
      const io = getSocketIO();
      io.to(`conversation:${updatedMessage.conversationId}`).emit(
        "message_updated",
        updatedMessage
      );

      res.json({
        success: true,
        data: updatedMessage,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error updating message:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MESSAGE_UPDATE_FAILED",
          message: "Failed to update message",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Delete message
  async deleteMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;

      await messageService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        data: {
          message: "Message deleted successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error deleting message:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MESSAGE_DELETE_FAILED",
          message: "Failed to delete message",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Search messages
  async searchMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const query = req.query.q as string;
      const conversationId = req.query.conversationId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Search query is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      const result = await messageService.searchMessages(
        userId,
        query.trim(),
        conversationId,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        meta: {
          pagination: {
            page,
            limit,
            total: result.total,
            hasMore: result.hasMore,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error searching messages:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "MESSAGE_SEARCH_FAILED",
          message: "Failed to search messages",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Upload files to conversation
  async uploadFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No files provided",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      // Verify user has access to conversation
      const hasAccess = await conversationService.hasUserAccess(
        conversationId,
        userId
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "Access denied to conversation",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      // Create a message for the file upload
      const message = await messageService.createMessage({
        conversationId,
        senderId: userId,
        content: `Shared ${files.length} file(s)`,
        type: "FILE",
      });

      // Process each uploaded file
      const attachments = [];
      for (const file of files) {
        try {
          const attachment = await fileUploadService.processUploadedFile(
            file,
            message.id,
            userId
          );
          attachments.push(attachment);
        } catch (error) {
          logger.error(`Error processing file ${file.originalname}:`, error);
          // Continue with other files
        }
      }

      // Update message with attachments
      const messageWithAttachments = {
        ...message,
        attachments,
      };

      // Emit to Socket.io for real-time delivery
      const io = getSocketIO();
      io.to(`conversation:${conversationId}`).emit(
        "message_received",
        messageWithAttachments
      );

      res.status(201).json({
        success: true,
        data: {
          message: messageWithAttachments,
          uploadedFiles: attachments.length,
          totalFiles: files.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error uploading files:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FILE_UPLOAD_FAILED",
          message: "Failed to upload files",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Get conversation files
  async getConversationFiles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await fileUploadService.getConversationFiles(
        conversationId,
        userId,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
        meta: {
          pagination: {
            page,
            limit,
            total: result.total,
            hasMore: result.hasMore,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error getting conversation files:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FILES_FETCH_FAILED",
          message: "Failed to fetch conversation files",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Delete file attachment
  async deleteFile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const attachmentId = req.params.attachmentId;

      await fileUploadService.deleteFile(attachmentId, userId);

      res.json({
        success: true,
        data: {
          message: "File deleted successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FILE_DELETE_FAILED",
          message: "Failed to delete file",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Get file info
  async getFileInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const attachmentId = req.params.attachmentId;

      const fileInfo = await fileUploadService.getFileInfo(
        attachmentId,
        userId
      );

      res.json({
        success: true,
        data: fileInfo,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error getting file info:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FILE_INFO_FAILED",
          message: "Failed to get file information",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Archive conversation
  async archiveConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      await conversationService.archiveConversation(conversationId, userId);

      res.json({
        success: true,
        data: {
          message: "Conversation archived successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error archiving conversation:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CONVERSATION_ARCHIVE_FAILED",
          message: "Failed to archive conversation",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Update conversation (title, etc.)
  async updateConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const { title } = req.body;

      const updatedConversation = await conversationService.updateConversation(
        conversationId,
        userId,
        { title }
      );

      // Emit to Socket.io for real-time update
      const io = getSocketIO();
      io.to(`conversation:${conversationId}`).emit("conversation_updated", {
        conversation: updatedConversation,
        updatedBy: userId,
      });

      res.json({
        success: true,
        data: updatedConversation,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error updating conversation:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CONVERSATION_UPDATE_FAILED",
          message: "Failed to update conversation",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Add participant to conversation
  async addParticipant(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const { participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "participantId is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      await conversationService.addParticipant(
        conversationId,
        participantId,
        userId
      );

      // Emit to Socket.io for real-time update
      const io = getSocketIO();
      io.to(`conversation:${conversationId}`).emit("participant_added", {
        conversationId,
        participantId,
        addedBy: userId,
      });

      // Notify the new participant
      io.to(`user:${participantId}`).emit("conversation_joined", {
        conversationId,
        addedBy: userId,
      });

      res.json({
        success: true,
        data: {
          message: "Participant added successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error adding participant:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PARTICIPANT_ADD_FAILED",
          message: "Failed to add participant",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Remove participant from conversation
  async removeParticipant(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const { participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "participantId is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      await conversationService.removeParticipant(
        conversationId,
        participantId,
        userId
      );

      // Emit to Socket.io for real-time update
      const io = getSocketIO();
      io.to(`conversation:${conversationId}`).emit("participant_removed", {
        conversationId,
        participantId,
        removedBy: userId,
      });

      // Notify the removed participant
      io.to(`user:${participantId}`).emit("conversation_left", {
        conversationId,
        removedBy: userId,
      });

      res.json({
        success: true,
        data: {
          message: "Participant removed successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error removing participant:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PARTICIPANT_REMOVE_FAILED",
          message: "Failed to remove participant",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },

  // Get conversation participants
  async getParticipants(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      const conversation = await conversationService.getConversation(
        conversationId,
        userId
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: {
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found or access denied",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"],
          },
        });
      }

      res.json({
        success: true,
        data: {
          participants: conversation.participants,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    } catch (error) {
      logger.error("Error getting participants:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PARTICIPANTS_FETCH_FAILED",
          message: "Failed to fetch participants",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        },
      });
    }
  },
};
