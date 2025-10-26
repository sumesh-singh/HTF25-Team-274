import { Request, Response } from "express";
import { availabilityService } from "@/services/availabilityService";
import { ApiResponse, AuthenticatedRequest } from "@/types";

export class AvailabilityController {
  /**
   * GET /api/v1/availability/users/:id - Get user availability
   */
  async getUserAvailability(req: Request, res: Response<ApiResponse>) {
    try {
      const { id: userId } = req.params;
      const { dayOfWeek, isActive } = req.query;

      const filters = {
        ...(dayOfWeek !== undefined && {
          dayOfWeek: parseInt(dayOfWeek as string),
        }),
        ...(isActive !== undefined && { isActive: isActive === "true" }),
      };

      const availability = await availabilityService.getUserAvailability(
        userId,
        filters
      );

      res.json({
        success: true,
        data: {
          availability,
          total: availability.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting user availability:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve user availability",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * POST /api/v1/availability - Add availability slot
   */
  async addAvailabilitySlot(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { dayOfWeek, startTime, endTime, timezone } = req.body;
      const userId = req.user!.id;

      const availability = await availabilityService.addAvailabilitySlot({
        userId,
        dayOfWeek,
        startTime,
        endTime,
        timezone,
      });

      res.status(201).json({
        success: true,
        data: {
          availability,
          message: "Availability slot added successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error adding availability slot:", error);

      if (error instanceof Error) {
        if (error.message.includes("Day of week must be between")) {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_DAY_OF_WEEK",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (error.message.includes("Time must be in HH:MM format")) {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_TIME_FORMAT",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (error.message.includes("Start time must be before end time")) {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_TIME_RANGE",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (error.message.includes("overlaps with existing availability")) {
          res.status(409).json({
            success: false,
            error: {
              code: "AVAILABILITY_OVERLAP",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add availability slot",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * PUT /api/v1/availability/:id - Update availability slot
   */
  async updateAvailabilitySlot(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { id: availabilityId } = req.params;
      const { dayOfWeek, startTime, endTime, timezone, isActive } = req.body;
      const userId = req.user!.id;

      const availability = await availabilityService.updateAvailabilitySlot(
        availabilityId,
        userId,
        { dayOfWeek, startTime, endTime, timezone, isActive }
      );

      res.json({
        success: true,
        data: {
          availability,
          message: "Availability slot updated successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error updating availability slot:", error);

      if (error instanceof Error) {
        if (error.message === "Availability slot not found") {
          res.status(404).json({
            success: false,
            error: {
              code: "AVAILABILITY_NOT_FOUND",
              message: "The specified availability slot was not found",
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (
          error.message.includes("Day of week must be between") ||
          error.message.includes("Time must be in HH:MM format") ||
          error.message.includes("Start time must be before end time")
        ) {
          res.status(400).json({
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (error.message.includes("overlaps with existing availability")) {
          res.status(409).json({
            success: false,
            error: {
              code: "AVAILABILITY_OVERLAP",
              message: error.message,
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update availability slot",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * DELETE /api/v1/availability/:id - Remove availability slot
   */
  async removeAvailabilitySlot(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { id: availabilityId } = req.params;
      const userId = req.user!.id;

      await availabilityService.removeAvailabilitySlot(availabilityId, userId);

      res.json({
        success: true,
        data: {
          message: "Availability slot removed successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error removing availability slot:", error);

      if (
        error instanceof Error &&
        error.message === "Availability slot not found"
      ) {
        res.status(404).json({
          success: false,
          error: {
            code: "AVAILABILITY_NOT_FOUND",
            message: "The specified availability slot was not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove availability slot",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/availability/overlap/:userId - Get availability overlap with another user
   */
  async getAvailabilityOverlap(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const { userId: otherUserId } = req.params;
      const currentUserId = req.user!.id;

      const overlaps = await availabilityService.getAvailabilityOverlap(
        currentUserId,
        otherUserId
      );

      res.json({
        success: true,
        data: {
          overlaps,
          total: overlaps.length,
          totalMinutes: overlaps.reduce(
            (sum, overlap) => sum + overlap.duration,
            0
          ),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting availability overlap:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate availability overlap",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/availability/matches - Get users with overlapping availability
   */
  async getUsersWithOverlappingAvailability(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const userId = req.user!.id;
      const { minOverlapMinutes } = req.query;

      const minOverlap = minOverlapMinutes
        ? parseInt(minOverlapMinutes as string)
        : 60;
      const matches =
        await availabilityService.getUsersWithOverlappingAvailability(
          userId,
          minOverlap
        );

      res.json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error(
        "Error getting users with overlapping availability:",
        error
      );
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to find users with overlapping availability",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/availability/summary - Get weekly availability summary
   */
  async getWeeklyAvailabilitySummary(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ) {
    try {
      const userId = req.user!.id;

      const summary = await availabilityService.getWeeklyAvailabilitySummary(
        userId
      );

      res.json({
        success: true,
        data: summary,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting weekly availability summary:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate availability summary",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/availability/check - Check if user is available at specific time
   */
  async checkUserAvailability(req: Request, res: Response<ApiResponse>) {
    try {
      const { userId, dayOfWeek, time, timezone } = req.query;

      if (!userId || dayOfWeek === undefined || !time) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "userId, dayOfWeek, and time are required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const isAvailable = await availabilityService.isUserAvailable(
        userId as string,
        parseInt(dayOfWeek as string),
        time as string,
        timezone as string
      );

      res.json({
        success: true,
        data: {
          isAvailable,
          userId,
          dayOfWeek: parseInt(dayOfWeek as string),
          time,
          timezone,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error checking user availability:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check user availability",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/availability/slots/:userId/:dayOfWeek - Get available time slots
   */
  async getAvailableTimeSlots(req: Request, res: Response<ApiResponse>) {
    try {
      const { userId, dayOfWeek } = req.params;
      const { slotDuration } = req.query;

      const duration = slotDuration ? parseInt(slotDuration as string) : 60;
      const slots = await availabilityService.getAvailableTimeSlots(
        userId,
        parseInt(dayOfWeek),
        duration
      );

      res.json({
        success: true,
        data: {
          slots,
          total: slots.length,
          dayOfWeek: parseInt(dayOfWeek),
          slotDuration: duration,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting available time slots:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve available time slots",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const availabilityController = new AvailabilityController();
