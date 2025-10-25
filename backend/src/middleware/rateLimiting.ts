import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { ApiResponse } from "@/types";

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again later",
      timestamp: new Date().toISOString(),
      requestId: "",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts, please try again later",
      timestamp: new Date().toISOString(),
      requestId: "",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Very strict rate limiting for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: {
      code: "PASSWORD_RESET_RATE_LIMIT_EXCEEDED",
      message: "Too many password reset attempts, please try again later",
      timestamp: new Date().toISOString(),
      requestId: "",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for email verification
export const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 verification emails per 10 minutes
  message: {
    success: false,
    error: {
      code: "EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED",
      message: "Too many verification email requests, please try again later",
      timestamp: new Date().toISOString(),
      requestId: "",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Account lockout tracking (in-memory for simplicity, use Redis in production)
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export const accountLockoutMiddleware = (
  req: Request,
  res: Response<ApiResponse>,
  next: Function
) => {
  const identifier = req.body.email || req.ip;
  const attempts = failedAttempts.get(identifier);

  if (attempts && attempts.count >= 5) {
    const lockoutTime = 30 * 60 * 1000; // 30 minutes
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();

    if (timeSinceLastAttempt < lockoutTime) {
      return res.status(429).json({
        success: false,
        error: {
          code: "ACCOUNT_TEMPORARILY_LOCKED",
          message:
            "Account temporarily locked due to too many failed attempts. Please try again later.",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } else {
      // Reset attempts after lockout period
      failedAttempts.delete(identifier);
    }
  }

  next();
};

export const trackFailedAttempt = (identifier: string) => {
  const attempts = failedAttempts.get(identifier) || {
    count: 0,
    lastAttempt: new Date(),
  };
  attempts.count += 1;
  attempts.lastAttempt = new Date();
  failedAttempts.set(identifier, attempts);
};

export const clearFailedAttempts = (identifier: string) => {
  failedAttempts.delete(identifier);
};

// Clean up old failed attempts periodically
setInterval(() => {
  const now = Date.now();
  const cleanupTime = 60 * 60 * 1000; // 1 hour

  for (const [identifier, attempts] of failedAttempts.entries()) {
    if (now - attempts.lastAttempt.getTime() > cleanupTime) {
      failedAttempts.delete(identifier);
    }
  }
}, 10 * 60 * 1000); // Run cleanup every 10 minutes
