import { Router } from "express";
import { validateRequest, commonSchemas } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { messageController } from "@/controllers/messageController";
import { upload } from "@/services/fileUploadService";

const router = Router();

// GET /api/v1/conversations - Get user conversations
router.get("/", authenticateToken, messageController.getConversations as any);

// POST /api/v1/conversations - Create new conversation
router.post(
  "/",
  authenticateToken,
  messageController.createConversation as any
);

// GET /api/v1/conversations/:id - Get conversation details
router.get(
  "/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.getConversation as any
);

// GET /api/v1/conversations/:id/messages - Get conversation messages
router.get(
  "/:id/messages",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.getMessages as any
);

// POST /api/v1/conversations/:id/messages - Send message
router.post(
  "/:id/messages",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.sendMessage as any
);

// PUT /api/v1/messages/:id - Update message
router.put(
  "/messages/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.updateMessage as any
);

// DELETE /api/v1/messages/:id - Delete message
router.delete(
  "/messages/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.deleteMessage as any
);

// GET /api/v1/messages/search - Search messages
router.get(
  "/search",
  authenticateToken,
  messageController.searchMessages as any
);

// POST /api/v1/conversations/:id/files - Upload files to conversation
router.post(
  "/:id/files",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  upload.array("files", 5), // Allow up to 5 files
  messageController.uploadFiles as any
);

// GET /api/v1/conversations/:id/files - Get conversation files
router.get(
  "/:id/files",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.getConversationFiles as any
);

// DELETE /api/v1/attachments/:attachmentId - Delete file attachment
router.delete(
  "/attachments/:attachmentId",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.deleteFile as any
);

// GET /api/v1/attachments/:attachmentId - Get file info
router.get(
  "/attachments/:attachmentId",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.getFileInfo as any
);

// PUT /api/v1/conversations/:id - Update conversation
router.put(
  "/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.updateConversation as any
);

// POST /api/v1/conversations/:id/archive - Archive conversation
router.post(
  "/:id/archive",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.archiveConversation as any
);

// POST /api/v1/conversations/:id/participants - Add participant
router.post(
  "/:id/participants",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.addParticipant as any
);

// DELETE /api/v1/conversations/:id/participants - Remove participant
router.delete(
  "/:id/participants",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.removeParticipant as any
);

// GET /api/v1/conversations/:id/participants - Get participants
router.get(
  "/:id/participants",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  messageController.getParticipants as any
);

export default router;
