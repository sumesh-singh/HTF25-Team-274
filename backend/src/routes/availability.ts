import { Router } from "express";
import Joi from "joi";
import { validateRequest, commonSchemas } from "@/middleware/validation";
import { authenticateToken, optionalAuth } from "@/middleware/auth";
import { availabilityController } from "@/controllers/availabilityController";

const router = Router();

// Availability validation schemas
const availabilitySchemas = {
  addAvailability: Joi.object({
    dayOfWeek: Joi.number().integer().min(0).max(6).required(),
    startTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    timezone: Joi.string().max(50).required(),
  }),

  updateAvailability: Joi.object({
    dayOfWeek: Joi.number().integer().min(0).max(6),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: Joi.string().max(50),
    isActive: Joi.boolean(),
  }),

  getUserAvailability: Joi.object({
    dayOfWeek: Joi.number().integer().min(0).max(6),
    isActive: Joi.boolean(),
  }),

  checkAvailability: Joi.object({
    userId: Joi.string().uuid().required(),
    dayOfWeek: Joi.number().integer().min(0).max(6).required(),
    time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    timezone: Joi.string().max(50),
  }),

  getTimeSlots: Joi.object({
    slotDuration: Joi.number().integer().min(15).max(480), // 15 minutes to 8 hours
  }),

  getMatches: Joi.object({
    minOverlapMinutes: Joi.number().integer().min(15).max(1440), // 15 minutes to 24 hours
  }),
};

// GET /api/v1/availability/users/:id - Get user availability
router.get(
  "/users/:id",
  optionalAuth,
  validateRequest({
    params: commonSchemas.params.id,
    query: availabilitySchemas.getUserAvailability,
  }),
  availabilityController.getUserAvailability.bind(availabilityController)
);

// POST /api/v1/availability - Add availability slot
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: availabilitySchemas.addAvailability }),
  availabilityController.addAvailabilitySlot.bind(availabilityController)
);

// PUT /api/v1/availability/:id - Update availability slot
router.put(
  "/:id",
  authenticateToken,
  validateRequest({
    params: commonSchemas.params.id,
    body: availabilitySchemas.updateAvailability,
  }),
  availabilityController.updateAvailabilitySlot.bind(availabilityController)
);

// DELETE /api/v1/availability/:id - Remove availability slot
router.delete(
  "/:id",
  authenticateToken,
  validateRequest({ params: commonSchemas.params.id }),
  availabilityController.removeAvailabilitySlot.bind(availabilityController)
);

// GET /api/v1/availability/overlap/:userId - Get availability overlap with another user
router.get(
  "/overlap/:userId",
  authenticateToken,
  validateRequest({
    params: Joi.object({ userId: Joi.string().uuid().required() }),
  }),
  availabilityController.getAvailabilityOverlap.bind(availabilityController)
);

// GET /api/v1/availability/matches - Get users with overlapping availability
router.get(
  "/matches",
  authenticateToken,
  validateRequest({ query: availabilitySchemas.getMatches }),
  availabilityController.getUsersWithOverlappingAvailability.bind(
    availabilityController
  )
);

// GET /api/v1/availability/summary - Get weekly availability summary
router.get(
  "/summary",
  authenticateToken,
  availabilityController.getWeeklyAvailabilitySummary.bind(
    availabilityController
  )
);

// GET /api/v1/availability/check - Check if user is available at specific time
router.get(
  "/check",
  optionalAuth,
  validateRequest({ query: availabilitySchemas.checkAvailability }),
  availabilityController.checkUserAvailability.bind(availabilityController)
);

// GET /api/v1/availability/slots/:userId/:dayOfWeek - Get available time slots
router.get(
  "/slots/:userId/:dayOfWeek",
  optionalAuth,
  validateRequest({
    params: Joi.object({
      userId: Joi.string().uuid().required(),
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
    }),
    query: availabilitySchemas.getTimeSlots,
  }),
  availabilityController.getAvailableTimeSlots.bind(availabilityController)
);

export default router;
