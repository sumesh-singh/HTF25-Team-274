import { Request, Response } from "express";
import { reportService } from "../services/reportService";
import { ApiResponse, ReportType } from "../types";
import logger from "../utils/logger";

export class ReportController {
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportedUserId, type, reason, description, evidence } = req.body;
      const reporterId = req.user?.id;

      if (!reporterId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      if (!reportedUserId || !type || !reason || !description) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Reported user ID, type, reason, and description are required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      if (reporterId === reportedUserId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "You cannot report yourself",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      const report = await reportService.createReport(
        reporterId,
        reportedUserId,
        type as ReportType,
        reason,
        description,
        evidence
      );

      const response: ApiResponse = {
        success: true,
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error("Error in createReport:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "REPORT_CREATE_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create report",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async getUserReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      const result = await reportService.getUserReports(userId, page, limit);

      const response: ApiResponse = {
        success: true,
        data: result.reports,
        meta: {
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: page < result.totalPages,
            hasPrev: page > 1,
          },
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getUserReports:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "REPORT_FETCH_ERROR",
          message: "Failed to retrieve reports",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      const report = await reportService.getReportById(reportId);

      if (!report) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: "Report not found",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(404).json(response);
        return;
      }

      // Only allow the reporter or admin to view the report
      if (report.reporterId !== userId && !(req.user as any)?.isAdmin) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(403).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getReportById:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "REPORT_FETCH_ERROR",
          message: "Failed to retrieve report",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { blockedUserId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      if (!blockedUserId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Blocked user ID is required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      if (userId === blockedUserId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "You cannot block yourself",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      await reportService.blockUser(userId, blockedUserId);

      const response: ApiResponse = {
        success: true,
        data: { message: "User blocked successfully" },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in blockUser:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "BLOCK_USER_ERROR",
          message: "Failed to block user",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { blockedUserId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      if (!blockedUserId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Blocked user ID is required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      await reportService.unblockUser(userId, blockedUserId);

      const response: ApiResponse = {
        success: true,
        data: { message: "User unblocked successfully" },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in unblockUser:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "UNBLOCK_USER_ERROR",
          message: "Failed to unblock user",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async getBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      const blockedUserIds = await reportService.getBlockedUsers(userId);

      const response: ApiResponse = {
        success: true,
        data: { blockedUsers: blockedUserIds },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getBlockedUsers:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "BLOCKED_USERS_ERROR",
          message: "Failed to retrieve blocked users",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }
}

export const reportController = new ReportController();
