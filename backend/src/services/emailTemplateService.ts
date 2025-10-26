import { NotificationType } from "@prisma/client";
import {
  NotificationPriority,
  NotificationCategory,
} from "./notificationService";
import config from "@/config";

export interface EmailTemplateData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    priority?: NotificationPriority;
    category?: NotificationCategory;
  };
}

export class EmailTemplateService {
  /**
   * Get session reminder email template
   */
  getSessionReminderTemplate(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const { user, notification } = data;
    const reminderType = notification.data?.reminderType || "1h";
    const sessionId = notification.data?.sessionId;
    const canJoin = notification.data?.canJoin || false;

    const urgencyColor =
      reminderType === "15min"
        ? "#EF4444"
        : reminderType === "1h"
        ? "#F59E0B"
        : "#4F46E5";
    const actionText = canJoin ? "Join Session Now" : "View Session Details";
    const actionUrl = `${config.corsOrigin}/sessions/${sessionId}`;

    const subject = notification.title;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { 
              background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px 20px; background: #f8fafc; }
            .reminder-card {
              background: white;
              border-radius: 12px;
              padding: 25px;
              border-left: 4px solid ${urgencyColor};
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              margin: 20px 0;
            }
            .urgency-badge {
              display: inline-block;
              background: ${urgencyColor};
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 15px;
            }
            .session-details {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .action-button { 
              display: inline-block; 
              background: ${urgencyColor}; 
              color: white; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
              text-align: center;
            }
            .footer { 
              padding: 25px 20px; 
              text-align: center; 
              color: #64748b; 
              font-size: 14px; 
              background: #f1f5f9;
            }
            .tips {
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Session Reminder</h1>
            </div>
            <div class="content">
              <div class="urgency-badge">${reminderType.toUpperCase()} Reminder</div>
              <p>Hi ${user.firstName},</p>
              
              <div class="reminder-card">
                <p style="font-size: 18px; margin: 0 0 15px 0; font-weight: 500;">${
                  notification.message
                }</p>
                
                ${
                  canJoin
                    ? `
                  <div class="tips">
                    <strong>💡 Ready to join?</strong> You can now access your session room. We recommend joining a few minutes early to test your audio and video.
                  </div>
                `
                    : ""
                }
                
                <a href="${actionUrl}" class="action-button">${actionText}</a>
              </div>
              
              <p>Best of luck with your session!</p>
              <p>The SkillSync Team</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
              <p><a href="${
                config.corsOrigin
              }/settings/notifications" style="color: #64748b;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Hi ${user.firstName},
      
      ${notification.message}
      
      ${
        canJoin
          ? "You can now join your session room."
          : "View session details:"
      } ${actionUrl}
      
      Best of luck with your session!
      
      The SkillSync Team
      
      ---
      Manage your notification preferences: ${
        config.corsOrigin
      }/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Get match suggestion email template
   */
  getMatchSuggestionTemplate(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const { user, notification } = data;
    const matchCount = notification.data?.matchCount || 1;

    const subject = `🤝 ${matchCount} New Learning Partner${
      matchCount > 1 ? "s" : ""
    } Found!`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { 
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .content { padding: 30px 20px; background: #f8fafc; }
            .match-card {
              background: white;
              border-radius: 12px;
              padding: 25px;
              border-left: 4px solid #4F46E5;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              margin: 20px 0;
            }
            .action-button { 
              display: inline-block; 
              background: #4F46E5; 
              color: white; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .footer { 
              padding: 25px 20px; 
              text-align: center; 
              color: #64748b; 
              font-size: 14px; 
              background: #f1f5f9;
            }
            .features {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .feature {
              background: #f1f5f9;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤝 New Matches Found!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.firstName},</p>
              
              <div class="match-card">
                <h2 style="color: #4F46E5; margin-top: 0;">Great news!</h2>
                <p style="font-size: 18px; margin: 0 0 15px 0;">We found <strong>${matchCount} new potential learning partner${
      matchCount > 1 ? "s" : ""
    }</strong> who match your skills and interests perfectly.</p>
                
                <div class="features">
                  <div class="feature">
                    <strong>🎯 Smart Matching</strong><br>
                    <small>Based on your skills & availability</small>
                  </div>
                  <div class="feature">
                    <strong>⭐ Quality Connections</strong><br>
                    <small>Verified & highly-rated members</small>
                  </div>
                </div>
                
                <a href="${
                  config.corsOrigin
                }/matches" class="action-button">View Your Matches</a>
              </div>
              
              <p>Don't wait too long - the best learning partners get booked quickly!</p>
              <p>Happy learning,<br>The SkillSync Team</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
              <p><a href="${
                config.corsOrigin
              }/settings/notifications" style="color: #64748b;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Hi ${user.firstName},
      
      Great news! We found ${matchCount} new potential learning partner${
      matchCount > 1 ? "s" : ""
    } who match your skills and interests perfectly.
      
      View your matches: ${config.corsOrigin}/matches
      
      Don't wait too long - the best learning partners get booked quickly!
      
      Happy learning,
      The SkillSync Team
      
      ---
      Manage your notification preferences: ${
        config.corsOrigin
      }/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Get credit notification email template
   */
  getCreditNotificationTemplate(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const { user, notification } = data;
    const transactionType = notification.data?.transactionType || "earned";
    const amount = notification.data?.amount || 0;

    const isPositive = ["earned", "purchased", "refunded"].includes(
      transactionType
    );
    const emoji = isPositive ? "💰" : "💸";
    const color = isPositive ? "#10B981" : "#F59E0B";
    const action = isPositive ? "earned" : "spent";

    const subject = `${emoji} ${amount} Credits ${
      action.charAt(0).toUpperCase() + action.slice(1)
    }`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { 
              background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .content { padding: 30px 20px; background: #f8fafc; }
            .credit-card {
              background: white;
              border-radius: 12px;
              padding: 25px;
              border-left: 4px solid ${color};
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              margin: 20px 0;
              text-align: center;
            }
            .amount {
              font-size: 36px;
              font-weight: 700;
              color: ${color};
              margin: 10px 0;
            }
            .action-button { 
              display: inline-block; 
              background: ${color}; 
              color: white; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .footer { 
              padding: 25px 20px; 
              text-align: center; 
              color: #64748b; 
              font-size: 14px; 
              background: #f1f5f9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Credit Update</h1>
            </div>
            <div class="content">
              <p>Hi ${user.firstName},</p>
              
              <div class="credit-card">
                <div class="amount">${isPositive ? "+" : "-"}${amount}</div>
                <p style="font-size: 18px; margin: 0 0 15px 0; color: #64748b;">Credits ${action}</p>
                <p style="margin: 0;">${notification.message}</p>
                
                <a href="${
                  config.corsOrigin
                }/credits" class="action-button">View Credit History</a>
              </div>
              
              <p>${
                isPositive
                  ? "Keep up the great work!"
                  : "Thanks for using SkillSync!"
              }</p>
              <p>The SkillSync Team</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
              <p><a href="${
                config.corsOrigin
              }/settings/notifications" style="color: #64748b;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Hi ${user.firstName},
      
      ${isPositive ? "+" : "-"}${amount} Credits ${action}
      ${notification.message}
      
      View your credit history: ${config.corsOrigin}/credits
      
      ${isPositive ? "Keep up the great work!" : "Thanks for using SkillSync!"}
      
      The SkillSync Team
      
      ---
      Manage your notification preferences: ${
        config.corsOrigin
      }/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Get system notification email template
   */
  getSystemNotificationTemplate(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    const { user, notification } = data;
    const priority = notification.priority || NotificationPriority.NORMAL;

    const priorityColors = {
      [NotificationPriority.LOW]: "#6B7280",
      [NotificationPriority.NORMAL]: "#4F46E5",
      [NotificationPriority.HIGH]: "#F59E0B",
      [NotificationPriority.URGENT]: "#EF4444",
    };

    const color = priorityColors[priority];
    const subject = notification.title;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { 
              background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
            }
            .content { padding: 30px 20px; background: #f8fafc; }
            .system-card {
              background: white;
              border-radius: 12px;
              padding: 25px;
              border-left: 4px solid ${color};
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              margin: 20px 0;
            }
            .priority-badge {
              display: inline-block;
              background: ${color};
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 15px;
            }
            .action-button { 
              display: inline-block; 
              background: ${color}; 
              color: white; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
            }
            .footer { 
              padding: 25px 20px; 
              text-align: center; 
              color: #64748b; 
              font-size: 14px; 
              background: #f1f5f9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 System Update</h1>
            </div>
            <div class="content">
              <div class="priority-badge">${priority} Priority</div>
              <p>Hi ${user.firstName},</p>
              
              <div class="system-card">
                <h2 style="color: ${color}; margin-top: 0;">${notification.title}</h2>
                <p style="font-size: 16px; margin: 0 0 15px 0;">${notification.message}</p>
                
                <a href="${config.corsOrigin}/notifications" class="action-button">View Details</a>
              </div>
              
              <p>Thank you for being part of SkillSync!</p>
              <p>The SkillSync Team</p>
            </div>
            <div class="footer">
              <p>© 2024 SkillSync. All rights reserved.</p>
              <p><a href="${config.corsOrigin}/settings/notifications" style="color: #64748b;">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Hi ${user.firstName},
      
      ${priority.toUpperCase()} PRIORITY: ${notification.title}
      
      ${notification.message}
      
      View details: ${config.corsOrigin}/notifications
      
      Thank you for being part of SkillSync!
      
      The SkillSync Team
      
      ---
      Manage your notification preferences: ${
        config.corsOrigin
      }/settings/notifications
    `;

    return { subject, html, text };
  }

  /**
   * Get appropriate email template based on notification type
   */
  getEmailTemplate(data: EmailTemplateData): {
    subject: string;
    html: string;
    text: string;
  } {
    switch (data.notification.type) {
      case NotificationType.SESSION_REMINDER:
      case NotificationType.SESSION_CONFIRMED:
      case NotificationType.SESSION_CANCELLED:
        return this.getSessionReminderTemplate(data);

      case NotificationType.MATCH_SUGGESTION:
        return this.getMatchSuggestionTemplate(data);

      case NotificationType.CREDIT_EARNED:
      case NotificationType.CREDIT_SPENT:
        return this.getCreditNotificationTemplate(data);

      case NotificationType.SYSTEM_UPDATE:
        return this.getSystemNotificationTemplate(data);

      default:
        return this.getSystemNotificationTemplate(data);
    }
  }
}

export const emailTemplateService = new EmailTemplateService();
