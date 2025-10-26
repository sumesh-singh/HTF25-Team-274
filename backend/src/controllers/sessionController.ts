import { Request, Response } from "express";
import {
  sessionService,
  CreateSessionRequest,
} from "@/services/sessionService";
import { ApiResponse } from "@/types";
import logger from "@/utils/logger";
import { SessionStatus, SessionType } from "@prisma/client";

export class SessionController {
  /**
   * Create a new session or session proposal
   */
  async createSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const sessionData: CreateSessionRequest = {
        ...req.body,
        learnerId: userId, // The requester is the learner
      };

      // If multiple time slots are provided, create a proposal
      if (req.body.proposedTimeSlots && req.body.proposedTimeSlots.length > 1) {
        const proposal = await sessionService.createSessionProposal(
          sessionData
        );
        res.status(201).json({
          success: true,
          data: proposal,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      } else {
        // Create a direct session
        const session = await sessionService.createSession(sessionData);
        res.status(201).json({
          success: true,
          data: session,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }
    } catch (error: any) {
      logger.error("Create session error:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "SESSION_CREATION_FAILED",
          message: error.message || "Failed to create session",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Get user sessions with filtering
   */
  async getUserSessions(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const filters = {
        status: req.query.status as SessionStatus,
        type: req.query.type as SessionType,
        role: req.query.role as "teacher" | "learner",
        upcoming: req.query.upcoming === "true",
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await sessionService.getUserSessions(userId, filters);

      res.json({
        success: true,
        data: result.sessions,
        meta: {
          pagination: {
            page: result.page,
            limit: filters.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Get user sessions error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "SESSIONS_FETCH_FAILED",
          message: error.message || "Failed to fetch sessions",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const result = await sessionService.getUserSessions(userId, {
        upcoming: true,
        status: SessionStatus.CONFIRMED,
        limit: 10,
      });

      res.json({
        success: true,
        data: result.sessions,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Get upcoming sessions error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "UPCOMING_SESSIONS_FETCH_FAILED",
          message: error.message || "Failed to fetch upcoming sessions",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Get session history
   */
  async getSessionHistory(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await sessionService.getUserSessions(userId, {
        status: SessionStatus.COMPLETED,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result.sessions,
        meta: {
          pagination: {
            page: result.page,
            limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Get session history error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "SESSION_HISTORY_FETCH_FAILED",
          message: error.message || "Failed to fetch session history",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Get session details
   */
  async getSessionDetails(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const session = await sessionService.getSessionDetails(sessionId, userId);

      res.json({
        success: true,
        data: session,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Get session details error:", error);
      const statusCode =
        error.message === "Session not found"
          ? 404
          : error.message === "Access denied"
          ? 403
          : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "SESSION_DETAILS_FETCH_FAILED",
          message: error.message || "Failed to fetch session details",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Update session
   */
  async updateSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      // Handle different update types
      if (req.body.scheduledAt) {
        // Reschedule session
        const session = await sessionService.rescheduleSession(
          sessionId,
          new Date(req.body.scheduledAt),
          userId
        );
        res.json({
          success: true,
          data: session,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      } else if (req.body.status === "confirmed") {
        // Confirm session
        const session = await sessionService.confirmSession(sessionId, userId);
        res.json({
          success: true,
          data: session,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_UPDATE_REQUEST",
            message: "Invalid update request",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }
    } catch (error: any) {
      logger.error("Update session error:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "SESSION_UPDATE_FAILED",
          message: error.message || "Failed to update session",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Cancel session
   */
  async cancelSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const session = await sessionService.cancelSession(
        sessionId,
        userId,
        req.body.reason
      );

      res.json({
        success: true,
        data: session,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Cancel session error:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "SESSION_CANCELLATION_FAILED",
          message: error.message || "Failed to cancel session",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Join session (get video link if available)
   */
  async joinSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const session = await sessionService.getSessionDetails(sessionId, userId);

      if (!session.canJoin) {
        res.status(400).json({
          success: false,
          error: {
            code: "SESSION_NOT_JOINABLE",
            message:
              "Session cannot be joined yet (available 15 minutes before start time)",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          joinUrl: session.joinUrl,
          scheduledAt: session.scheduledAt,
          title: session.title,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Join session error:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "SESSION_JOIN_FAILED",
          message: error.message || "Failed to join session",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * Rate a completed session
   */
  async rateSession(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      // Import session rating service
      const { sessionRatingService } = await import(
        "@/services/sessionRatingService"
      );

      const rating = await sessionRatingService.createRating({
        sessionId,
        raterId: userId,
        knowledgeRating: req.body.knowledgeRating,
        communicationRating: req.body.communicationRating,
        professionalismRating: req.body.professionalismRating,
        feedback: req.body.feedback,
      });

      res.json({
        success: true,
        data: rating,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Rate session error:", error);
      res.status(400).json({
        success: false,
        error: {
          code: "SESSION_RATING_FAILED",
          message: error.message || "Failed to rate session",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const sessionController = new SessionController();
