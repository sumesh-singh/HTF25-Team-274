import { PrismaClient } from "@prisma/client";
import {
  AdminAnalytics,
  AdminUserDetails,
  AdminSessionDetails,
  AdminReport,
  ModerationAction,
  ModerationActionType,
  ReportStatus,
  ReportType,
} from "../types";
import logger from "../utils/logger";
import { systemHealthService } from "./systemHealthService";

const prisma = new PrismaClient();

export class AdminService {
  // Analytics Methods
  async getAnalytics(): Promise<AdminAnalytics> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // User Metrics
      const totalUsers = await prisma.user.count();
      const monthlyActiveUsers = await prisma.user.count({
        where: {
          lastActive: {
            gte: thirtyDaysAgo,
          },
        },
      });
      const newRegistrations = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Calculate retention rate (users who were active in last 30 days vs total users)
      const userRetentionRate =
        totalUsers > 0 ? (monthlyActiveUsers / totalUsers) * 100 : 0;

      // Average sessions per user
      const totalSessions = await prisma.session.count();
      const averageSessionsPerUser =
        totalUsers > 0 ? totalSessions / totalUsers : 0;

      // Session Metrics
      const completedSessions = await prisma.session.count({
        where: { status: "COMPLETED" },
      });
      const cancelledSessions = await prisma.session.count({
        where: { status: "CANCELLED" },
      });
      const sessionCompletionRate =
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      // Average session duration
      const avgDurationResult = await prisma.session.aggregate({
        _avg: { duration: true },
      });
      const averageSessionDuration = avgDurationResult._avg.duration || 0;

      const sessionsThisMonth = await prisma.session.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Credit Metrics
      const creditAggregates = await prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: {
            in: ["EARNED", "SPENT", "PURCHASED", "REFUNDED", "BONUS"],
          },
        },
      });

      const totalCreditsEarned = await prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "EARNED" },
      });

      const totalCreditsSpent = await prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "SPENT" },
      });

      const totalRevenue = await prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "PURCHASED" },
      });

      const userCreditBalances = await prisma.user.aggregate({
        _sum: { creditBalance: true },
      });

      const averageCreditsPerUser =
        totalUsers > 0
          ? (userCreditBalances._sum.creditBalance || 0) / totalUsers
          : 0;

      const creditTransactionsThisMonth = await prisma.creditTransaction.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Skill Metrics
      const totalSkills = await prisma.skill.count({
        where: { isActive: true },
      });

      const mostPopularSkills = await prisma.userSkill.groupBy({
        by: ["skillId"],
        _count: { skillId: true },
        orderBy: { _count: { skillId: "desc" } },
        take: 10,
      });

      const skillsWithNames = await Promise.all(
        mostPopularSkills.map(async (skill) => {
          const skillData = await prisma.skill.findUnique({
            where: { id: skill.skillId },
            select: { name: true },
          });
          return {
            skill: skillData?.name || "Unknown",
            count: skill._count.skillId,
          };
        })
      );

      const skillCategoryDistribution = await prisma.skill.groupBy({
        by: ["category"],
        _count: { category: true },
        where: { isActive: true },
      });

      const categoryDistribution = skillCategoryDistribution.map((cat) => ({
        category: cat.category,
        count: cat._count.category,
      }));

      const verifiedSkillsCount = await prisma.userSkill.count({
        where: { isVerified: true },
      });

      // System Health (using actual health checks)
      const healthCheck = await systemHealthService.getDetailedHealthCheck();
      const systemMetrics = await systemHealthService.getSystemMetrics();

      const systemHealth = {
        uptime: systemMetrics.uptime,
        averageResponseTime: systemMetrics.averageResponseTime,
        errorRate: systemMetrics.errorRate,
        activeConnections: systemMetrics.activeConnections,
        databaseHealth: healthCheck.services.database.status === "healthy",
        redisHealth: healthCheck.services.redis.status === "healthy",
      };

      return {
        userMetrics: {
          totalUsers,
          monthlyActiveUsers,
          newRegistrations,
          userRetentionRate: Math.round(userRetentionRate * 100) / 100,
          averageSessionsPerUser:
            Math.round(averageSessionsPerUser * 100) / 100,
        },
        sessionMetrics: {
          totalSessions,
          completedSessions,
          cancelledSessions,
          sessionCompletionRate: Math.round(sessionCompletionRate * 100) / 100,
          averageSessionDuration: Math.round(averageSessionDuration),
          sessionsThisMonth,
        },
        creditMetrics: {
          totalCreditsInCirculation: userCreditBalances._sum.creditBalance || 0,
          totalCreditsEarned: totalCreditsEarned._sum.amount || 0,
          totalCreditsSpent: Math.abs(totalCreditsSpent._sum.amount || 0),
          totalRevenue: totalRevenue._sum.amount || 0,
          averageCreditsPerUser: Math.round(averageCreditsPerUser * 100) / 100,
          creditTransactionsThisMonth,
        },
        skillMetrics: {
          totalSkills,
          mostPopularSkills: skillsWithNames,
          skillCategoryDistribution: categoryDistribution,
          verifiedSkillsCount,
        },
        systemHealth,
      };
    } catch (error) {
      logger.error("Error getting admin analytics:", error);
      throw new Error("Failed to retrieve analytics data");
    }
  }

  // User Management Methods
  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{
    users: AdminUserDetails[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const where = search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            skills: {
              include: { skill: true },
            },
            teachingSessions: true,
            learningSessions: true,
            creditTransactions: true,
            reportsReceived: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      const adminUsers: AdminUserDetails[] = users.map((user) => {
        const totalEarnings = user.creditTransactions
          .filter((t) => t.type === "EARNED")
          .reduce((sum, t) => sum + t.amount, 0);

        const totalSpending = user.creditTransactions
          .filter((t) => t.type === "SPENT")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          ...user,
          rating: Number(user.rating),
          skills: user.skills,
          sessionsAsTeacher: user.teachingSessions.length,
          sessionsAsLearner: user.learningSessions.length,
          totalEarnings,
          totalSpending,
          lastLogin: user.lastActive,
          accountStatus: "active" as const, // This would be determined by moderation actions
          reportCount: user.reportsReceived.length,
        };
      });

      return {
        users: adminUsers,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error getting all users:", error);
      throw new Error("Failed to retrieve users");
    }
  }

  async getUserDetails(userId: string): Promise<AdminUserDetails | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          skills: {
            include: { skill: true },
          },
          teachingSessions: true,
          learningSessions: true,
          creditTransactions: true,
          reportsReceived: true,
          receivedActions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!user) return null;

      const totalEarnings = user.creditTransactions
        .filter((t) => t.type === "EARNED")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSpending = user.creditTransactions
        .filter((t) => t.type === "SPENT")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Determine account status based on latest moderation action
      let accountStatus: "active" | "suspended" | "banned" = "active";
      const latestAction = user.receivedActions[0];
      if (latestAction) {
        if (latestAction.type === "BAN") accountStatus = "banned";
        else if (
          latestAction.type === "SUSPENSION" &&
          latestAction.expiresAt &&
          latestAction.expiresAt > new Date()
        ) {
          accountStatus = "suspended";
        }
      }

      return {
        ...user,
        rating: Number(user.rating),
        skills: user.skills,
        sessionsAsTeacher: user.teachingSessions.length,
        sessionsAsLearner: user.learningSessions.length,
        totalEarnings,
        totalSpending,
        lastLogin: user.lastActive,
        accountStatus,
        reportCount: user.reportsReceived.length,
      };
    } catch (error) {
      logger.error("Error getting user details:", error);
      throw new Error("Failed to retrieve user details");
    }
  }

  // Session Management Methods
  async getAllSessions(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    sessions: AdminSessionDetails[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const where = status ? { status: status as any } : {};

      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where,
          skip,
          take: limit,
          include: {
            teacher: true,
            learner: true,
            skill: true,
            ratings: true,
            creditTransactions: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.session.count({ where }),
      ]);

      const adminSessions: AdminSessionDetails[] = sessions.map((session) => ({
        ...session,
        teacher: { ...session.teacher, rating: Number(session.teacher.rating) },
        learner: { ...session.learner, rating: Number(session.learner.rating) },
        skill: session.skill,
        ratings: session.ratings,
        creditTransactions: session.creditTransactions,
      }));

      return {
        sessions: adminSessions,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error getting all sessions:", error);
      throw new Error("Failed to retrieve sessions");
    }
  }

  // Skill Management Methods
  async getAllSkills(): Promise<any[]> {
    try {
      return await prisma.skill.findMany({
        include: {
          userSkills: {
            include: { user: true },
          },
          _count: {
            select: {
              userSkills: true,
              sessions: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      logger.error("Error getting all skills:", error);
      throw new Error("Failed to retrieve skills");
    }
  }

  async createSkill(
    name: string,
    category: string,
    description?: string
  ): Promise<any> {
    try {
      return await prisma.skill.create({
        data: {
          name,
          category: category as any,
          description,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error("Error creating skill:", error);
      throw new Error("Failed to create skill");
    }
  }

  async updateSkill(
    skillId: string,
    data: {
      name?: string;
      category?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<any> {
    try {
      return await prisma.skill.update({
        where: { id: skillId },
        data: {
          ...data,
          category: data.category as any,
        },
      });
    } catch (error) {
      logger.error("Error updating skill:", error);
      throw new Error("Failed to update skill");
    }
  }

  async deleteSkill(skillId: string): Promise<void> {
    try {
      await prisma.skill.update({
        where: { id: skillId },
        data: { isActive: false },
      });
    } catch (error) {
      logger.error("Error deleting skill:", error);
      throw new Error("Failed to delete skill");
    }
  }

  // Report Management Methods
  async getAllReports(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus
  ): Promise<{
    reports: AdminReport[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const where = status ? { status } : {};

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take: limit,
          include: {
            reporter: true,
            reportedUser: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.report.count({ where }),
      ]);

      const adminReports: AdminReport[] = reports.map((report) => ({
        ...report,
        reporter: {
          ...report.reporter,
          rating: Number(report.reporter.rating),
        },
        reportedUser: {
          ...report.reportedUser,
          rating: Number(report.reportedUser.rating),
        },
      }));

      return {
        reports: adminReports,
        total,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error("Error getting all reports:", error);
      throw new Error("Failed to retrieve reports");
    }
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    adminNotes?: string
  ): Promise<AdminReport> {
    try {
      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: {
          status,
          adminNotes,
          updatedAt: new Date(),
        },
        include: {
          reporter: true,
          reportedUser: true,
        },
      });

      return {
        ...updatedReport,
        reporter: {
          ...updatedReport.reporter,
          rating: Number(updatedReport.reporter.rating),
        },
        reportedUser: {
          ...updatedReport.reportedUser,
          rating: Number(updatedReport.reportedUser.rating),
        },
      };
    } catch (error) {
      logger.error("Error updating report status:", error);
      throw new Error("Failed to update report status");
    }
  }

  // Moderation Methods
  async createModerationAction(
    adminId: string,
    targetUserId: string,
    type: ModerationActionType,
    reason: string,
    duration?: number
  ): Promise<ModerationAction> {
    try {
      const expiresAt = duration
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : undefined;

      const action = await prisma.moderationAction.create({
        data: {
          adminId,
          targetUserId,
          type,
          reason,
          duration,
          expiresAt,
        },
      });

      // If it's a ban or suspension, we might want to update user status
      // This would depend on how you want to implement user status tracking

      return action;
    } catch (error) {
      logger.error("Error creating moderation action:", error);
      throw new Error("Failed to create moderation action");
    }
  }

  async getModerationHistory(userId: string): Promise<ModerationAction[]> {
    try {
      return await prisma.moderationAction.findMany({
        where: { targetUserId: userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Error getting moderation history:", error);
      throw new Error("Failed to retrieve moderation history");
    }
  }
}

export const adminService = new AdminService();
