import { useState, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  Clock,
  MessageCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../hooks/useNotifications";
import { Notification, NotificationType } from "../types/api";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.MESSAGE_RECEIVED:
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case NotificationType.SESSION_REMINDER:
    case NotificationType.SESSION_CONFIRMED:
    case NotificationType.SESSION_CANCELLED:
      return <Calendar className="h-4 w-4 text-green-500" />;
    case NotificationType.CREDIT_EARNED:
      return <CreditCard className="h-4 w-4 text-yellow-500" />;
    case NotificationType.MATCH_SUGGESTION:
      return <Bell className="h-4 w-4 text-purple-500" />;
    case NotificationType.SKILL_VERIFIED:
      return <Check className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.MESSAGE_RECEIVED:
      return "bg-blue-500/10 border-blue-500/20";
    case NotificationType.SESSION_REMINDER:
    case NotificationType.SESSION_CONFIRMED:
      return "bg-green-500/10 border-green-500/20";
    case NotificationType.SESSION_CANCELLED:
      return "bg-red-500/10 border-red-500/20";
    case NotificationType.CREDIT_EARNED:
      return "bg-yellow-500/10 border-yellow-500/20";
    case NotificationType.MATCH_SUGGESTION:
      return "bg-purple-500/10 border-purple-500/20";
    case NotificationType.SKILL_VERIFIED:
      return "bg-green-500/10 border-green-500/20";
    default:
      return "bg-gray-500/10 border-gray-500/20";
  }
};

export const NotificationDropdown = ({
  isOpen,
  onClose,
}: NotificationDropdownProps) => {
  const { data: notificationsData, isLoading } = useNotifications(1, 10, false);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.MESSAGE_RECEIVED:
        // Extract conversation ID from notification data if available
        if (notification.data?.conversationId) {
          window.location.href = `/chat/${notification.data.conversationId}`;
        } else {
          window.location.href = "/messages";
        }
        break;
      case NotificationType.SESSION_REMINDER:
      case NotificationType.SESSION_CONFIRMED:
      case NotificationType.SESSION_CANCELLED:
        if (notification.data?.sessionId) {
          window.location.href = `/sessions?highlight=${notification.data.sessionId}`;
        } else {
          window.location.href = "/sessions";
        }
        break;
      case NotificationType.MATCH_SUGGESTION:
        window.location.href = "/discover";
        break;
      case NotificationType.CREDIT_EARNED:
        window.location.href = "/credits";
        break;
      case NotificationType.SKILL_VERIFIED:
        window.location.href = "/skills";
        break;
      default:
        window.location.href = "/notifications";
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0) {
      await markAllAsReadMutation.mutateAsync();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 origin-top-right rounded-xl border border-border-light bg-card-light shadow-lg dark:border-border-dark dark:bg-card-dark z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-primary hover:text-primary-hover disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-8 w-8 text-text-light-secondary dark:text-text-dark-secondary mb-2" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-colors hover:bg-primary/5 ${
                  !notification.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 p-2 rounded-full ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-sm font-medium ${
                          !notification.isRead
                            ? "text-text-light-primary dark:text-text-dark-primary"
                            : "text-text-light-secondary dark:text-text-dark-secondary"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-text-light-secondary dark:text-text-dark-secondary" />
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border-light dark:border-border-dark">
          <NavLink
            to="/notifications"
            onClick={onClose}
            className="block w-full text-center text-sm text-primary hover:text-primary-hover py-2 rounded-lg hover:bg-primary/5 transition-colors"
          >
            View all notifications
          </NavLink>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
