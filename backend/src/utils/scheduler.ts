import { authService } from "@/services/authService";
import prisma from "@/lib/prisma";
import logger from "@/utils/logger";

export class Scheduler {
  private intervals: NodeJS.Timeout[] = [];

  // Start all scheduled tasks
  start() {
    logger.info("Starting scheduled tasks...");

    // Clean up expired refresh tokens every hour
    const tokenCleanupInterval = setInterval(async () => {
      try {
        await authService.cleanupExpiredTokens();
      } catch (error) {
        logger.error("Token cleanup task failed:", error);
      }
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.push(tokenCleanupInterval);

    // Clean up expired password reset tokens every 30 minutes
    const passwordResetCleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredPasswordResets();
      } catch (error) {
        logger.error("Password reset cleanup task failed:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    this.intervals.push(passwordResetCleanupInterval);

    logger.info("Scheduled tasks started successfully");
  }

  // Stop all scheduled tasks
  stop() {
    logger.info("Stopping scheduled tasks...");

    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });

    this.intervals = [];
    logger.info("Scheduled tasks stopped");
  }

  // Clean up expired password reset tokens
  private async cleanupExpiredPasswordResets() {
    try {
      const result = await prisma.user.updateMany({
        where: {
          passwordResetExpires: { lt: new Date() },
          passwordResetToken: { not: null },
        },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired password reset tokens`);
      }
    } catch (error) {
      logger.error("Password reset cleanup error:", error);
    }
  }
}

export const scheduler = new Scheduler();
