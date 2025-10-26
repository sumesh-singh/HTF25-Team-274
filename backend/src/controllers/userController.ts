import { Request, Response } from "express";
import {
  UserService,
  UpdateProfileData,
  UserPreferencesData,
  UserSearchFilters,
} from "@/services/userService";
import { ApiResponse } from "@/types";
import logger from "@/utils/logger";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // GET /api/v1/users/profile - Get current user profile
  async getCurrentUserProfile(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await this.userService.getUserProfile(userId, userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error fetching current user profile:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PROFILE_FETCH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // PUT /api/v1/users/profile - Update current user profile
  async updateCurrentUserProfile(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const updateData: UpdateProfileData = req.body;

      const updatedUser = await this.userService.updateProfile(
        userId,
        updateData
      );

      res.json({
        success: true,
        data: { user: updatedUser },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error updating user profile:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PROFILE_UPDATE_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // GET /api/v1/users/:id - Get user by ID
  async getUserById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const requestingUserId = req.user?.id;

      const user = await this.userService.getUserProfile(id, requestingUserId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error fetching user by ID:", error);
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

  // POST /api/v1/users/avatar - Upload user avatar
  async uploadAvatar(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: "FILE_MISSING",
            message: "No file uploaded",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] as string,
          },
        });
        return;
      }

      const result = await this.userService.uploadAvatar(userId, file);

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error uploading avatar:", error);
      const statusCode =
        error.message.includes("Invalid file type") ||
        error.message.includes("File size too large")
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "AVATAR_UPLOAD_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // GET /api/v1/users/preferences - Get user preferences
  async getUserPreferences(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferences = await this.userService.getUserPreferences(userId);

      res.json({
        success: true,
        data: { preferences },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error fetching user preferences:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PREFERENCES_FETCH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // PUT /api/v1/users/preferences - Update user preferences
  async updateUserPreferences(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const preferencesData: UserPreferencesData = req.body;

      const updatedPreferences = await this.userService.updateUserPreferences(
        userId,
        preferencesData
      );

      res.json({
        success: true,
        data: { preferences: updatedPreferences },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PREFERENCES_UPDATE_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // GET /api/v1/users/profile/completeness - Get profile completeness
  async getProfileCompleteness(
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const completeness = await this.userService.calculateProfileCompleteness(
        userId
      );

      res.json({
        success: true,
        data: { completeness },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error calculating profile completeness:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "COMPLETENESS_CALCULATION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // GET /api/v1/users/search - Search and discover users
  async searchUsers(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const filters: UserSearchFilters = {
        skills: req.query.skills
          ? Array.isArray(req.query.skills)
            ? (req.query.skills as string[])
            : [req.query.skills as string]
          : undefined,
        location: req.query.location as string,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        canTeach: req.query.canTeach
          ? req.query.canTeach === "true"
          : undefined,
        wantsToLearn: req.query.wantsToLearn
          ? req.query.wantsToLearn === "true"
          : undefined,
        isVerified: req.query.isVerified
          ? req.query.isVerified === "true"
          : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        search: req.query.search as string,
      };

      const result = await this.userService.searchUsers(filters);

      res.json({
        success: true,
        data: result.users,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error searching users:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "USER_SEARCH_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  // DELETE /api/v1/users/account - Delete user account
  async deleteAccount(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user!.id;
      await this.userService.deleteAccount(userId);

      res.json({
        success: true,
        data: {
          message: "Account has been successfully deleted",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error: any) {
      logger.error("Error deleting user account:", error);
      const statusCode = error.message.includes("active sessions") ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: "ACCOUNT_DELETION_FAILED",
          message: error.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const userController = new UserController();
