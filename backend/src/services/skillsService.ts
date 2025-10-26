import { Skill, UserSkill, SkillCategory, User } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface SkillWithStats extends Skill {
  _count: {
    userSkills: number;
  };
}

export interface UserSkillWithDetails extends UserSkill {
  skill: Skill;
}

export interface UserWithSkills extends User {
  skills: UserSkillWithDetails[];
}

export interface SkillSearchFilters {
  category?: SkillCategory;
  search?: string;
  canTeach?: boolean;
  wantsToLearn?: boolean;
  isVerified?: boolean;
  minProficiency?: number;
  maxProficiency?: number;
}

export interface UserSkillFilters {
  userId: string;
  category?: SkillCategory;
  canTeach?: boolean;
  wantsToLearn?: boolean;
  isVerified?: boolean;
}

export class SkillsService {
  /**
   * Get all skills with optional filtering
   */
  async getAllSkills(
    filters: SkillSearchFilters = {}
  ): Promise<SkillWithStats[]> {
    const where: any = {
      isActive: true,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await prisma.skill.findMany({
      where,
      include: {
        _count: {
          select: { userSkills: true },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Get skill categories with counts
   */
  async getSkillCategories() {
    const categories = await prisma.skill.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: {
        id: true,
      },
      orderBy: {
        category: "asc",
      },
    });

    return categories.map((cat: any) => ({
      category: cat.category,
      count: cat._count.id,
      displayName: this.getCategoryDisplayName(cat.category),
    }));
  }

  /**
   * Get user skills with filtering
   */
  async getUserSkills(
    filters: UserSkillFilters
  ): Promise<UserSkillWithDetails[]> {
    const where: any = {
      userId: filters.userId,
    };

    if (filters.category) {
      where.skill = {
        category: filters.category,
      };
    }

    if (filters.canTeach !== undefined) {
      where.canTeach = filters.canTeach;
    }

    if (filters.wantsToLearn !== undefined) {
      where.wantsToLearn = filters.wantsToLearn;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    return await prisma.userSkill.findMany({
      where,
      include: {
        skill: true,
      },
      orderBy: [{ skill: { category: "asc" } }, { skill: { name: "asc" } }],
    });
  }

  /**
   * Add skill to user
   */
  async addUserSkill(data: {
    userId: string;
    skillId: string;
    proficiencyLevel: number;
    canTeach: boolean;
    wantsToLearn: boolean;
  }): Promise<UserSkillWithDetails> {
    // Check if skill exists and is active
    const skill = await prisma.skill.findFirst({
      where: { id: data.skillId, isActive: true },
    });

    if (!skill) {
      throw new Error("Skill not found or inactive");
    }

    // Check if user already has this skill
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId: data.userId,
          skillId: data.skillId,
        },
      },
    });

    if (existingUserSkill) {
      throw new Error("User already has this skill");
    }

    return await prisma.userSkill.create({
      data,
      include: {
        skill: true,
      },
    });
  }

  /**
   * Update user skill
   */
  async updateUserSkill(
    userSkillId: string,
    userId: string,
    data: {
      proficiencyLevel?: number;
      canTeach?: boolean;
      wantsToLearn?: boolean;
    }
  ): Promise<UserSkillWithDetails> {
    // Verify the skill belongs to the user
    const existingUserSkill = await prisma.userSkill.findFirst({
      where: {
        id: userSkillId,
        userId: userId,
      },
    });

    if (!existingUserSkill) {
      throw new Error("User skill not found");
    }

    return await prisma.userSkill.update({
      where: { id: userSkillId },
      data,
      include: {
        skill: true,
      },
    });
  }

  /**
   * Remove user skill
   */
  async removeUserSkill(userSkillId: string, userId: string): Promise<void> {
    // Verify the skill belongs to the user
    const existingUserSkill = await prisma.userSkill.findFirst({
      where: {
        id: userSkillId,
        userId: userId,
      },
    });

    if (!existingUserSkill) {
      throw new Error("User skill not found");
    }

    await prisma.userSkill.delete({
      where: { id: userSkillId },
    });
  }

  /**
   * Get skill by ID
   */
  async getSkillById(skillId: string): Promise<SkillWithStats | null> {
    return await prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        _count: {
          select: { userSkills: true },
        },
      },
    });
  }

  /**
   * Search users by skills
   */
  async searchUsersBySkills(filters: {
    skillIds?: string[];
    canTeach?: boolean;
    wantsToLearn?: boolean;
    minRating?: number;
    isVerified?: boolean;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.skillIds && filters.skillIds.length > 0) {
      where.skills = {
        some: {
          skillId: { in: filters.skillIds },
          ...(filters.canTeach !== undefined && { canTeach: filters.canTeach }),
          ...(filters.wantsToLearn !== undefined && {
            wantsToLearn: filters.wantsToLearn,
          }),
        },
      };
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          skills: {
            include: {
              skill: true,
            },
            where: filters.skillIds
              ? {
                  skillId: { in: filters.skillIds },
                }
              : undefined,
          },
        },
        skip,
        take: limit,
        orderBy: [{ rating: "desc" }, { totalSessions: "desc" }],
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get proficiency tier from level
   */
  getProficiencyTier(level: number): string {
    if (level >= 0 && level <= 25) return "Beginner";
    if (level >= 26 && level <= 60) return "Intermediate";
    if (level >= 61 && level <= 85) return "Advanced";
    if (level >= 86 && level <= 100) return "Expert";
    return "Unknown";
  }

  /**
   * Get category display name
   */
  private getCategoryDisplayName(category: SkillCategory): string {
    const displayNames: Record<SkillCategory, string> = {
      TECHNOLOGY: "Technology",
      DESIGN: "Design",
      BUSINESS: "Business",
      MARKETING: "Marketing",
      LANGUAGES: "Languages",
      MUSIC: "Music",
      ARTS_CRAFTS: "Arts & Crafts",
      FITNESS: "Fitness",
      COOKING: "Cooking",
      PHOTOGRAPHY: "Photography",
      WRITING: "Writing",
      OTHER: "Other",
    };
    return displayNames[category] || category;
  }

  /**
   * Request new skill (for admin approval)
   */
  async requestNewSkill(data: {
    name: string;
    category: SkillCategory;
    description?: string;
    requestedBy: string;
  }) {
    // Check if skill already exists
    const existingSkill = await prisma.skill.findUnique({
      where: { name: data.name },
    });

    if (existingSkill) {
      throw new Error("Skill already exists");
    }

    // For now, we'll create the skill directly
    // In a full implementation, this would create a skill request for admin approval
    return await prisma.skill.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        isActive: true,
      },
    });
  }
}

export const skillsService = new SkillsService();
