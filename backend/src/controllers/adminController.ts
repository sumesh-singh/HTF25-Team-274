import { Request, Response } from "express";
import { adminService } from "../services/adminService";
import { systemHealthService } from "../services/systemHealthService";
import { ApiResponse, ModerationActionType, ReportStatus } from "../types";
import logger from "../utils/logger";

export class AdminController {
  // Analytics endpoints
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await adminService.getAnalytics();

      const response: ApiResponse = {
        success: true,
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getAnalytics:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: "Failed to retrieve analytics data",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  // User management endpoints
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await adminService.getAllUsers(page, limit, search);

      const response: ApiResponse = {
        success: true,
        data: result.users,
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
      logger.error("Error in getAllUsers:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "USER_FETCH_ERROR",
          message: "Failed to retrieve users",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserDetails(userId);

      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: user,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getUserDetails:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "USER_DETAILS_ERROR",
          message: "Failed to retrieve user details",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  // Session management endpoints
  async getAllSessions(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await adminService.getAllSessions(page, limit, status);

      const response: ApiResponse = {
        success: true,
        data: result.sessions,
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
      logger.error("Error in getAllSessions:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "SESSION_FETCH_ERROR",
          message: "Failed to retrieve sessions",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  // Skill management endpoints
  async getAllSkills(req: Request, res: Response): Promise<void> {
    try {
      const skills = await adminService.getAllSkills();

      const response: ApiResponse = {
        success: true,
        data: skills,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getAllSkills:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "SKILL_FETCH_ERROR",
          message: "Failed to retrieve skills",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async createSkill(req: Request, res: Response): Promise<void> {
    try {
      const { name, category, description } = req.body;

      if (!name || !category) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name and category are required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      const skill = await adminService.createSkill(name, category, description);

      const response: ApiResponse = {
        success: true,
        data: skill,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error("Error in createSkill:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "SKILL_CREATE_ERROR",
          message: "Failed to create skill",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async updateSkill(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const updateData = req.body;

      const skill = await adminService.updateSkill(skillId, updateData);

      const response: ApiResponse = {
        success: true,
        data: skill,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in updateSkill:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "SKILL_UPDATE_ERROR",
          message: "Failed to update skill",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async deleteSkill(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      await adminService.deleteSkill(skillId);

      const response: ApiResponse = {
        success: true,
        data: { message: "Skill deleted successfully" },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in deleteSkill:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "SKILL_DELETE_ERROR",
          message: "Failed to delete skill",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  // Report management endpoints
  async getAllReports(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as ReportStatus;

      const result = await adminService.getAllReports(page, limit, status);

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
      logger.error("Error in getAllReports:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "REPORT_FETCH_ERROR",
          message: "Failed to retrieve reports",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async updateReportStatus(req: Request, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;

      if (!status) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Status is required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      const report = await adminService.updateReportStatus(
        reportId,
        status,
        adminNotes
      );

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
      logger.error("Error in updateReportStatus:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "REPORT_UPDATE_ERROR",
          message: "Failed to update report status",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  // Moderation endpoints
  async createModerationAction(req: Request, res: Response): Promise<void> {
    try {
      const { targetUserId, type, reason, duration } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Admin authentication required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(401).json(response);
        return;
      }

      if (!targetUserId || !type || !reason) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Target user ID, type, and reason are required",
            timestamp: new Date().toISOString(),
            requestId: (req.headers["x-request-id"] as string) || "unknown",
          },
        };
        res.status(400).json(response);
        return;
      }

      const action = await adminService.createModerationAction(
        adminId,
        targetUserId,
        type as ModerationActionType,
        reason,
        duration
      );

      const response: ApiResponse = {
        success: true,
        data: action,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error("Error in createModerationAction:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "MODERATION_ACTION_ERROR",
          message: "Failed to create moderation action",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }

  async getModerationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const history = await adminService.getModerationHistory(userId);

      const response: ApiResponse = {
        success: true,
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      logger.error("Error in getModerationHistory:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "MODERATION_HISTORY_ERROR",
          message: "Failed to retrieve moderation history",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }
  // System health endpoint
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await systemHealthService.getDetailedHealthCheck();

      const response: ApiResponse = {
        success: true,
        data: healthCheck,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };

      // Set appropriate HTTP status based on health
      const statusCode =
        healthCheck.overall === "healthy"
          ? 200
          : healthCheck.overall === "degraded"
          ? 200
          : 503;

      res.status(statusCode).json(response);
    } catch (error) {
      logger.error("Error in getSystemHealth:", error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: "HEALTH_CHECK_ERROR",
          message: "Failed to retrieve system health",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(500).json(response);
    }
  }
}

export const adminController = new AdminController();
