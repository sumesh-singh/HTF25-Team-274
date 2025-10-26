import { PrismaClient } from "@prisma/client";
import { ReportType, ReportStatus, AdminReport } from "../types";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export class ReportService {
  async createReport(
    reporterId: string,
    reportedUserId: string,
    type: ReportType,
    reason: string,
    description: string,
    evidence?: string[]
  ): Promise<AdminReport> {
    try {
      // Check if reporter has already reported this user for the same reason recently
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId,
          reportedUserId,
          type,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
          },
        },
      });

      if (existingReport) {
        throw new Error(
          "You have already reported this user for this reason recently"
        );
      }

      const report = await prisma.report.create({
        data: {
          reporterId,
          reportedUserId,
          type,
          reason,
          description,
          evidence: evidence || [],
          status: ReportStatus.PENDING,
        },
        include: {
          reporter: true,
          reportedUser: true,
        },
      });

      // Log the report creation for monitoring
      logger.info(
        `New report created: ${report.id} by user ${reporterId} against user ${reportedUserId}`
      );

      return {
        ...report,
        reporter: {
          ...report.reporter,
          rating: Number(report.reporter.rating),
        },
        reportedUser: {
          ...report.reportedUser,
          rating: Number(report.reportedUser.rating),
        },
      };
    } catch (error) {
      logger.error("Error creating report:", error);
      throw error;
    }
  }

  async getUserReports(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reports: AdminReport[];
    total: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where: { reporterId: userId },
          skip,
          take: limit,
          include: {
            reporter: true,
            reportedUser: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.report.count({
          where: { reporterId: userId },
        }),
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
      logger.error("Error getting user reports:", error);
      throw new Error("Failed to retrieve user reports");
    }
  }

  async getReportById(reportId: string): Promise<AdminReport | null> {
    try {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          reporter: true,
          reportedUser: true,
        },
      });

      if (!report) return null;

      return {
        ...report,
        reporter: {
          ...report.reporter,
          rating: Number(report.reporter.rating),
        },
        reportedUser: {
          ...report.reportedUser,
          rating: Number(report.reportedUser.rating),
        },
      };
    } catch (error) {
      logger.error("Error getting report by ID:", error);
      throw new Error("Failed to retrieve report");
    }
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      // This could be implemented as a separate blocking table or as part of match interactions
      await prisma.matchInteraction.upsert({
        where: {
          userId_targetUserId: {
            userId,
            targetUserId: blockedUserId,
          },
        },
        update: {
          type: "BLOCK",
        },
        create: {
          userId,
          targetUserId: blockedUserId,
          type: "BLOCK",
        },
      });

      logger.info(`User ${userId} blocked user ${blockedUserId}`);
    } catch (error) {
      logger.error("Error blocking user:", error);
      throw new Error("Failed to block user");
    }
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      await prisma.matchInteraction.delete({
        where: {
          userId_targetUserId: {
            userId,
            targetUserId: blockedUserId,
          },
        },
      });

      logger.info(`User ${userId} unblocked user ${blockedUserId}`);
    } catch (error) {
      logger.error("Error unblocking user:", error);
      throw new Error("Failed to unblock user");
    }
  }

  async getBlockedUsers(userId: string): Promise<string[]> {
    try {
      const blockedInteractions = await prisma.matchInteraction.findMany({
        where: {
          userId,
          type: "BLOCK",
        },
        select: {
          targetUserId: true,
        },
      });

      return blockedInteractions.map((interaction) => interaction.targetUserId);
    } catch (error) {
      logger.error("Error getting blocked users:", error);
      throw new Error("Failed to retrieve blocked users");
    }
  }
}

export const reportService = new ReportService();
