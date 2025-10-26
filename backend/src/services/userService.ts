import prisma from "@/lib/prisma";
import logger from "@/utils/logger";
import { User, PaginationMeta } from "@/types";
import { contentModerationService } from "./contentModerationService";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  timezone?: string;
}

export interface UserPreferencesData {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  sessionReminders?: boolean;
  matchSuggestions?: boolean;
  messageNotifications?: boolean;
  creditNotifications?: boolean;
  systemNotifications?: boolean;
}

export interface UserSearchFilters {
  skills?: string[];
  location?: string;
  minRating?: number;
  canTeach?: boolean;
  wantsToLearn?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface ProfileCompleteness {
  score: number;
  totalFields: number;
  completedFields: number;
  missingFields: string[];
  suggestions: string[];
}

export interface UserSearchResult {
  users: User[];
  pagination: PaginationMeta;
}

export interface AvatarUploadResult {
  filename: string;
  url: string;
  size: number;
}

export class UserService {
  // Get user profile by ID
  async getUserProfile(
    userId: string,
    requestingUserId?: string
  ): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          location: true,
          timezone: true,
          isVerified: true,
          isAdmin: true,
          rating: true,
          totalSessions: true,
          creditBalance: requestingUserId === userId, // Only show credit balance to self
          joinedAt: true,
          lastActive: true,
          skills: {
            include: {
              skill: true,
            },
          },
          preferences: requestingUserId === userId, // Only show preferences to self
        },
      });

      if (!user) {
        return null;
      }

      // Convert Prisma result to User type
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        timezone: user.timezone,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        rating: Number(user.rating),
        totalSessions: user.totalSessions,
        creditBalance: user.creditBalance || 0,
        joinedAt: user.joinedAt,
        lastActive: user.lastActive,
      };
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      throw new Error("Failed to fetch user profile");
    }
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    try {
      // Moderate profile content before updating
      const moderationResult = contentModerationService.moderateProfile({
        bio: data.bio,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      if (!moderationResult.isValid) {
        logger.warn(
          `Profile update blocked for user ${userId}:`,
          moderationResult.issues
        );
        throw new Error(
          `Profile contains inappropriate content: ${moderationResult.issues.join(
            ", "
          )}`
        );
      }

      // Use cleaned data if any content was flagged
      const cleanedData = {
        ...data,
        ...moderationResult.cleanedData,
      };

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...cleanedData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          location: true,
          timezone: true,
          isVerified: true,
          isAdmin: true,
          rating: true,
          totalSessions: true,
          creditBalance: true,
          joinedAt: true,
          lastActive: true,
        },
      });

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        location: updatedUser.location,
        timezone: updatedUser.timezone,
        isVerified: updatedUser.isVerified,
        isAdmin: updatedUser.isAdmin,
        rating: Number(updatedUser.rating),
        totalSessions: updatedUser.totalSessions,
        creditBalance: updatedUser.creditBalance,
        joinedAt: updatedUser.joinedAt,
        lastActive: updatedUser.lastActive,
      };
    } catch (error) {
      logger.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  }

  // Upload and update user avatar
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File
  ): Promise<AvatarUploadResult> {
    try {
      // Validate file type and size
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
        );
      }

      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size is 5MB.");
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `avatar_${userId}_${Date.now()}${fileExtension}`;
      const uploadPath = path.join(process.cwd(), "uploads", "avatars");
      const filePath = path.join(uploadPath, filename);

      // Ensure upload directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Update user avatar in database
      const avatarUrl = `/uploads/avatars/${filename}`;
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      return {
        filename,
        url: avatarUrl,
        size: file.size,
      };
    } catch (error) {
      logger.error("Error uploading avatar:", error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferencesData> {
    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPreferences = await prisma.userPreferences.create({
          data: {
            userId,
            emailNotifications: true,
            pushNotifications: true,
            sessionReminders: true,
            matchSuggestions: true,
            messageNotifications: true,
            creditNotifications: true,
            systemNotifications: true,
          },
        });

        return {
          emailNotifications: defaultPreferences.emailNotifications,
          pushNotifications: defaultPreferences.pushNotifications,
          sessionReminders: defaultPreferences.sessionReminders,
          matchSuggestions: defaultPreferences.matchSuggestions,
          messageNotifications: defaultPreferences.messageNotifications,
          creditNotifications: defaultPreferences.creditNotifications,
          systemNotifications: defaultPreferences.systemNotifications,
        };
      }

      return {
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        sessionReminders: preferences.sessionReminders,
        matchSuggestions: preferences.matchSuggestions,
        messageNotifications: preferences.messageNotifications,
        creditNotifications: preferences.creditNotifications,
        systemNotifications: preferences.systemNotifications,
      };
    } catch (error) {
      logger.error("Error fetching user preferences:", error);
      throw new Error("Failed to fetch user preferences");
    }
  }

  // Update user preferences
  async updateUserPreferences(
    userId: string,
    data: UserPreferencesData
  ): Promise<UserPreferencesData> {
    try {
      const updatedPreferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          userId,
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          sessionReminders: data.sessionReminders ?? true,
          matchSuggestions: data.matchSuggestions ?? true,
          messageNotifications: data.messageNotifications ?? true,
          creditNotifications: data.creditNotifications ?? true,
          systemNotifications: data.systemNotifications ?? true,
        },
      });

      return {
        emailNotifications: updatedPreferences.emailNotifications,
        pushNotifications: updatedPreferences.pushNotifications,
        sessionReminders: updatedPreferences.sessionReminders,
        matchSuggestions: updatedPreferences.matchSuggestions,
        messageNotifications: updatedPreferences.messageNotifications,
        creditNotifications: updatedPreferences.creditNotifications,
        systemNotifications: updatedPreferences.systemNotifications,
      };
    } catch (error) {
      logger.error("Error updating user preferences:", error);
      throw new Error("Failed to update user preferences");
    }
  }

  // Calculate profile completeness
  async calculateProfileCompleteness(
    userId: string
  ): Promise<ProfileCompleteness> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          skills: true,
          availability: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const fields = [
        { name: "firstName", value: user.firstName, weight: 1 },
        { name: "lastName", value: user.lastName, weight: 1 },
        { name: "email", value: user.email, weight: 1 },
        { name: "bio", value: user.bio, weight: 2 },
        { name: "location", value: user.location, weight: 1 },
        { name: "avatar", value: user.avatar, weight: 1 },
        { name: "skills", value: user.skills.length > 0, weight: 3 },
        {
          name: "availability",
          value: user.availability.length > 0,
          weight: 2,
        },
      ];

      const completedFields = fields.filter((field) => {
        if (typeof field.value === "boolean") return field.value;
        return field.value && field.value.toString().trim().length > 0;
      });

      const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
      const completedWeight = completedFields.reduce(
        (sum, field) => sum + field.weight,
        0
      );
      const score = Math.round((completedWeight / totalWeight) * 100);

      const missingFields = fields
        .filter((field) => {
          if (typeof field.value === "boolean") return !field.value;
          return !field.value || field.value.toString().trim().length === 0;
        })
        .map((field) => field.name);

      const suggestions = [];
      if (missingFields.includes("bio")) {
        suggestions.push(
          "Add a bio to help others understand your background and interests"
        );
      }
      if (missingFields.includes("skills")) {
        suggestions.push("Add skills you can teach or want to learn");
      }
      if (missingFields.includes("availability")) {
        suggestions.push("Set your availability to help with scheduling");
      }
      if (missingFields.includes("avatar")) {
        suggestions.push(
          "Upload a profile picture to make your profile more personal"
        );
      }
      if (missingFields.includes("location")) {
        suggestions.push("Add your location to connect with nearby users");
      }

      return {
        score,
        totalFields: fields.length,
        completedFields: completedFields.length,
        missingFields,
        suggestions,
      };
    } catch (error) {
      logger.error("Error calculating profile completeness:", error);
      throw new Error("Failed to calculate profile completeness");
    }
  }

  // Search and discover users
  async searchUsers(filters: UserSearchFilters): Promise<UserSearchResult> {
    try {
      const {
        skills = [],
        location,
        minRating = 0,
        canTeach,
        wantsToLearn,
        isVerified,
        page = 1,
        limit = 20,
        search,
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        rating: {
          gte: minRating,
        },
      };

      if (isVerified !== undefined) {
        where.isVerified = isVerified;
      }

      if (location) {
        where.location = {
          contains: location,
          mode: "insensitive",
        };
      }

      if (search) {
        where.OR = [
          {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            bio: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }

      if (
        skills.length > 0 ||
        canTeach !== undefined ||
        wantsToLearn !== undefined
      ) {
        where.skills = {
          some: {
            ...(skills.length > 0 && {
              skillId: {
                in: skills,
              },
            }),
            ...(canTeach !== undefined && { canTeach }),
            ...(wantsToLearn !== undefined && { wantsToLearn }),
          },
        };
      }

      // Get total count
      const total = await prisma.user.count({ where });

      // Get users
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          location: true,
          timezone: true,
          isVerified: true,
          isAdmin: true,
          rating: true,
          totalSessions: true,
          joinedAt: true,
          lastActive: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { rating: "desc" },
          { totalSessions: "desc" },
          { lastActive: "desc" },
        ],
      });

      const formattedUsers: User[] = users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        timezone: user.timezone,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        rating: Number(user.rating),
        totalSessions: user.totalSessions,
        creditBalance: 0, // Don't expose credit balance in search results
        joinedAt: user.joinedAt,
        lastActive: user.lastActive,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }

  // Delete user account
  async deleteAccount(userId: string): Promise<void> {
    try {
      // Check for active sessions
      const activeSessions = await prisma.session.count({
        where: {
          OR: [{ teacherId: userId }, { learnerId: userId }],
          status: {
            in: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
          },
        },
      });

      if (activeSessions > 0) {
        throw new Error(
          "Cannot delete account with active sessions. Please complete or cancel all sessions first."
        );
      }

      // Anonymize user data instead of hard delete to maintain session integrity
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@skillsync.com`,
          firstName: "Deleted",
          lastName: "User",
          bio: null,
          location: null,
          avatar: null,
          passwordHash: "deleted",
          passwordResetToken: null,
          passwordResetExpires: null,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      // Delete related data that should not be preserved
      await Promise.all([
        prisma.userPreferences.deleteMany({ where: { userId } }),
        prisma.refreshToken.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.matchInteraction.deleteMany({ where: { userId } }),
      ]);

      logger.info(`User account ${userId} has been anonymized and deleted`);
    } catch (error) {
      logger.error("Error deleting user account:", error);
      throw error;
    }
  }
}
