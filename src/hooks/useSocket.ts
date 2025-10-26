import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketManager } from "../lib/socket";
import { useAuthStore } from "../stores/authStore";
import { Message, Notification, Session, MatchSuggestion } from "../types/api";

export const useSocket = () => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(
    new Map()
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketManager.disconnect();
      setIsConnected(false);
      return;
    }

    // Connect to socket
    const socket = socketManager.connect(accessToken);

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    };

    const handleMessageReceived = (message: Message) => {
      // Update messages cache
      queryClient.setQueryData(
        ["messages", message.conversationId, 1, 50],
        (oldData: any) => {
          if (!oldData) return oldData;

          // Check if message already exists (avoid duplicates)
          const messageExists = oldData.messages.some(
            (msg: Message) => msg.id === message.id
          );
          if (messageExists) return oldData;

          return {
            ...oldData,
            messages: [message, ...oldData.messages],
            total: oldData.total + 1,
          };
        }
      );

      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Update unread count
      queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    };

    const handleMessageUpdated = (message: Message) => {
      // Update message in cache
      queryClient.setQueriesData({ queryKey: ["messages"] }, (oldData: any) => {
        if (!oldData?.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.map((msg: Message) =>
            msg.id === message.id ? message : msg
          ),
        };
      });
    };

    const handleMessageDeleted = (messageId: string) => {
      // Remove message from cache
      queryClient.setQueriesData({ queryKey: ["messages"] }, (oldData: any) => {
        if (!oldData?.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.filter(
            (msg: Message) => msg.id !== messageId
          ),
          total: Math.max(0, oldData.total - 1),
        };
      });
    };

    const handleTypingIndicator = ({
      conversationId,
      userId,
      isTyping,
    }: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      setTypingUsers((prev) => {
        const newMap = new Map(prev);
        const conversationTypers = newMap.get(conversationId) || new Set();

        if (isTyping) {
          conversationTypers.add(userId);
        } else {
          conversationTypers.delete(userId);
        }

        if (conversationTypers.size === 0) {
          newMap.delete(conversationId);
        } else {
          newMap.set(conversationId, conversationTypers);
        }

        return newMap;
      });
    };

    const handleUserOnline = (userId: string) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    const handleUserOffline = (userId: string) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    const handleNotification = (notification: Notification) => {
      // Add notification to cache
      queryClient.setQueryData(
        ["notifications", 1, 20, false],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            notifications: [notification, ...oldData.notifications],
            total: oldData.total + 1,
            unreadCount: oldData.unreadCount + 1,
          };
        }
      );

      // Update unread count
      queryClient.setQueryData(["notification-unread-count"], (oldData: any) =>
        oldData ? { count: oldData.count + 1 } : { count: 1 }
      );
    };

    const handleSessionReminder = (session: Session) => {
      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(`Session Reminder: ${session.title}`, {
          body: `Your session starts in 15 minutes`,
          icon: "/favicon.ico",
        });
      }

      // Update session cache
      queryClient.setQueryData(["session", session.id], session);
    };

    const handleSessionUpdated = (session: Session) => {
      // Update session in cache
      queryClient.setQueryData(["session", session.id], session);

      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessions", "upcoming"] });
    };

    const handleMatchSuggestion = (match: MatchSuggestion) => {
      // Add to match suggestions cache
      queryClient.setQueryData(["match-suggestions"], (oldData: any) => {
        if (!oldData) return [match];
        return [match, ...oldData];
      });
    };

    const handleCreditUpdated = ({
      balance,
      transaction,
    }: {
      balance: number;
      transaction: any;
    }) => {
      // Update credit balance
      queryClient.setQueryData(["credit-balance"], { balance });

      // Invalidate transactions to show new transaction
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
    };

    const handleSkillVerified = ({
      userSkillId,
      isVerified,
    }: {
      userSkillId: string;
      isVerified: boolean;
    }) => {
      // Update user skills cache
      queryClient.setQueriesData(
        { queryKey: ["user-skills"] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((skill: any) =>
            skill.id === userSkillId ? { ...skill, isVerified } : skill
          );
        }
      );
    };

    // Add event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socketManager.onMessageReceived(handleMessageReceived);
    socketManager.onMessageUpdated(handleMessageUpdated);
    socketManager.onMessageDeleted(handleMessageDeleted);
    socketManager.onTypingIndicator(handleTypingIndicator);
    socketManager.onUserOnline(handleUserOnline);
    socketManager.onUserOffline(handleUserOffline);
    socketManager.onNotification(handleNotification);
    socketManager.onSessionReminder(handleSessionReminder);
    socketManager.onSessionUpdated(handleSessionUpdated);
    socketManager.onMatchSuggestion(handleMatchSuggestion);
    socketManager.onCreditUpdated(handleCreditUpdated);
    socketManager.onSkillVerified(handleSkillVerified);

    // Cleanup on unmount
    return () => {
      socketManager.disconnect();
      setIsConnected(false);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    };
  }, [isAuthenticated, accessToken, queryClient]);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    socket: socketManager.getSocket(),
    joinConversation: socketManager.joinConversation.bind(socketManager),
    leaveConversation: socketManager.leaveConversation.bind(socketManager),
    sendMessage: socketManager.sendMessage.bind(socketManager),
    startTyping: socketManager.startTyping.bind(socketManager),
    stopTyping: socketManager.stopTyping.bind(socketManager),
    joinSession: socketManager.joinSession.bind(socketManager),
    updateSession: socketManager.updateSession.bind(socketManager),
  };
};

// Hook for typing indicators in a specific conversation
export const useTypingIndicator = (conversationId: string) => {
  const { typingUsers } = useSocket();
  const { user } = useAuthStore();

  const typingUserIds = typingUsers.get(conversationId) || new Set();

  // Filter out current user from typing indicators
  const otherTypingUsers = Array.from(typingUserIds).filter(
    (userId) => userId !== user?.id
  );

  return {
    isTyping: otherTypingUsers.length > 0,
    typingUserIds: otherTypingUsers,
    typingCount: otherTypingUsers.length,
  };
};

// Hook for online status of specific users
export const useOnlineStatus = (userIds: string[]) => {
  const { onlineUsers } = useSocket();

  return userIds.reduce((acc, userId) => {
    acc[userId] = onlineUsers.has(userId);
    return acc;
  }, {} as Record<string, boolean>);
};
