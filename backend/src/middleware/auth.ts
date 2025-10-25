import { Request, Response, NextFunction } from "express";
import { authService } from "@/services/authService";
import { ApiResponse } from "@/types";

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTH_TOKEN_MISSING",
          message: "Access token is required",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
      return;
    }

    // Verify token and get user from database
    const user = await authService.verifyToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "AUTH_TOKEN_INVALID",
          message: "Invalid or expired token",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Authentication error",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] as string,
      },
    });
    return;
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const user = await authService.verifyToken(token);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't return an error, just continue without user
    next();
  }
};
