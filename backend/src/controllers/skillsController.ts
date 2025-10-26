import { Request, Response } from "express";
import { SkillCategory } from "@prisma/client";
import { skillsService } from "@/services/skillsService";
import { ApiResponse, AuthenticatedRequest } from "@/types";

export class SkillsController {
  /**
   * GET /api/v1/skills - Get all skills with filtering
   */
  async getAllSkills(req: Request, res: Response<ApiResponse>) {
    try {
      const {
        category,
        search,
        canTeach,
        wantsToLearn,
        isVerified,
        minProficiency,
        maxProficiency,
      } = req.query;

      const filters = {
        ...(category && { category: category as SkillCategory }),
        ...(search && { search: search as string }),
        ...(canTeach !== undefined && { canTeach: canTeach === "true" }),
        ...(wantsToLearn !== undefined && {
          wantsToLearn: wantsToLearn === "true",
        }),
        ...(isVerified !== undefined && { isVerified: isVerified === "true" }),
        ...(minProficiency && {
          minProficiency: parseInt(minProficiency as string),
        }),
        ...(maxProficiency && {
          maxProficiency: parseInt(maxProficiency as string),
        }),
      };

      const skills = await skillsService.getAllSkills(filters);

      res.json({
        success: true,
        data: {
          skills,
          total: skills.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting skills:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve skills",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/categories - Get skill categories
   */
  async getSkillCategories(req: Request, res: Response<ApiResponse>) {
    try {
      const categories = await skillsService.getSkillCategories();

      res.json({
        success: true,
        data: {
          categories,
          total: categories.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting skill categories:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve skill categories",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * POST /api/v1/skills/request - Request new skill
   */
  async requestNewSkill(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const { name, category, description } = req.body;
      const userId = req.user!.id;

      const skill = await skillsService.requestNewSkill({
        name,
        category,
        description,
        requestedBy: userId,
      });

      res.status(201).json({
        success: true,
        data: {
          skill,
          message: "Skill request submitted successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error requesting new skill:", error);

      if (error instanceof Error && error.message === "Skill already exists") {
        res.status(409).json({
          success: false,
          error: {
            code: "SKILL_ALREADY_EXISTS",
            message: "A skill with this name already exists",
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
          message: "Failed to request new skill",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/users/:id - Get user skills
   */
  async getUserSkills(req: Request, res: Response<ApiResponse>) {
    try {
      const { id: userId } = req.params;
      const { category, canTeach, wantsToLearn, isVerified } = req.query;

      const filters = {
        userId,
        ...(category && { category: category as SkillCategory }),
        ...(canTeach !== undefined && { canTeach: canTeach === "true" }),
        ...(wantsToLearn !== undefined && {
          wantsToLearn: wantsToLearn === "true",
        }),
        ...(isVerified !== undefined && { isVerified: isVerified === "true" }),
      };

      const userSkills = await skillsService.getUserSkills(filters);

      // Add proficiency tiers to the response
      const skillsWithTiers = userSkills.map((userSkill) => ({
        ...userSkill,
        proficiencyTier: skillsService.getProficiencyTier(
          userSkill.proficiencyLevel
        ),
      }));

      res.json({
        success: true,
        data: {
          skills: skillsWithTiers,
          total: skillsWithTiers.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error getting user skills:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve user skills",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * POST /api/v1/skills/users/skills - Add user skill
   */
  async addUserSkill(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const { skillId, proficiencyLevel, canTeach, wantsToLearn } = req.body;
      const userId = req.user!.id;

      const userSkill = await skillsService.addUserSkill({
        userId,
        skillId,
        proficiencyLevel,
        canTeach,
        wantsToLearn,
      });

      const userSkillWithTier = {
        ...userSkill,
        proficiencyTier: skillsService.getProficiencyTier(
          userSkill.proficiencyLevel
        ),
      };

      res.status(201).json({
        success: true,
        data: {
          userSkill: userSkillWithTier,
          message: "Skill added successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error adding user skill:", error);

      if (error instanceof Error) {
        if (error.message === "Skill not found or inactive") {
          res.status(404).json({
            success: false,
            error: {
              code: "SKILL_NOT_FOUND",
              message: "The specified skill was not found or is inactive",
              timestamp: new Date().toISOString(),
              requestId: req.headers["x-request-id"] as string,
            },
          });
          return;
        }

        if (error.message === "User already has this skill") {
          res.status(409).json({
            success: false,
            error: {
              code: "SKILL_ALREADY_EXISTS",
              message: "You already have this skill in your profile",
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
          message: "Failed to add skill",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * PUT /api/v1/skills/users/skills/:id - Update user skill
   */
  async updateUserSkill(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const { id: userSkillId } = req.params;
      const { proficiencyLevel, canTeach, wantsToLearn } = req.body;
      const userId = req.user!.id;

      const userSkill = await skillsService.updateUserSkill(
        userSkillId,
        userId,
        {
          proficiencyLevel,
          canTeach,
          wantsToLearn,
        }
      );

      const userSkillWithTier = {
        ...userSkill,
        proficiencyTier: skillsService.getProficiencyTier(
          userSkill.proficiencyLevel
        ),
      };

      res.json({
        success: true,
        data: {
          userSkill: userSkillWithTier,
          message: "Skill updated successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error updating user skill:", error);

      if (error instanceof Error && error.message === "User skill not found") {
        res.status(404).json({
          success: false,
          error: {
            code: "USER_SKILL_NOT_FOUND",
            message: "The specified skill was not found in your profile",
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
          message: "Failed to update skill",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * DELETE /api/v1/skills/users/skills/:id - Remove user skill
   */
  async removeUserSkill(req: AuthenticatedRequest, res: Response<ApiResponse>) {
    try {
      const { id: userSkillId } = req.params;
      const userId = req.user!.id;

      await skillsService.removeUserSkill(userSkillId, userId);

      res.json({
        success: true,
        data: {
          message: "Skill removed successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error removing user skill:", error);

      if (error instanceof Error && error.message === "User skill not found") {
        res.status(404).json({
          success: false,
          error: {
            code: "USER_SKILL_NOT_FOUND",
            message: "The specified skill was not found in your profile",
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
          message: "Failed to remove skill",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }

  /**
   * GET /api/v1/skills/search/users - Search users by skills
   */
  async searchUsersBySkills(req: Request, res: Response<ApiResponse>) {
    try {
      const {
        skillIds,
        canTeach,
        wantsToLearn,
        minRating,
        isVerified,
        location,
        page,
        limit,
      } = req.query;

      const filters = {
        ...(skillIds && {
          skillIds: Array.isArray(skillIds)
            ? (skillIds as string[])
            : [skillIds as string],
        }),
        ...(canTeach !== undefined && { canTeach: canTeach === "true" }),
        ...(wantsToLearn !== undefined && {
          wantsToLearn: wantsToLearn === "true",
        }),
        ...(minRating && { minRating: parseFloat(minRating as string) }),
        ...(isVerified !== undefined && { isVerified: isVerified === "true" }),
        ...(location && { location: location as string }),
        ...(page && { page: parseInt(page as string) }),
        ...(limit && { limit: parseInt(limit as string) }),
      };

      const result = await skillsService.searchUsersBySkills(filters);

      // Add proficiency tiers to user skills
      const usersWithTiers = result.users.map((user: any) => ({
        ...user,
        skills: user.skills.map((userSkill: any) => ({
          ...userSkill,
          proficiencyTier: skillsService.getProficiencyTier(
            userSkill.proficiencyLevel
          ),
        })),
      }));

      res.json({
        success: true,
        data: {
          users: usersWithTiers,
          pagination: result.pagination,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    } catch (error) {
      console.error("Error searching users by skills:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search users",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] as string,
        },
      });
    }
  }
}

export const skillsController = new SkillsController();
