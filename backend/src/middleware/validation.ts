import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ApiResponse } from "@/types";

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map((detail) => detail.message));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map((detail) => detail.message));
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map((detail) => detail.message));
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
      return;
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters with uppercase, lowercase, number and special character",
    }),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  },
};

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password,
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),

  resendVerification: Joi.object({
    email: commonSchemas.email,
  }),
};

// User validation schemas
export const userSchemas = {
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    bio: Joi.string().max(500),
    location: Joi.string().max(100),
    timezone: Joi.string().max(50),
  }),

  getUserById: Joi.object({
    id: commonSchemas.id,
  }),
};

// Skill validation schemas
export const skillSchemas = {
  addUserSkill: Joi.object({
    skillId: commonSchemas.id,
    proficiencyLevel: Joi.number().integer().min(0).max(100).required(),
    canTeach: Joi.boolean().required(),
    wantsToLearn: Joi.boolean().required(),
  }),

  updateUserSkill: Joi.object({
    proficiencyLevel: Joi.number().integer().min(0).max(100),
    canTeach: Joi.boolean(),
    wantsToLearn: Joi.boolean(),
  }),
};

// Session validation schemas
export const sessionSchemas = {
  createSession: Joi.object({
    teacherId: commonSchemas.id,
    skillId: commonSchemas.id,
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().max(500),
    scheduledAt: Joi.date().iso().greater("now").required(),
    duration: Joi.number().integer().valid(30, 60, 120).required(),
    type: Joi.string()
      .valid("one_time", "recurring", "learning_circle", "micro_learning")
      .default("one_time"),
  }),

  updateSession: Joi.object({
    title: Joi.string().min(5).max(100),
    description: Joi.string().max(500),
    scheduledAt: Joi.date().iso().greater("now"),
    duration: Joi.number().integer().valid(30, 60, 120),
    status: Joi.string().valid(
      "pending",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show"
    ),
  }),

  rateSession: Joi.object({
    knowledgeRating: Joi.number().integer().min(1).max(5).required(),
    communicationRating: Joi.number().integer().min(1).max(5).required(),
    professionalismRating: Joi.number().integer().min(1).max(5).required(),
    feedback: Joi.string().max(500),
  }),
};
