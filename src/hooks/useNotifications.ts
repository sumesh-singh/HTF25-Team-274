import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notificationsService";
import { UserPreferences } from "../types/api";

export const useNotifications = (page = 1, limit = 20, unreadOnly = false) => {
  return useQuery({
    queryKey: ["notifications", page, limit, unreadOnly],
    queryFn: () =>
      notificationsService.getNotifications(page, limit, unreadOnly),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: notificationsService.getUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Update notification in cache
      queryClient.setQueriesData(
        { queryKey: ["notifications"] },
        (oldData: any) => {
          if (!oldData?.notifications) return oldData;

          return {
            ...oldData,
            notifications: oldData.notifications.map((notif: any) =>
              notif.id === notificationId ? { ...notif, isRead: true } : notif
            ),
            unreadCount: Math.max(0, oldData.unreadCount - 1),
          };
        }
      );

      // Update unread count
      queryClient.setQueryData(["notification-unread-count"], (oldData: any) =>
        oldData ? { count: Math.max(0, oldData.count - 1) } : oldData
      );
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      // Mark all notifications as read in cache
      queryClient.setQueriesData(
        { queryKey: ["notifications"] },
        (oldData: any) => {
          if (!oldData?.notifications) return oldData;

          return {
            ...oldData,
            notifications: oldData.notifications.map((notif: any) => ({
              ...notif,
              isRead: true,
            })),
            unreadCount: 0,
          };
        }
      );

      // Reset unread count
      queryClient.setQueryData(["notification-unread-count"], { count: 0 });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.deleteNotification(notificationId),
    onSuccess: (_, notificationId) => {
      // Remove notification from cache
      queryClient.setQueriesData(
        { queryKey: ["notifications"] },
        (oldData: any) => {
          if (!oldData?.notifications) return oldData;

          const deletedNotification = oldData.notifications.find(
            (n: any) => n.id === notificationId
          );
          const wasUnread = deletedNotification && !deletedNotification.isRead;

          return {
            ...oldData,
            notifications: oldData.notifications.filter(
              (notif: any) => notif.id !== notificationId
            ),
            total: Math.max(0, oldData.total - 1),
            unreadCount: wasUnread
              ? Math.max(0, oldData.unreadCount - 1)
              : oldData.unreadCount,
          };
        }
      );

      // Update unread count if deleted notification was unread
      queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    },
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: notificationsService.getPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) =>
      notificationsService.updatePreferences(preferences),
    onSuccess: (updatedPreferences) => {
      // Update preferences cache
      queryClient.setQueryData(
        ["notification-preferences"],
        updatedPreferences
      );
    },
  });
};

export const useSubscribeToPush = () => {
  return useMutation({
    mutationFn: (subscription: PushSubscription) =>
      notificationsService.subscribeToPush(subscription),
  });
};

export const useUnsubscribeFromPush = () => {
  return useMutation({
    mutationFn: notificationsService.unsubscribeFromPush,
  });
};

export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: (type: string) =>
      notificationsService.sendTestNotification(type),
    onSuccess: () => {
      // Invalidate notifications to show the test notification
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({
          queryKey: ["notification-unread-count"],
        });
      }, 1000); // Wait a second for the notification to be processed
    },
  });
};
