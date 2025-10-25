import { Request, Response } from "express";
import { authService } from "@/services/authService";
import { ApiResponse, LoginRequest, RegisterRequest } from "@/types";
import {
  trackFailedAttempt,
  clearFailedAttempts,
} from "@/middleware/rateLimiting";
import logger from "@/utils/logger";

export class AuthController {
  // POST /api/v1/auth/register
  async register(
    req: Request<{}, ApiResponse, RegisterRequest>,
    res: Response<ApiResponse>
  ) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes("already exists") ? 409 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.message.includes("already exists")
            ? "USER_ALREADY_EXISTS"
            : "REGISTRATION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/login
  async login(
    req: Request<{}, ApiResponse, LoginRequest>,
    res: Response<ApiResponse>
  ) {
    const identifier = req.body.email || req.ip;

    try {
      const result = await authService.login(req.body);

      // Clear failed attempts on successful login
      clearFailedAttempts(identifier);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      // Track failed login attempt
      if (error.message.includes("Invalid email or password")) {
        trackFailedAttempt(identifier);
      }

      const statusCode = error.message.includes("Invalid email or password")
        ? 401
        : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "LOGIN_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/refresh
  async refreshToken(req: Request, res: Response<ApiResponse>) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: "REFRESH_TOKEN_MISSING",
            message: "Refresh token is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_REFRESH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/logout
  async logout(req: Request, res: Response<ApiResponse>) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.json({
        success: true,
        data: {
          message: "Logged out successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Logout error:", error);

      // Even if logout fails, we should return success to the client
      res.json({
        success: true,
        data: {
          message: "Logged out successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/forgot-password
  async forgotPassword(req: Request, res: Response<ApiResponse>) {
    try {
      const { email } = req.body;

      // Generate reset token and send email
      await authService.generatePasswordResetToken(email);

      res.json({
        success: true,
        data: {
          message: "Password reset instructions have been sent to your email",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "PASSWORD_RESET_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/reset-password
  async resetPassword(req: Request, res: Response<ApiResponse>) {
    try {
      const { token, password } = req.body;

      await authService.resetPassword(token, password);

      res.json({
        success: true,
        data: {
          message: "Password has been reset successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes("Invalid or expired")
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "PASSWORD_RESET_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/verify-email
  async verifyEmail(req: Request, res: Response<ApiResponse>) {
    try {
      const { token } = req.body;

      await authService.verifyEmail(token);

      res.json({
        success: true,
        data: {
          message: "Email has been verified successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes("Invalid or expired")
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "EMAIL_VERIFICATION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // POST /api/v1/auth/resend-verification
  async resendEmailVerification(req: Request, res: Response<ApiResponse>) {
    try {
      const { email } = req.body;

      await authService.resendEmailVerification(email);

      res.json({
        success: true,
        data: {
          message: "Verification email has been sent",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      const statusCode = error.message.includes("not found") ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "EMAIL_VERIFICATION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // GET /api/v1/auth/me - Get current user (protected route)
  async getCurrentUser(req: Request, res: Response<ApiResponse>) {
    try {
      // User is already attached to req by auth middleware
      res.json({
        success: true,
        data: {
          user: req.user,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "USER_FETCH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const authController = new AuthController();
