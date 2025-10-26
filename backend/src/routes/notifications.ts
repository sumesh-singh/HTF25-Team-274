import { Router } from "express";
import { validateRequest, commonSchemas } from "@/middleware/validation";
import { authenticateToken } from "@/middleware/auth";
import { notificationService } from "@/services/notificationService";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";
import Joi from "joi";

const router = Router();

// GET /api/v1/notifications - Get user notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as any;
    const isRead =
      req.query.isRead === "true"
        ? true
        : req.query.isRead === "false"
        ? false
        : undefined;

    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit,
      type,
      isRead,
    });

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    logger.error("Failed to get user notifications:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "NOTIFICATIONS_FETCH_FAILED",
        message: "Failed to fetch notifications",
      },
    });
  }
});

// PUT /api/v1/notifications/:id/read - Mark notification as read
router.put(
  "/:id/read",
  authenticateToken,
  validateRequest({ params: Joi.object({ id: commonSchemas.id }) }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id;

      await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        data: {
          message: "Notification marked as read",
          notificationId,
        },
      });
    } catch (error) {
      logger.error("Failed to mark notification as read:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "NOTIFICATION_UPDATE_FAILED",
          message: "Failed to mark notification as read",
        },
      });
    }
  }
);

// PUT /api/v1/notifications/read-all - Mark all notifications as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: {
        message: "All notifications marked as read",
      },
    });
  } catch (error) {
    logger.error("Failed to mark all notifications as read:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "NOTIFICATIONS_UPDATE_FAILED",
        message: "Failed to mark all notifications as read",
      },
    });
  }
});

// GET /api/v1/notifications/preferences - Get notification preferences
router.get("/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    const preferences = user.preferences || {
      emailNotifications: true,
      pushNotifications: true,
      sessionReminders: true,
      matchSuggestions: true,
      messageNotifications: true,
      creditNotifications: true,
      systemNotifications: true,
    };

    res.json({
      success: true,
      data: {
        preferences,
      },
    });
  } catch (error) {
    logger.error("Failed to get notification preferences:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PREFERENCES_FETCH_FAILED",
        message: "Failed to fetch notification preferences",
      },
    });
  }
});

// PUT /api/v1/notifications/preferences - Update notification preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;

    await notificationService.updateUserPreferences(userId, preferences);

    res.json({
      success: true,
      data: {
        message: "Notification preferences updated successfully",
        preferences,
      },
    });
  } catch (error) {
    logger.error("Failed to update notification preferences:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PREFERENCES_UPDATE_FAILED",
        message: "Failed to update notification preferences",
      },
    });
  }
});

// GET /api/v1/notifications/stats - Get notification statistics (admin only)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // TODO: Add admin role check
    const timeframe =
      (req.query.timeframe as "day" | "week" | "month") || "day";

    const stats = await notificationService.getNotificationStats(timeframe);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Failed to get notification stats:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STATS_FETCH_FAILED",
        message: "Failed to fetch notification statistics",
      },
    });
  }
});

export default router;
