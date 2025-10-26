import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";
import logger from "../utils/logger";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(401).json(response);
      return;
    }

    // Check if user has admin privileges
    // Note: You'll need to add isAdmin field to your User type and database
    if (!(user as any).isAdmin) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin privileges required",
          timestamp: new Date().toISOString(),
          requestId: (req.headers["x-request-id"] as string) || "unknown",
        },
      };
      res.status(403).json(response);
      return;
    }

    next();
  } catch (error) {
    logger.error("Error in admin auth middleware:", error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        timestamp: new Date().toISOString(),
        requestId: (req.headers["x-request-id"] as string) || "unknown",
      },
    };
    res.status(500).json(response);
  }
};
