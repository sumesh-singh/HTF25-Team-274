import { apiClient } from "../lib/api";
import { Notification, UserPreferences } from "../types/api";

export const notificationsService = {
  // Notifications
  getNotifications: (
    page?: number,
    limit?: number,
    unreadOnly?: boolean
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> => apiClient.get("/notifications", { page, limit, unreadOnly }),

  markAsRead: (notificationId: string): Promise<void> =>
    apiClient.put(`/notifications/${notificationId}/read`),

  markAllAsRead: (): Promise<void> => apiClient.put("/notifications/read-all"),

  deleteNotification: (notificationId: string): Promise<void> =>
    apiClient.delete(`/notifications/${notificationId}`),

  getUnreadCount: (): Promise<{ count: number }> =>
    apiClient.get("/notifications/unread-count"),

  // Notification preferences
  getPreferences: (): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    sessionReminders: boolean;
    matchSuggestions: boolean;
    messageNotifications: boolean;
    creditNotifications: boolean;
    marketingEmails: boolean;
    reminderTiming: {
      session24h: boolean;
      session1h: boolean;
      session15m: boolean;
    };
  }> => apiClient.get("/notifications/preferences"),

  updatePreferences: (
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> =>
    apiClient.put("/notifications/preferences", preferences),

  // Push notification subscription
  subscribeToPush: (subscription: PushSubscription): Promise<void> =>
    apiClient.post("/notifications/push-subscribe", { subscription }),

  unsubscribeFromPush: (): Promise<void> =>
    apiClient.delete("/notifications/push-subscribe"),

  // Test notifications (for development)
  sendTestNotification: (type: string): Promise<void> =>
    apiClient.post("/notifications/test", { type }),
};
