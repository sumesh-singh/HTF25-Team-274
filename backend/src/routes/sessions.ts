import { Router } from "express";
import {
  validateRequest,
  sessionSchemas,
  commonSchemas,
} from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { sessionController } from "@/controllers/sessionController";

const router = Router();

// GET /api/v1/sessions - Get user sessions
router.get(
  "/",
  authenticateToken,
  sessionController.getUserSessions.bind(sessionController)
);

// POST /api/v1/sessions - Create new session
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: sessionSchemas.createSession }),
  sessionController.createSession.bind(sessionController)
);

// GET /api/v1/sessions/upcoming - Get upcoming sessions
router.get(
  "/upcoming",
  authenticateToken,
  sessionController.getUpcomingSessions.bind(sessionController)
);

// GET /api/v1/sessions/history - Get session history
router.get(
  "/history",
  authenticateToken,
  sessionController.getSessionHistory.bind(sessionController)
);

// GET /api/v1/sessions/:id - Get session details
router.get(
  "/:id",
  authenticateToken,
  validateRequest({ params: { id: commonSchemas.id } }),
  sessionController.getSessionDetails.bind(sessionController)
);

// PUT /api/v1/sessions/:id - Update session
router.put(
  "/:id",
  authenticateToken,
  validateRequest({
    params: { id: commonSchemas.id },
    body: sessionSchemas.updateSession,
  }),
  sessionController.updateSession.bind(sessionController)
);

// DELETE /api/v1/sessions/:id - Cancel session
router.delete(
  "/:id",
  authenticateToken,
  validateRequest({ params: { id: commonSchemas.id } }),
  sessionController.cancelSession.bind(sessionController)
);

// POST /api/v1/sessions/:id/join - Join session
router.post(
  "/:id/join",
  authenticateToken,
  validateRequest({ params: { id: commonSchemas.id } }),
  sessionController.joinSession.bind(sessionController)
);

// POST /api/v1/sessions/:id/rate - Rate completed session
router.post(
  "/:id/rate",
  authenticateToken,
  validateRequest({
    params: { id: commonSchemas.id },
    body: sessionSchemas.rateSession,
  }),
  sessionController.rateSession.bind(sessionController)
);

// POST /api/v1/sessions/:id/complete - Complete session
router.post(
  "/:id/complete",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      const { sessionService } = await import("@/services/sessionService");
      const session = await sessionService.completeSession(sessionId, userId);

      res.json({
        success: true,
        data: session,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "SESSION_COMPLETION_FAILED",
          message: error.message || "Failed to complete session",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
);

// GET /api/v1/sessions/analytics - Get session analytics
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }

    const { sessionService } = await import("@/services/sessionService");
    const analytics = await sessionService.getSessionAnalytics(userId);

    res.json({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] as string,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "ANALYTICS_FETCH_FAILED",
        message: error.message || "Failed to fetch session analytics",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] as string,
      },
    });
  }
});

export default router;
