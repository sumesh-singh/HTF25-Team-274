import prisma from "@/lib/prisma";
import {
  User,
  UserSkill,
  Availability,
  MatchInteraction,
  SkillCategory,
  MatchInteractionType,
} from "@prisma/client";
import logger from "@/utils/logger";

export interface MatchScore {
  userId: string;
  score: number;
  breakdown: {
    skillComplementarity: number;
    availabilityOverlap: number;
    learningStyleCompatibility: number;
    ratingHistory: number;
    responseRate: number;
  };
  explanation: string;
  commonSkills: string[];
}

export interface MatchFilters {
  skillCategories?: SkillCategory[];
  proficiencyLevels?: number[];
  location?: string;
  minRating?: number;
  maxDistance?: number;
  availabilityDays?: number[];
  availabilityTimes?: string[];
}

export interface UserWithDetails extends User {
  skills: (UserSkill & { skill: { name: string; category: SkillCategory } })[];
  availability: Availability[];
  _count: {
    teachingSessions: number;
    learningSessions: number;
  };
}

export interface MatchSuggestion {
  user: UserWithDetails;
  score: number;
  breakdown: {
    skillComplementarity: number;
    availabilityOverlap: number;
    learningStyleCompatibility: number;
    ratingHistory: number;
    responseRate: number;
  };
  explanation: string;
  commonSkills: string[];
  complementarySkills: Array<{
    userCanTeach: string;
    userWantsToLearn: string;
    targetCanTeach: string;
    targetWantsToLearn: string;
  }>;
}

class MatchingService {
  // Weights for multi-dimensional scoring
  private readonly WEIGHTS = {
    SKILL_COMPLEMENTARITY: 0.4,
    AVAILABILITY_OVERLAP: 0.2,
    LEARNING_STYLE_COMPATIBILITY: 0.15,
    RATING_HISTORY: 0.15,
    RESPONSE_RATE: 0.1,
  };

  /**
   * Get match suggestions for a user
   */
  async getMatchSuggestions(
    userId: string,
    filters?: MatchFilters,
    limit: number = 20
  ): Promise<MatchSuggestion[]> {
    try {
      // Get current user with details
      const currentUser = await this.getUserWithDetails(userId);
      if (!currentUser) {
        throw new Error("User not found");
      }

      // Get potential matches (exclude blocked users and current user)
      const blockedUserIds = await this.getBlockedUserIds(userId);
      const potentialMatches = await this.getPotentialMatches(
        userId,
        blockedUserIds,
        filters
      );

      // Calculate match scores
      const matchScores = await Promise.all(
        potentialMatches.map(async (targetUser) => {
          const matchScore = await this.calculateMatchScore(
            currentUser,
            targetUser
          );
          return {
            user: targetUser,
            ...matchScore,
            complementarySkills: this.findComplementarySkills(
              currentUser,
              targetUser
            ),
          };
        })
      );

      // Sort by score and return top matches
      return matchScores.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      logger.error("Error getting match suggestions:", error);
      throw error;
    }
  }

  /**
   * Calculate multi-dimensional match score between two users
   */
  async calculateMatchScore(
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): Promise<MatchScore> {
    try {
      const breakdown = {
        skillComplementarity: this.calculateSkillComplementarity(
          currentUser,
          targetUser
        ),
        availabilityOverlap: this.calculateAvailabilityOverlap(
          currentUser,
          targetUser
        ),
        learningStyleCompatibility: this.calculateLearningStyleCompatibility(
          currentUser,
          targetUser
        ),
        ratingHistory: this.calculateRatingHistoryScore(targetUser),
        responseRate: await this.calculateResponseRate(targetUser.id),
      };

      const score =
        breakdown.skillComplementarity * this.WEIGHTS.SKILL_COMPLEMENTARITY +
        breakdown.availabilityOverlap * this.WEIGHTS.AVAILABILITY_OVERLAP +
        breakdown.learningStyleCompatibility *
          this.WEIGHTS.LEARNING_STYLE_COMPATIBILITY +
        breakdown.ratingHistory * this.WEIGHTS.RATING_HISTORY +
        breakdown.responseRate * this.WEIGHTS.RESPONSE_RATE;

      const commonSkills = this.findCommonSkills(currentUser, targetUser);
      const explanation = this.generateMatchExplanation(
        score,
        breakdown,
        commonSkills,
        currentUser,
        targetUser
      );

      return {
        userId: targetUser.id,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        breakdown,
        explanation,
        commonSkills,
      };
    } catch (error) {
      logger.error("Error calculating match score:", error);
      throw error;
    }
  }

  /**
   * Calculate skill complementarity score (40% weight)
   */
  private calculateSkillComplementarity(
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): number {
    const currentUserTeachingSkills = currentUser.skills.filter(
      (s) => s.canTeach
    );
    const currentUserLearningSkills = currentUser.skills.filter(
      (s) => s.wantsToLearn
    );
    const targetUserTeachingSkills = targetUser.skills.filter(
      (s) => s.canTeach
    );
    const targetUserLearningSkills = targetUser.skills.filter(
      (s) => s.wantsToLearn
    );

    let complementarityScore = 0;
    let totalPossibleMatches = 0;

    // Check if current user can teach what target user wants to learn
    currentUserTeachingSkills.forEach((teachingSkill) => {
      const matchingLearningSkill = targetUserLearningSkills.find(
        (learningSkill) => learningSkill.skillId === teachingSkill.skillId
      );
      if (matchingLearningSkill) {
        // Higher score for higher proficiency difference (expert teaching beginner)
        const proficiencyBonus =
          Math.max(
            0,
            teachingSkill.proficiencyLevel -
              matchingLearningSkill.proficiencyLevel
          ) / 100;
        complementarityScore += 0.5 + proficiencyBonus * 0.3;
      }
      totalPossibleMatches++;
    });

    // Check if target user can teach what current user wants to learn
    targetUserTeachingSkills.forEach((teachingSkill) => {
      const matchingLearningSkill = currentUserLearningSkills.find(
        (learningSkill) => learningSkill.skillId === teachingSkill.skillId
      );
      if (matchingLearningSkill) {
        const proficiencyBonus =
          Math.max(
            0,
            teachingSkill.proficiencyLevel -
              matchingLearningSkill.proficiencyLevel
          ) / 100;
        complementarityScore += 0.5 + proficiencyBonus * 0.3;
      }
      totalPossibleMatches++;
    });

    return totalPossibleMatches > 0
      ? Math.min(1, complementarityScore / totalPossibleMatches)
      : 0;
  }

  /**
   * Calculate availability overlap score (20% weight)
   */
  private calculateAvailabilityOverlap(
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): number {
    if (!currentUser.availability.length || !targetUser.availability.length) {
      return 0;
    }

    let overlapHours = 0;
    let totalHours = 0;

    // Group availability by day of week
    const currentUserAvailability = this.groupAvailabilityByDay(
      currentUser.availability
    );
    const targetUserAvailability = this.groupAvailabilityByDay(
      targetUser.availability
    );

    // Calculate overlap for each day
    for (let day = 0; day < 7; day++) {
      const currentDaySlots = currentUserAvailability[day] || [];
      const targetDaySlots = targetUserAvailability[day] || [];

      if (currentDaySlots.length === 0 || targetDaySlots.length === 0) {
        continue;
      }

      // Calculate total available hours for this day
      const currentDayHours = currentDaySlots.reduce(
        (sum, slot) =>
          sum + this.calculateHoursDifference(slot.startTime, slot.endTime),
        0
      );
      const targetDayHours = targetDaySlots.reduce(
        (sum, slot) =>
          sum + this.calculateHoursDifference(slot.startTime, slot.endTime),
        0
      );

      totalHours += Math.max(currentDayHours, targetDayHours);

      // Calculate overlap hours
      currentDaySlots.forEach((currentSlot) => {
        targetDaySlots.forEach((targetSlot) => {
          const overlap = this.calculateTimeOverlap(
            currentSlot.startTime,
            currentSlot.endTime,
            targetSlot.startTime,
            targetSlot.endTime
          );
          overlapHours += overlap;
        });
      });
    }

    return totalHours > 0 ? Math.min(1, overlapHours / totalHours) : 0;
  }

  /**
   * Calculate learning style compatibility score (15% weight)
   */
  private calculateLearningStyleCompatibility(
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): number {
    // For now, use a simple heuristic based on skill categories and session history
    const currentUserCategories = new Set(
      currentUser.skills.map((s) => s.skill.category)
    );
    const targetUserCategories = new Set(
      targetUser.skills.map((s) => s.skill.category)
    );

    const commonCategories = [...currentUserCategories].filter((cat) =>
      targetUserCategories.has(cat)
    );
    const totalCategories = new Set([
      ...currentUserCategories,
      ...targetUserCategories,
    ]).size;

    const categoryCompatibility =
      totalCategories > 0 ? commonCategories.length / totalCategories : 0;

    // Factor in session experience (users with similar session counts might be more compatible)
    const sessionDifference = Math.abs(
      currentUser.totalSessions - targetUser.totalSessions
    );
    const sessionCompatibility = Math.max(0, 1 - sessionDifference / 100); // Normalize to 0-1

    return categoryCompatibility * 0.7 + sessionCompatibility * 0.3;
  }

  /**
   * Calculate rating history score (15% weight)
   */
  private calculateRatingHistoryScore(targetUser: UserWithDetails): number {
    const rating =
      typeof targetUser.rating === "number"
        ? targetUser.rating
        : parseFloat(targetUser.rating.toString());

    // Normalize rating from 0-5 scale to 0-1 scale
    const normalizedRating = Math.max(0, Math.min(1, rating / 5));

    // Bonus for users with more sessions (more reliable rating)
    const sessionBonus = Math.min(0.2, (targetUser.totalSessions / 50) * 0.2);

    return Math.min(1, normalizedRating + sessionBonus);
  }

  /**
   * Calculate response rate score (10% weight)
   */
  private async calculateResponseRate(userId: string): Promise<number> {
    try {
      // Get recent match interactions to calculate response rate
      const recentInteractions = await prisma.matchInteraction.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      if (recentInteractions.length === 0) {
        return 0.5; // Default neutral score for new users
      }

      const responseCount = recentInteractions.filter(
        (interaction) => interaction.type === MatchInteractionType.FAVORITE
      ).length;

      return Math.min(1, responseCount / recentInteractions.length);
    } catch (error) {
      logger.error("Error calculating response rate:", error);
      return 0.5; // Default neutral score on error
    }
  }

  /**
   * Find common skills between users
   */
  private findCommonSkills(
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): string[] {
    const currentUserSkillIds = new Set(
      currentUser.skills.map((s) => s.skillId)
    );
    const targetUserSkillIds = new Set(targetUser.skills.map((s) => s.skillId));

    const commonSkillIds = [...currentUserSkillIds].filter((id) =>
      targetUserSkillIds.has(id)
    );

    return commonSkillIds
      .map((skillId) => {
        const skill = currentUser.skills.find(
          (s) => s.skillId === skillId
        )?.skill;
        return skill?.name || "";
      })
      .filter((name) => name);
  }

  /**
   * Find complementary skills between users
   */
  private findComplementarySkills(
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): Array<{
    userCanTeach: string;
    userWantsToLearn: string;
    targetCanTeach: string;
    targetWantsToLearn: string;
  }> {
    const complementary: Array<{
      userCanTeach: string;
      userWantsToLearn: string;
      targetCanTeach: string;
      targetWantsToLearn: string;
    }> = [];

    // Find skills where current user can teach and target user wants to learn
    currentUser.skills
      .filter((s) => s.canTeach)
      .forEach((teachingSkill) => {
        const matchingLearningSkill = targetUser.skills.find(
          (s) => s.wantsToLearn && s.skillId === teachingSkill.skillId
        );
        if (matchingLearningSkill) {
          complementary.push({
            userCanTeach: teachingSkill.skill.name,
            userWantsToLearn: "",
            targetCanTeach: "",
            targetWantsToLearn: matchingLearningSkill.skill.name,
          });
        }
      });

    // Find skills where target user can teach and current user wants to learn
    targetUser.skills
      .filter((s) => s.canTeach)
      .forEach((teachingSkill) => {
        const matchingLearningSkill = currentUser.skills.find(
          (s) => s.wantsToLearn && s.skillId === teachingSkill.skillId
        );
        if (matchingLearningSkill) {
          complementary.push({
            userCanTeach: "",
            userWantsToLearn: matchingLearningSkill.skill.name,
            targetCanTeach: teachingSkill.skill.name,
            targetWantsToLearn: "",
          });
        }
      });

    return complementary;
  }

  /**
   * Generate match explanation
   */
  private generateMatchExplanation(
    score: number,
    breakdown: any,
    commonSkills: string[],
    currentUser: UserWithDetails,
    targetUser: UserWithDetails
  ): string {
    const percentage = Math.round(score * 100);
    const reasons: string[] = [];

    // Skill complementarity
    if (breakdown.skillComplementarity > 0.7) {
      reasons.push("excellent skill exchange potential");
    } else if (breakdown.skillComplementarity > 0.4) {
      reasons.push("good skill complementarity");
    }

    // Availability overlap
    if (breakdown.availabilityOverlap > 0.6) {
      reasons.push("great schedule compatibility");
    } else if (breakdown.availabilityOverlap > 0.3) {
      reasons.push("decent availability overlap");
    }

    // Rating
    const rating =
      typeof targetUser.rating === "number"
        ? targetUser.rating
        : parseFloat(targetUser.rating.toString());
    if (rating >= 4.5) {
      reasons.push("highly rated teacher");
    } else if (rating >= 4.0) {
      reasons.push("well-rated teacher");
    }

    // Common skills
    if (commonSkills.length > 0) {
      reasons.push(
        `${commonSkills.length} shared skill${
          commonSkills.length > 1 ? "s" : ""
        }`
      );
    }

    const reasonText =
      reasons.length > 0
        ? reasons.join(", ")
        : "potential learning opportunity";

    return `${percentage}% match because: ${reasonText}`;
  }

  /**
   * Record match interaction
   */
  async recordMatchInteraction(
    userId: string,
    targetUserId: string,
    type: MatchInteractionType,
    matchScore?: number,
    explanation?: string
  ): Promise<void> {
    try {
      await prisma.matchInteraction.upsert({
        where: {
          userId_targetUserId: {
            userId,
            targetUserId,
          },
        },
        update: {
          type,
          matchScore,
          explanation,
        },
        create: {
          userId,
          targetUserId,
          type,
          matchScore,
          explanation,
        },
      });
    } catch (error) {
      logger.error("Error recording match interaction:", error);
      throw error;
    }
  }

  /**
   * Get favorited matches for a user
   */
  async getFavoritedMatches(userId: string): Promise<MatchSuggestion[]> {
    try {
      const favoriteInteractions = await prisma.matchInteraction.findMany({
        where: {
          userId,
          type: MatchInteractionType.FAVORITE,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const currentUser = await this.getUserWithDetails(userId);
      if (!currentUser) {
        throw new Error("User not found");
      }

      const favoriteMatches = await Promise.all(
        favoriteInteractions.map(async (interaction) => {
          const targetUser = await this.getUserWithDetails(
            interaction.targetUserId
          );
          if (!targetUser) return null;

          const matchScore = await this.calculateMatchScore(
            currentUser,
            targetUser
          );
          return {
            user: targetUser,
            ...matchScore,
            complementarySkills: this.findComplementarySkills(
              currentUser,
              targetUser
            ),
          };
        })
      );

      return favoriteMatches.filter(
        (match) => match !== null
      ) as MatchSuggestion[];
    } catch (error) {
      logger.error("Error getting favorited matches:", error);
      throw error;
    }
  }

  /**
   * Filter matches based on criteria
   */
  async filterMatches(
    userId: string,
    filters: MatchFilters,
    limit: number = 20
  ): Promise<MatchSuggestion[]> {
    try {
      return await this.getMatchSuggestions(userId, filters, limit);
    } catch (error) {
      logger.error("Error filtering matches:", error);
      throw error;
    }
  }

  // Helper methods

  async getUserWithDetails(userId: string): Promise<UserWithDetails | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        availability: {
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            teachingSessions: true,
            learningSessions: true,
          },
        },
      },
    });
  }

  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const blockedInteractions = await prisma.matchInteraction.findMany({
      where: {
        userId,
        type: MatchInteractionType.BLOCK,
      },
      select: {
        targetUserId: true,
      },
    });

    return blockedInteractions.map((interaction) => interaction.targetUserId);
  }

  private async getPotentialMatches(
    userId: string,
    blockedUserIds: string[],
    filters?: MatchFilters
  ): Promise<UserWithDetails[]> {
    const whereClause: any = {
      id: {
        not: userId,
        notIn: blockedUserIds,
      },
      isVerified: true, // Only include verified users
    };

    // Apply filters
    if (filters?.location) {
      whereClause.location = {
        contains: filters.location,
        mode: "insensitive",
      };
    }

    if (filters?.minRating) {
      whereClause.rating = {
        gte: filters.minRating,
      };
    }

    const skillFilters: any = {};
    if (filters?.skillCategories?.length) {
      skillFilters.skill = {
        category: {
          in: filters.skillCategories,
        },
      };
    }

    if (filters?.proficiencyLevels?.length) {
      skillFilters.proficiencyLevel = {
        in: filters.proficiencyLevels,
      };
    }

    if (Object.keys(skillFilters).length > 0) {
      whereClause.skills = {
        some: skillFilters,
      };
    }

    return await prisma.user.findMany({
      where: whereClause,
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        availability: {
          where: {
            isActive: true,
          },
        },
        _count: {
          select: {
            teachingSessions: true,
            learningSessions: true,
          },
        },
      },
      take: 100, // Get more than needed for scoring
    });
  }

  private groupAvailabilityByDay(
    availability: Availability[]
  ): Record<number, Availability[]> {
    return availability.reduce((acc, slot) => {
      if (!acc[slot.dayOfWeek]) {
        acc[slot.dayOfWeek] = [];
      }
      acc[slot.dayOfWeek].push(slot);
      return acc;
    }, {} as Record<number, Availability[]>);
  }

  private calculateHoursDifference(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return (endMinutes - startMinutes) / 60;
  }

  private calculateTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): number {
    const [start1Hour, start1Minute] = start1.split(":").map(Number);
    const [end1Hour, end1Minute] = end1.split(":").map(Number);
    const [start2Hour, start2Minute] = start2.split(":").map(Number);
    const [end2Hour, end2Minute] = end2.split(":").map(Number);

    const start1Minutes = start1Hour * 60 + start1Minute;
    const end1Minutes = end1Hour * 60 + end1Minute;
    const start2Minutes = start2Hour * 60 + start2Minute;
    const end2Minutes = end2Hour * 60 + end2Minute;

    const overlapStart = Math.max(start1Minutes, start2Minutes);
    const overlapEnd = Math.min(end1Minutes, end2Minutes);

    return Math.max(0, (overlapEnd - overlapStart) / 60);
  }
}

export default new MatchingService();
