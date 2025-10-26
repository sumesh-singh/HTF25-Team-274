import prisma from "@/lib/prisma";
import matchingService from "@/services/matchingService";
import { notificationService } from "@/services/notificationService";
import logger from "@/utils/logger";
import { NotificationType } from "@prisma/client";

class DailyMatchService {
  /**
   * Generate daily match suggestions for all active users
   */
  async generateDailyMatches(): Promise<void> {
    try {
      logger.info("Starting daily match generation...");

      // Get all active users who want match suggestions
      const activeUsers = await prisma.user.findMany({
        where: {
          isVerified: true,
          lastActive: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Active in last 7 days
          },
          preferences: {
            matchSuggestions: true,
          },
        },
        include: {
          preferences: true,
        },
      });

      logger.info(`Generating matches for ${activeUsers.length} active users`);

      let totalMatchesGenerated = 0;
      let usersWithMatches = 0;

      // Process users in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (user) => {
            try {
              // Get top 5 matches for each user
              const matches = await matchingService.getMatchSuggestions(
                user.id,
                undefined,
                5
              );

              if (matches.length > 0) {
                totalMatchesGenerated += matches.length;
                usersWithMatches++;

                // Send notification about new matches
                await this.sendMatchNotification(user.id, matches.length);

                // Log the best match for debugging
                const bestMatch = matches[0];
                logger.debug(
                  `Best match for ${user.email}: ${bestMatch.user.firstName} ${
                    bestMatch.user.lastName
                  } (${Math.round(bestMatch.score * 100)}%)`
                );
              }
            } catch (error) {
              logger.error(
                `Error generating matches for user ${user.id}:`,
                error
              );
            }
          })
        );

        // Small delay between batches to prevent overwhelming the database
        if (i + batchSize < activeUsers.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      logger.info(
        `Daily match generation completed. Generated ${totalMatchesGenerated} matches for ${usersWithMatches} users`
      );

      // Store daily match statistics
      await this.storeDailyMatchStats(
        totalMatchesGenerated,
        usersWithMatches,
        activeUsers.length
      );
    } catch (error) {
      logger.error("Error in daily match generation:", error);
      throw error;
    }
  }

  /**
   * Send match notification to user
   */
  private async sendMatchNotification(
    userId: string,
    matchCount: number
  ): Promise<void> {
    try {
      await notificationService.sendMatchSuggestion(userId, {
        count: matchCount,
        topMatch: null, // Could be enhanced to include top match data
      });
    } catch (error) {
      logger.error(
        `Error sending match notification to user ${userId}:`,
        error
      );
    }
  }

  /**
   * Store daily match generation statistics
   */
  private async storeDailyMatchStats(
    totalMatches: number,
    usersWithMatches: number,
    totalActiveUsers: number
  ): Promise<void> {
    try {
      // For now, just log the stats. In a production system, you might want to store these in a separate analytics table
      logger.info("Daily Match Statistics:", {
        date: new Date().toISOString().split("T")[0],
        totalMatches,
        usersWithMatches,
        totalActiveUsers,
        averageMatchesPerUser:
          totalActiveUsers > 0
            ? (totalMatches / totalActiveUsers).toFixed(2)
            : 0,
        matchGenerationRate:
          totalActiveUsers > 0
            ? ((usersWithMatches / totalActiveUsers) * 100).toFixed(1) + "%"
            : "0%",
      });
    } catch (error) {
      logger.error("Error storing daily match stats:", error);
    }
  }

  /**
   * Get match statistics for admin dashboard
   */
  async getMatchStatistics(days: number = 30): Promise<{
    totalInteractions: number;
    favoriteRate: number;
    passRate: number;
    blockRate: number;
    averageMatchScore: number;
    topSkillCategories: Array<{ category: string; count: number }>;
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get match interactions
      const interactions = await prisma.matchInteraction.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      });

      const totalInteractions = interactions.length;
      const favoriteCount = interactions.filter(
        (i) => i.type === "FAVORITE"
      ).length;
      const passCount = interactions.filter((i) => i.type === "PASS").length;
      const blockCount = interactions.filter((i) => i.type === "BLOCK").length;

      const favoriteRate =
        totalInteractions > 0 ? (favoriteCount / totalInteractions) * 100 : 0;
      const passRate =
        totalInteractions > 0 ? (passCount / totalInteractions) * 100 : 0;
      const blockRate =
        totalInteractions > 0 ? (blockCount / totalInteractions) * 100 : 0;

      // Calculate average match score
      const scoresWithValues = interactions.filter(
        (i) => i.matchScore !== null
      );
      const averageMatchScore =
        scoresWithValues.length > 0
          ? scoresWithValues.reduce(
              (sum, i) => sum + parseFloat(i.matchScore!.toString()),
              0
            ) / scoresWithValues.length
          : 0;

      // Get top skill categories involved in matches
      const skillCategoryStats = await prisma.userSkill.groupBy({
        by: ["skillId"],
        _count: {
          skillId: true,
        },
        where: {
          user: {
            matchInteractions: {
              some: {
                createdAt: {
                  gte: startDate,
                },
              },
            },
          },
        },
      });

      // Get skill details for categories
      const skillIds = skillCategoryStats.map((stat) => stat.skillId);
      const skills = await prisma.skill.findMany({
        where: {
          id: {
            in: skillIds,
          },
        },
      });

      const categoryMap = new Map<string, number>();
      skillCategoryStats.forEach((stat) => {
        const skill = skills.find((s) => s.id === stat.skillId);
        if (skill) {
          const currentCount = categoryMap.get(skill.category) || 0;
          categoryMap.set(skill.category, currentCount + stat._count.skillId);
        }
      });

      const topSkillCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalInteractions,
        favoriteRate: Math.round(favoriteRate * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        blockRate: Math.round(blockRate * 100) / 100,
        averageMatchScore: Math.round(averageMatchScore * 100) / 100,
        topSkillCategories,
      };
    } catch (error) {
      logger.error("Error getting match statistics:", error);
      throw error;
    }
  }

  /**
   * Clean up old match interactions (keep only last 90 days)
   */
  async cleanupOldInteractions(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const deletedCount = await prisma.matchInteraction.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          type: {
            in: ["PASS", "VIEW"], // Keep favorites and blocks longer
          },
        },
      });

      logger.info(`Cleaned up ${deletedCount.count} old match interactions`);
    } catch (error) {
      logger.error("Error cleaning up old match interactions:", error);
      throw error;
    }
  }
}

export default new DailyMatchService();
