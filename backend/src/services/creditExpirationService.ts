import prisma from "@/lib/prisma";
import { creditService } from "./creditService";
import { notificationService } from "./notificationService";
import logger from "@/utils/logger";

export interface ExpirationWarning {
  userId: string;
  creditsExpiring: number;
  expirationDate: Date;
  warningType: "one_month" | "one_week" | "final";
}

export class CreditExpirationService {
  private readonly EXPIRATION_MONTHS = 12;
  private readonly WARNING_PERIODS = {
    ONE_MONTH: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    FINAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  };

  /**
   * Check for credits that are about to expire and send warnings
   */
  async checkExpiringCredits(): Promise<void> {
    try {
      const now = new Date();

      // Find users with credits that will expire soon
      const usersWithExpiringCredits = await this.getUsersWithExpiringCredits(
        now
      );

      for (const user of usersWithExpiringCredits) {
        await this.processExpirationWarnings(user, now);
      }

      logger.info(
        `Processed expiration warnings for ${usersWithExpiringCredits.length} users`
      );
    } catch (error) {
      logger.error("Error checking expiring credits:", error);
      throw error;
    }
  }

  /**
   * Expire credits for inactive users
   */
  async expireInactiveUserCredits(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - this.EXPIRATION_MONTHS);

      // Find users who haven't been active for 12+ months and have credits
      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastActive: {
            lt: cutoffDate,
          },
          creditBalance: {
            gt: 0,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          creditBalance: true,
          lastActive: true,
        },
      });

      for (const user of inactiveUsers) {
        await this.expireUserCredits(user);
      }

      logger.info(`Expired credits for ${inactiveUsers.length} inactive users`);
    } catch (error) {
      logger.error("Error expiring inactive user credits:", error);
      throw error;
    }
  }

  /**
   * Get users with credits that are about to expire
   */
  private async getUsersWithExpiringCredits(now: Date): Promise<any[]> {
    try {
      const cutoffDate = new Date(now);
      cutoffDate.setMonth(cutoffDate.getMonth() - (this.EXPIRATION_MONTHS - 1)); // 11 months ago

      // Find users who will have credits expire within warning periods
      const users = await prisma.user.findMany({
        where: {
          creditBalance: {
            gt: 0,
          },
          lastActive: {
            lt: cutoffDate,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          creditBalance: true,
          lastActive: true,
        },
      });

      return users;
    } catch (error) {
      logger.error("Error getting users with expiring credits:", error);
      throw error;
    }
  }

  /**
   * Process expiration warnings for a user
   */
  private async processExpirationWarnings(user: any, now: Date): Promise<void> {
    try {
      const expirationDate = new Date(user.lastActive);
      expirationDate.setMonth(
        expirationDate.getMonth() + this.EXPIRATION_MONTHS
      );

      const timeUntilExpiration = expirationDate.getTime() - now.getTime();

      let warningType: "one_month" | "one_week" | "final" | null = null;

      if (timeUntilExpiration <= this.WARNING_PERIODS.FINAL) {
        warningType = "final";
      } else if (timeUntilExpiration <= this.WARNING_PERIODS.ONE_WEEK) {
        warningType = "one_week";
      } else if (timeUntilExpiration <= this.WARNING_PERIODS.ONE_MONTH) {
        warningType = "one_month";
      }

      if (warningType) {
        await this.sendExpirationWarning({
          userId: user.id,
          creditsExpiring: user.creditBalance,
          expirationDate,
          warningType,
        });
      }
    } catch (error) {
      logger.error("Error processing expiration warnings:", error);
      throw error;
    }
  }

  /**
   * Send expiration warning notification
   */
  private async sendExpirationWarning(
    warning: ExpirationWarning
  ): Promise<void> {
    try {
      let title: string;
      let message: string;

      switch (warning.warningType) {
        case "one_month":
          title = "Credits Expiring Soon";
          message = `Your ${
            warning.creditsExpiring
          } credits will expire on ${warning.expirationDate.toLocaleDateString()} due to account inactivity. Log in to keep your credits active!`;
          break;
        case "one_week":
          title = "Credits Expiring This Week";
          message = `Your ${
            warning.creditsExpiring
          } credits will expire on ${warning.expirationDate.toLocaleDateString()}. Use them or log in to reset the expiration timer.`;
          break;
        case "final":
          title = "Credits Expiring Tomorrow";
          message = `Your ${
            warning.creditsExpiring
          } credits will expire tomorrow (${warning.expirationDate.toLocaleDateString()}) due to inactivity. Log in now to keep them!`;
          break;
      }

      await notificationService.createNotification({
        userId: warning.userId,
        type: "CREDIT_SPENT", // Reusing this type for credit-related notifications
        title,
        message,
        data: {
          creditsExpiring: warning.creditsExpiring,
          expirationDate: warning.expirationDate,
          warningType: warning.warningType,
        },
      });

      logger.info(
        `Expiration warning sent to user ${warning.userId}: ${warning.warningType}`
      );
    } catch (error) {
      logger.error("Error sending expiration warning:", error);
      throw error;
    }
  }

  /**
   * Expire credits for a specific user
   */
  private async expireUserCredits(user: any): Promise<void> {
    try {
      const creditsToExpire = user.creditBalance;

      // Create expiration transaction (negative amount to remove credits)
      await creditService.createTransaction({
        userId: user.id,
        type: "SPENT", // Using SPENT type for expired credits
        amount: creditsToExpire,
        description: `Credits expired due to ${this.EXPIRATION_MONTHS} months of inactivity`,
      });

      // Send expiration notification
      await notificationService.createNotification({
        userId: user.id,
        type: "CREDIT_SPENT",
        title: "Credits Expired",
        message: `Your ${creditsToExpire} credits have expired due to ${this.EXPIRATION_MONTHS} months of account inactivity. Earn new credits by teaching sessions!`,
        data: {
          expiredCredits: creditsToExpire,
          reason: "inactivity",
        },
      });

      logger.info(
        `Expired ${creditsToExpire} credits for inactive user ${user.id}`
      );
    } catch (error) {
      logger.error("Error expiring user credits:", error);
      throw error;
    }
  }

  /**
   * Reset expiration timer for a user (called when they log in or are active)
   */
  async resetExpirationTimer(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() },
      });

      logger.info(`Reset expiration timer for user ${userId}`);
    } catch (error) {
      logger.error("Error resetting expiration timer:", error);
      throw error;
    }
  }

  /**
   * Get credit expiration info for a user
   */
  async getCreditExpirationInfo(userId: string): Promise<{
    hasCredits: boolean;
    creditBalance: number;
    expirationDate: Date | null;
    daysUntilExpiration: number | null;
    isExpiringSoon: boolean;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          creditBalance: true,
          lastActive: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const hasCredits = user.creditBalance > 0;
      let expirationDate: Date | null = null;
      let daysUntilExpiration: number | null = null;
      let isExpiringSoon = false;

      if (hasCredits) {
        expirationDate = new Date(user.lastActive);
        expirationDate.setMonth(
          expirationDate.getMonth() + this.EXPIRATION_MONTHS
        );

        const now = new Date();
        const timeUntilExpiration = expirationDate.getTime() - now.getTime();
        daysUntilExpiration = Math.ceil(
          timeUntilExpiration / (24 * 60 * 60 * 1000)
        );

        isExpiringSoon = timeUntilExpiration <= this.WARNING_PERIODS.ONE_MONTH;
      }

      return {
        hasCredits,
        creditBalance: user.creditBalance,
        expirationDate,
        daysUntilExpiration,
        isExpiringSoon,
      };
    } catch (error) {
      logger.error("Error getting credit expiration info:", error);
      throw error;
    }
  }
}

export const creditExpirationService = new CreditExpirationService();
