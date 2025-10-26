import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import config from "@/config";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";

// Supported file types and their MIME types
const SUPPORTED_FILE_TYPES = {
  // Documents
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "text/plain": ".txt",

  // Images
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",

  // Videos
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",

  // Archives
  "application/zip": ".zip",
  "application/x-rar-compressed": ".rar",
  "application/x-7z-compressed": ".7z",
};

const MAX_FILE_SIZE = config.upload.maxFileSize; // 10MB
const UPLOAD_PATH = config.upload.uploadPath;

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_PATH);
  } catch {
    await fs.mkdir(UPLOAD_PATH, { recursive: true });
    logger.info(`Created upload directory: ${UPLOAD_PATH}`);
  }
};

// Generate unique filename
const generateFileName = (originalName: string, mimeType: string): string => {
  const extension =
    SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES] ||
    path.extname(originalName);
  const hash = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${hash}${extension}`;
};

// Virus scanning placeholder (in production, integrate with ClamAV or similar)
const scanFile = async (filePath: string): Promise<boolean> => {
  try {
    // Placeholder for virus scanning
    // In production, integrate with antivirus service
    logger.debug(`Scanning file: ${filePath}`);

    // Basic file size check
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      return false;
    }

    // Check for suspicious file patterns (basic implementation)
    const fileContent = await fs.readFile(filePath);
    const suspiciousPatterns = [
      Buffer.from("eval(", "utf8"),
      Buffer.from("<script", "utf8"),
      Buffer.from("javascript:", "utf8"),
    ];

    for (const pattern of suspiciousPatterns) {
      if (fileContent.includes(pattern)) {
        logger.warn(`Suspicious pattern found in file: ${filePath}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error("Error scanning file:", error);
    return false;
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname, file.mimetype);
    cb(null, fileName);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file type is supported
  if (
    SUPPORTED_FILE_TYPES[file.mimetype as keyof typeof SUPPORTED_FILE_TYPES]
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum 5 files per upload
  },
});

class FileUploadService {
  async processUploadedFile(
    file: Express.Multer.File,
    messageId: string,
    userId: string
  ): Promise<any> {
    try {
      const filePath = file.path;

      // Scan file for viruses
      const isSafe = await scanFile(filePath);
      if (!isSafe) {
        // Delete unsafe file
        await fs.unlink(filePath);
        throw new Error("File failed security scan");
      }

      // Generate public URL
      const publicUrl = `/uploads/${file.filename}`;

      // Save attachment to database
      const attachment = await prisma.attachment.create({
        data: {
          messageId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: publicUrl,
        },
      });

      logger.info(
        `File uploaded successfully: ${file.originalname} -> ${file.filename}`
      );
      return attachment;
    } catch (error) {
      logger.error("Error processing uploaded file:", error);

      // Clean up file if processing failed
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        logger.error("Error cleaning up failed upload:", unlinkError);
      }

      throw error;
    }
  }

  async deleteFile(attachmentId: string, userId: string): Promise<void> {
    try {
      // Get attachment details
      const attachment = await prisma.attachment.findFirst({
        where: {
          id: attachmentId,
          message: {
            senderId: userId, // Only allow deletion by message sender
          },
        },
      });

      if (!attachment) {
        throw new Error("Attachment not found or access denied");
      }

      // Delete file from filesystem
      const filePath = path.join(UPLOAD_PATH, attachment.filename);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn(
          `Could not delete file from filesystem: ${filePath}`,
          error
        );
      }

      // Delete attachment record
      await prisma.attachment.delete({
        where: { id: attachmentId },
      });

      logger.info(`File deleted successfully: ${attachment.filename}`);
    } catch (error) {
      logger.error("Error deleting file:", error);
      throw error;
    }
  }

  async getFileInfo(attachmentId: string, userId: string): Promise<any> {
    try {
      const attachment = await prisma.attachment.findFirst({
        where: {
          id: attachmentId,
          message: {
            conversation: {
              participants: {
                some: {
                  userId,
                  isActive: true,
                },
              },
            },
          },
        },
        include: {
          message: {
            select: {
              id: true,
              conversationId: true,
              senderId: true,
            },
          },
        },
      });

      if (!attachment) {
        throw new Error("Attachment not found or access denied");
      }

      return attachment;
    } catch (error) {
      logger.error("Error getting file info:", error);
      throw error;
    }
  }

  async getConversationFiles(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    files: any[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [files, total] = await Promise.all([
        prisma.attachment.findMany({
          where: {
            message: {
              conversationId,
              conversation: {
                participants: {
                  some: {
                    userId,
                    isActive: true,
                  },
                },
              },
            },
          },
          include: {
            message: {
              select: {
                id: true,
                senderId: true,
                sentAt: true,
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.attachment.count({
          where: {
            message: {
              conversationId,
              conversation: {
                participants: {
                  some: {
                    userId,
                    isActive: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const hasMore = skip + files.length < total;

      return {
        files,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error("Error getting conversation files:", error);
      throw error;
    }
  }

  // Get file statistics for a user
  async getUserFileStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    try {
      const attachments = await prisma.attachment.findMany({
        where: {
          message: {
            senderId: userId,
          },
        },
        select: {
          size: true,
          mimeType: true,
        },
      });

      const stats = {
        totalFiles: attachments.length,
        totalSize: attachments.reduce((sum, file) => sum + file.size, 0),
        fileTypes: {} as Record<string, number>,
      };

      // Count file types
      attachments.forEach((file) => {
        const extension =
          SUPPORTED_FILE_TYPES[
            file.mimeType as keyof typeof SUPPORTED_FILE_TYPES
          ] || "other";
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error("Error getting user file stats:", error);
      throw error;
    }
  }
}

export const fileUploadService = new FileUploadService();
