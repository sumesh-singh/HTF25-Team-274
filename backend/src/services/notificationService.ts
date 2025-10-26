import prisma from "@/lib/prisma";
import { emailService } from "./emailService";
import logger from "@/utils/logger";
import { NotificationType } from "@prisma/client";
import { getSocketIO } from "@/lib/socket";

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
}

export interface SessionReminderData {
  sessionId: string;
  userId: string;
  reminderType: "24h" | "1h" | "15min";
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  sessionReminders: boolean;
  matchSuggestions: boolean;
  messageNotifications: boolean;
  creditNotifications: boolean;
  systemNotifications: boolean;
  digestFrequency: "immediate" | "hourly" | "daily" | "weekly";
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    timezone: string;
  };
}

export enum NotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  PUSH = "push",
}

export enum NotificationCategory {
  SESSIONS = "sessions",
  MATCHING = "matching",
  MESSAGING = "messaging",
  CREDITS = "credits",
  SYSTEM = "system",
}

class NotificationService {
  /**
   * Create a notification with multi-channel delivery
   */
  async createNotification(data: CreateNotificationData): Promise<any> {
    try {
      // Get user preferences
      const userPreferences = await this.getUserPreferences(data.userId);

      // Check if notification should be sent based on preferences and quiet hours
      if (!this.shouldSendNotification(data.type, userPreferences)) {
        logger.debug(
          `Notification skipped due to user preferences: ${data.type} for user ${data.userId}`
        );
        return null;
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: {
            ...data.data,
            priority: data.priority || NotificationPriority.NORMAL,
            channels: data.channels || [NotificationChannel.IN_APP],
          },
        },
      });

      // Determine delivery channels
      const channels =
        data.channels || this.getDefaultChannels(data.type, userPreferences);

      // Send via multiple channels
      await this.deliverNotification(notification, channels, userPreferences);

      return notification;
    } catch (error) {
      logger.error("Failed to create notification:", error);
      throw error;
    }
  }

  /**
   * Deliver notification via multiple channels
   */
  private async deliverNotification(
    notification: any,
    channels: NotificationChannel[],
    userPreferences: NotificationPreferences
  ): Promise<void> {
    const deliveryPromises: Promise<void>[] = [];

    // In-app notification (real-time via Socket.io)
    if (channels.includes(NotificationChannel.IN_APP)) {
      deliveryPromises.push(this.sendInAppNotification(notification));
    }

    // Email notification
    if (
      channels.includes(NotificationChannel.EMAIL) &&
      userPreferences.emailNotifications
    ) {
      deliveryPromises.push(this.sendEmailNotification(notification));
    }

    // Push notification (placeholder for future implementation)
    if (
      channels.includes(NotificationChannel.PUSH) &&
      userPreferences.pushNotifications
    ) {
      deliveryPromises.push(this.sendPushNotification(notification));
    }

    // Execute all deliveries in parallel
    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Send real-time in-app notification via Socket.io
   */
  private async sendInAppNotification(notification: any): Promise<void> {
    try {
      const io = getSocketIO();
      io.to(`user:${notification.userId}`).emit("notification", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      });

      logger.debug(`In-app notification sent to user ${notification.userId}`);
    } catch (error) {
      logger.error("Failed to send in-app notification:", error);
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  private async sendPushNotification(notification: any): Promise<void> {
    try {
      // TODO: Implement push notification service (Firebase, OneSignal, etc.)
      logger.debug(
        `Push notification would be sent to user ${notification.userId}`
      );
    } catch (error) {
      logger.error("Failed to send push notification:", error);
    }
  }

  /**
   * Send session reminder notification with priority handling
   */
  async sendSessionReminder(data: SessionReminderData): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: data.sessionId },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      if (!session) {
        logger.warn(`Session not found for reminder: ${data.sessionId}`);
        return;
      }

      const user =
        session.teacherId === data.userId ? session.teacher : session.learner;
      const otherUser =
        session.teacherId === data.userId ? session.learner : session.teacher;
      const role = session.teacherId === data.userId ? "teacher" : "learner";

      let title: string;
      let message: string;
      let priority: NotificationPriority;

      switch (data.reminderType) {
        case "24h":
          title = "Session Reminder - 24 Hours";
          message = `Your ${
            role === "teacher" ? "teaching" : "learning"
          } session "${session.title}" with ${otherUser.firstName} ${
            otherUser.lastName
          } is scheduled for tomorrow at ${session.scheduledAt.toLocaleString()}.`;
          priority = NotificationPriority.NORMAL;
          break;
        case "1h":
          title = "Session Reminder - 1 Hour";
          message = `Your ${
            role === "teacher" ? "teaching" : "learning"
          } session "${session.title}" with ${otherUser.firstName} ${
            otherUser.lastName
          } starts in 1 hour.`;
          priority = NotificationPriority.HIGH;
          break;
        case "15min":
          title = "Session Starting Soon";
          message = `Your ${
            role === "teacher" ? "teaching" : "learning"
          } session "${session.title}" with ${otherUser.firstName} ${
            otherUser.lastName
          } starts in 15 minutes. You can now join the session.`;
          priority = NotificationPriority.URGENT;
          break;
      }

      await this.createNotification({
        userId: data.userId,
        type: NotificationType.SESSION_REMINDER,
        title,
        message,
        priority,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          NotificationChannel.PUSH,
        ],
        data: {
          sessionId: session.id,
          reminderType: data.reminderType,
          canJoin: data.reminderType === "15min",
          category: NotificationCategory.SESSIONS,
        },
      });

      logger.info(
        `Session reminder sent: ${data.sessionId}, ${data.reminderType}, user: ${data.userId}`
      );
    } catch (error) {
      logger.error("Failed to send session reminder:", error);
    }
  }

  /**
   * Send session confirmation notification
   */
  async sendSessionConfirmation(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      if (!session) {
        logger.warn(`Session not found for confirmation: ${sessionId}`);
        return;
      }

      // Notify learner
      await this.createNotification({
        userId: session.learnerId,
        type: NotificationType.SESSION_CONFIRMED,
        title: "Session Confirmed",
        message: `Your learning session "${session.title}" with ${
          session.teacher.firstName
        } ${
          session.teacher.lastName
        } has been confirmed for ${session.scheduledAt.toLocaleString()}.`,
        data: { sessionId: session.id },
      });

      // Notify teacher
      await this.createNotification({
        userId: session.teacherId,
        type: NotificationType.SESSION_CONFIRMED,
        title: "Session Confirmed",
        message: `You have confirmed the teaching session "${
          session.title
        }" with ${session.learner.firstName} ${
          session.learner.lastName
        } for ${session.scheduledAt.toLocaleString()}.`,
        data: { sessionId: session.id },
      });

      logger.info(`Session confirmation notifications sent: ${sessionId}`);
    } catch (error) {
      logger.error("Failed to send session confirmation:", error);
    }
  }

  /**
   * Send session cancellation notification
   */
  async sendSessionCancellation(
    sessionId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          teacher: true,
          learner: true,
          skill: true,
        },
      });

      if (!session) {
        logger.warn(`Session not found for cancellation: ${sessionId}`);
        return;
      }

      const cancelledByUser =
        session.teacherId === cancelledBy ? session.teacher : session.learner;
      const otherUser =
        session.teacherId === cancelledBy ? session.learner : session.teacher;
      const otherUserId =
        session.teacherId === cancelledBy
          ? session.learnerId
          : session.teacherId;

      const message = `Your session "${session.title}" with ${
        cancelledByUser.firstName
      } ${
        cancelledByUser.lastName
      } scheduled for ${session.scheduledAt.toLocaleString()} has been cancelled.${
        reason ? ` Reason: ${reason}` : ""
      }`;

      await this.createNotification({
        userId: otherUserId,
        type: NotificationType.SESSION_CANCELLED,
        title: "Session Cancelled",
        message,
        data: {
          sessionId: session.id,
          cancelledBy,
          reason,
        },
      });

      logger.info(`Session cancellation notification sent: ${sessionId}`);
    } catch (error) {
      logger.error("Failed to send session cancellation:", error);
    }
  }

  /**
   * Send email notification with enhanced templates
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        include: { preferences: true },
      });

      if (!user || !user.preferences?.emailNotifications) {
        return;
      }

      // Check specific notification type preferences
      const shouldSendEmail = this.shouldSendEmailForType(
        notification.type,
        user.preferences
      );
      if (!shouldSendEmail) {
        return;
      }

      const emailTemplate = this.getEmailTemplate(notification, user);

      await emailService.sendEmail({
        to: user.email,
        subject: notification.title,
        text: notification.message,
        html: emailTemplate,
      });

      logger.debug(`Email notification sent to ${user.email}`);
    } catch (error) {
      logger.error("Failed to send email notification:", error);
      // Don't throw error for email failures
    }
  }

  /**
   * Get enhanced email template based on notification type
   */
  private getEmailTemplate(notification: any, user: any): string {
    // Import email template service dynamically to avoid circular dependency
    const { emailTemplateService } = require("./emailTemplateService");

    const templateData = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.data?.priority,
        category: notification.data?.category,
      },
    };

    const template = emailTemplateService.getEmailTemplate(templateData);
    return template.html;
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    try {
      const userWithPrefs = await prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true },
      });

      if (!userWithPrefs?.preferences) {
        // Return default preferences if none exist
        return {
          emailNotifications: true,
          pushNotifications: true,
          sessionReminders: true,
          matchSuggestions: true,
          messageNotifications: true,
          creditNotifications: true,
          systemNotifications: true,
          digestFrequency: "immediate",
          quietHours: {
            enabled: false,
            startTime: "22:00",
            endTime: "08:00",
            timezone: userWithPrefs?.timezone || "UTC",
          },
        };
      }

      return {
        emailNotifications: userWithPrefs.preferences.emailNotifications,
        pushNotifications: userWithPrefs.preferences.pushNotifications,
        sessionReminders: userWithPrefs.preferences.sessionReminders,
        matchSuggestions: userWithPrefs.preferences.matchSuggestions,
        messageNotifications: userWithPrefs.preferences.messageNotifications,
        creditNotifications: userWithPrefs.preferences.creditNotifications,
        systemNotifications: userWithPrefs.preferences.systemNotifications,
        digestFrequency: "immediate", // TODO: Add to schema
        quietHours: {
          enabled: false, // TODO: Add to schema
          startTime: "22:00",
          endTime: "08:00",
          timezone: userWithPrefs.timezone,
        },
      };
    } catch (error) {
      logger.error("Failed to get user preferences:", error);
      // Return default preferences on error
      return {
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        matchSuggestions: true,
        messageNotifications: true,
        creditNotifications: true,
        systemNotifications: true,
        digestFrequency: "immediate",
        quietHours: {
          enabled: false,
          startTime: "22:00",
          endTime: "08:00",
          timezone: "UTC",
        },
      };
    }
  }

  /**
   * Check if notification should be sent based on preferences and quiet hours
   */
  private shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    // Check type-specific preferences
    const typeAllowed = this.shouldSendNotificationForType(type, preferences);
    if (!typeAllowed) {
      return false;
    }

    // Check quiet hours for non-urgent notifications
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const userTime = new Date(
        now.toLocaleString("en-US", {
          timeZone: preferences.quietHours.timezone,
        })
      );
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = preferences.quietHours.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = preferences.quietHours.endTime
        .split(":")
        .map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      let isQuietTime = false;
      if (startTime < endTime) {
        // Same day quiet hours (e.g., 14:00 - 18:00)
        isQuietTime = currentTime >= startTime && currentTime <= endTime;
      } else {
        // Overnight quiet hours (e.g., 22:00 - 08:00)
        isQuietTime = currentTime >= startTime || currentTime <= endTime;
      }

      // Allow urgent notifications during quiet hours
      if (isQuietTime && type !== NotificationType.SESSION_REMINDER) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if notification type should be sent based on user preferences
   */
  private shouldSendNotificationForType(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case NotificationType.SESSION_REMINDER:
      case NotificationType.SESSION_CONFIRMED:
      case NotificationType.SESSION_CANCELLED:
        return preferences.sessionReminders;
      case NotificationType.MESSAGE_RECEIVED:
        return preferences.messageNotifications;
      case NotificationType.MATCH_SUGGESTION:
        return preferences.matchSuggestions;
      case NotificationType.CREDIT_EARNED:
      case NotificationType.CREDIT_SPENT:
        return preferences.creditNotifications;
      case NotificationType.SYSTEM_UPDATE:
        return preferences.systemNotifications;
      default:
        return true;
    }
  }

  /**
   * Check if email should be sent for notification type based on user preferences
   */
  private shouldSendEmailForType(
    type: NotificationType,
    preferences: any
  ): boolean {
    return this.shouldSendNotificationForType(type, preferences);
  }

  /**
   * Get default delivery channels for notification type
   */
  private getDefaultChannels(
    type: NotificationType,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [NotificationChannel.IN_APP];

    // Add email for important notifications
    if (preferences.emailNotifications) {
      switch (type) {
        case NotificationType.SESSION_REMINDER:
        case NotificationType.SESSION_CONFIRMED:
        case NotificationType.SESSION_CANCELLED:
        case NotificationType.CREDIT_EARNED:
        case NotificationType.SYSTEM_UPDATE:
          channels.push(NotificationChannel.EMAIL);
          break;
      }
    }

    // Add push for urgent notifications
    if (preferences.pushNotifications) {
      switch (type) {
        case NotificationType.SESSION_REMINDER:
        case NotificationType.MESSAGE_RECEIVED:
          channels.push(NotificationChannel.PUSH);
          break;
      }
    }

    return channels;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    try {
      const { page = 1, limit = 20, ...otherFilters } = filters;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (otherFilters.isRead !== undefined) {
        where.isRead = otherFilters.isRead;
      }
      if (otherFilters.type) {
        where.type = otherFilters.type;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      return { notifications, total, unreadCount };
    } catch (error) {
      logger.error("Failed to get user notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error("Failed to mark notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Send match suggestion notification
   */
  async sendMatchSuggestion(userId: string, matchData: any): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: NotificationType.MATCH_SUGGESTION,
        title: "New Match Suggestions Available",
        message: `We found ${matchData.count} new potential learning partners for you! Check out your personalized matches.`,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        data: {
          category: NotificationCategory.MATCHING,
          matchCount: matchData.count,
          topMatch: matchData.topMatch,
        },
      });

      logger.info(`Match suggestion notification sent to user ${userId}`);
    } catch (error) {
      logger.error("Failed to send match suggestion notification:", error);
    }
  }

  /**
   * Send message notification
   */
  async sendMessageNotification(
    userId: string,
    senderId: string,
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    try {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });

      if (!sender) {
        logger.warn(`Sender not found for message notification: ${senderId}`);
        return;
      }

      await this.createNotification({
        userId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: `New message from ${sender.firstName} ${sender.lastName}`,
        message:
          messagePreview.length > 100
            ? `${messagePreview.substring(0, 100)}...`
            : messagePreview,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        data: {
          category: NotificationCategory.MESSAGING,
          senderId,
          conversationId,
          senderName: `${sender.firstName} ${sender.lastName}`,
        },
      });

      logger.info(
        `Message notification sent to user ${userId} from ${senderId}`
      );
    } catch (error) {
      logger.error("Failed to send message notification:", error);
    }
  }

  /**
   * Send credit transaction notification
   */
  async sendCreditNotification(
    userId: string,
    type: "earned" | "spent" | "purchased" | "refunded",
    amount: number,
    description: string,
    transactionData?: any
  ): Promise<void> {
    try {
      const isPositive =
        type === "earned" || type === "purchased" || type === "refunded";
      const emoji = isPositive ? "💰" : "💸";
      const action = isPositive ? "earned" : "spent";

      await this.createNotification({
        userId,
        type:
          type === "earned"
            ? NotificationType.CREDIT_EARNED
            : NotificationType.CREDIT_SPENT,
        title: `${emoji} Credits ${
          action.charAt(0).toUpperCase() + action.slice(1)
        }`,
        message: `You ${action} ${amount} credits. ${description}`,
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP],
        data: {
          category: NotificationCategory.CREDITS,
          transactionType: type,
          amount,
          description,
          ...transactionData,
        },
      });

      logger.info(
        `Credit notification sent to user ${userId}: ${type} ${amount} credits`
      );
    } catch (error) {
      logger.error("Failed to send credit notification:", error);
    }
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    data?: any
  ): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: NotificationType.SYSTEM_UPDATE,
        title,
        message,
        priority,
        channels:
          priority === NotificationPriority.URGENT
            ? [
                NotificationChannel.IN_APP,
                NotificationChannel.EMAIL,
                NotificationChannel.PUSH,
              ]
            : [NotificationChannel.IN_APP],
        data: {
          category: NotificationCategory.SYSTEM,
          ...data,
        },
      });

      logger.info(`System notification sent to user ${userId}: ${title}`);
    } catch (error) {
      logger.error("Failed to send system notification:", error);
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(
    userIds: string[],
    notificationData: Omit<CreateNotificationData, "userId">
  ): Promise<void> {
    try {
      const notifications = userIds.map((userId) => ({
        ...notificationData,
        userId,
      }));

      // Process in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await Promise.all(
          batch.map((notification) => this.createNotification(notification))
        );
      }

      logger.info(`Bulk notifications sent to ${userIds.length} users`);
    } catch (error) {
      logger.error("Failed to send bulk notifications:", error);
    }
  }

  /**
   * Clean up old notifications (30-day retention)
   */
  async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
        },
      });

      logger.info(`Cleaned up ${result.count} old notifications`);
    } catch (error) {
      logger.error("Failed to cleanup old notifications:", error);
    }
  }

  /**
   * Get notification statistics for admin dashboard
   */
  async getNotificationStats(
    timeframe: "day" | "week" | "month" = "day"
  ): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const [totalSent, byType, byPriority] = await Promise.all([
        prisma.notification.count({
          where: { createdAt: { gte: startDate } },
        }),
        prisma.notification.groupBy({
          by: ["type"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
        prisma.notification.groupBy({
          by: ["data"],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
      ]);

      return {
        timeframe,
        totalSent,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byPriority: byPriority.reduce((acc, item) => {
          const priority = (item.data as any)?.priority || "normal";
          acc[priority] = (acc[priority] || 0) + item._count.id;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error("Failed to get notification stats:", error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await prisma.userPreferences.upsert({
        where: { userId },
        create: {
          userId,
          emailNotifications: preferences.emailNotifications ?? true,
          pushNotifications: preferences.pushNotifications ?? true,
          sessionReminders: preferences.sessionReminders ?? true,
          matchSuggestions: preferences.matchSuggestions ?? true,
          messageNotifications: preferences.messageNotifications ?? true,
          creditNotifications: preferences.creditNotifications ?? true,
          systemNotifications: preferences.systemNotifications ?? true,
        },
        update: {
          emailNotifications: preferences.emailNotifications,
          pushNotifications: preferences.pushNotifications,
          sessionReminders: preferences.sessionReminders,
          matchSuggestions: preferences.matchSuggestions,
          messageNotifications: preferences.messageNotifications,
          creditNotifications: preferences.creditNotifications,
          systemNotifications: preferences.systemNotifications,
        },
      });

      logger.info(`Updated notification preferences for user ${userId}`);
    } catch (error) {
      logger.error("Failed to update user preferences:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
