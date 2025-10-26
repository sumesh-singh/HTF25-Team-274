import { authService } from "@/services/authService";
import { notificationService } from "@/services/notificationService";
import { creditExpirationService } from "@/services/creditExpirationService";
import dailyMatchService from "@/services/dailyMatchService";
import prisma from "@/lib/prisma";
import logger from "@/utils/logger";
import { SessionStatus } from "@prisma/client";

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

    // Check for session reminders every 5 minutes
    const sessionReminderInterval = setInterval(async () => {
      try {
        await this.processSessionReminders();
      } catch (error) {
        logger.error("Session reminder task failed:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.push(sessionReminderInterval);

    // Check for expiring credits daily at 9 AM
    const creditExpirationInterval = setInterval(async () => {
      try {
        await creditExpirationService.checkExpiringCredits();
      } catch (error) {
        logger.error("Credit expiration check task failed:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.intervals.push(creditExpirationInterval);

    // Expire inactive user credits weekly
    const creditExpirationCleanupInterval = setInterval(async () => {
      try {
        await creditExpirationService.expireInactiveUserCredits();
      } catch (error) {
        logger.error("Credit expiration cleanup task failed:", error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    this.intervals.push(creditExpirationCleanupInterval);

    // Generate daily match suggestions at 8 AM
    const dailyMatchInterval = setInterval(async () => {
      try {
        await dailyMatchService.generateDailyMatches();
      } catch (error) {
        logger.error("Daily match generation task failed:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.intervals.push(dailyMatchInterval);

    // Clean up old notifications daily
    const notificationCleanupInterval = setInterval(async () => {
      try {
        await notificationService.cleanupOldNotifications();
      } catch (error) {
        logger.error("Notification cleanup task failed:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    this.intervals.push(notificationCleanupInterval);

    // Process notification digest batches every hour
    const notificationDigestInterval = setInterval(async () => {
      try {
        await this.processNotificationDigests();
      } catch (error) {
        logger.error("Notification digest task failed:", error);
      }
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.push(notificationDigestInterval);

    // Clean up old match interactions weekly
    const matchCleanupInterval = setInterval(async () => {
      try {
        await dailyMatchService.cleanupOldInteractions();
      } catch (error) {
        logger.error("Match cleanup task failed:", error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    this.intervals.push(matchCleanupInterval);

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

  // Process session reminders
  private async processSessionReminders() {
    try {
      const now = new Date();

      // Get sessions that need reminders
      const sessions = await prisma.session.findMany({
        where: {
          status: { in: [SessionStatus.PENDING, SessionStatus.CONFIRMED] },
          scheduledAt: {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Next 24 hours
          },
        },
        include: {
          teacher: true,
          learner: true,
        },
      });

      for (const session of sessions) {
        const timeUntilSession = session.scheduledAt.getTime() - now.getTime();
        const hoursUntilSession = timeUntilSession / (1000 * 60 * 60);
        const minutesUntilSession = timeUntilSession / (1000 * 60);

        // 24 hour reminder
        if (hoursUntilSession <= 24 && hoursUntilSession > 23.5) {
          await this.sendReminderIfNotSent(
            session.id,
            session.teacherId,
            "24h"
          );
          await this.sendReminderIfNotSent(
            session.id,
            session.learnerId,
            "24h"
          );
        }

        // 1 hour reminder
        if (hoursUntilSession <= 1 && hoursUntilSession > 0.5) {
          await this.sendReminderIfNotSent(session.id, session.teacherId, "1h");
          await this.sendReminderIfNotSent(session.id, session.learnerId, "1h");
        }

        // 15 minute reminder
        if (minutesUntilSession <= 15 && minutesUntilSession > 10) {
          await this.sendReminderIfNotSent(
            session.id,
            session.teacherId,
            "15min"
          );
          await this.sendReminderIfNotSent(
            session.id,
            session.learnerId,
            "15min"
          );
        }
      }
    } catch (error) {
      logger.error("Session reminder processing error:", error);
    }
  }

  // Send reminder if not already sent (using a simple cache or database flag)
  private async sendReminderIfNotSent(
    sessionId: string,
    userId: string,
    reminderType: "24h" | "1h" | "15min"
  ) {
    try {
      // Check if reminder was already sent by looking for existing notification
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId,
          type: "SESSION_REMINDER",
          data: {
            path: ["sessionId"],
            equals: sessionId,
          },
          createdAt: {
            gte: new Date(Date.now() - this.getReminderWindow(reminderType)),
          },
        },
      });

      if (!existingReminder) {
        await notificationService.sendSessionReminder({
          sessionId,
          userId,
          reminderType,
        });
      }
    } catch (error) {
      logger.error(
        `Failed to send ${reminderType} reminder for session ${sessionId}:`,
        error
      );
    }
  }

  // Get the time window for checking if reminder was already sent
  private getReminderWindow(reminderType: "24h" | "1h" | "15min"): number {
    switch (reminderType) {
      case "24h":
        return 2 * 60 * 60 * 1000; // 2 hours
      case "1h":
        return 30 * 60 * 1000; // 30 minutes
      case "15min":
        return 10 * 60 * 1000; // 10 minutes
      default:
        return 60 * 60 * 1000; // 1 hour
    }
  }

  // Process notification digests for users who prefer batched notifications
  private async processNotificationDigests(): Promise<void> {
    try {
      // TODO: Implement digest processing when digest preferences are added to schema
      // This would collect unread notifications for users with digest preferences
      // and send them as batched emails (hourly, daily, weekly)

      logger.debug(
        "Notification digest processing - feature pending schema updates"
      );
    } catch (error) {
      logger.error("Notification digest processing error:", error);
    }
  }
}

export const scheduler = new Scheduler();
