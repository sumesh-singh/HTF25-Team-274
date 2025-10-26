import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesService } from "../services/messagesService";
import { SendMessageRequest } from "../types/api";

export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: messagesService.getConversations,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => messagesService.getConversation(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useMessages = (conversationId: string, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ["messages", conversationId, page, limit],
    queryFn: () => messagesService.getMessages(conversationId, page, limit),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) =>
      messagesService.createConversation(participantId),
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesService.sendMessage(data),
    onSuccess: (newMessage, variables) => {
      // Update messages cache optimistically
      queryClient.setQueryData(
        ["messages", variables.conversationId, 1, 50],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [newMessage, ...oldData.messages],
            total: oldData.total + 1,
          };
        }
      );

      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Invalidate specific conversation
      queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => messagesService.editMessage(messageId, content),
    onSuccess: (updatedMessage) => {
      // Update all message caches that might contain this message
      queryClient.setQueriesData({ queryKey: ["messages"] }, (oldData: any) => {
        if (!oldData?.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.map((msg: any) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          ),
        };
      });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesService.deleteMessage(messageId),
    onSuccess: (_, messageId) => {
      // Remove message from all caches
      queryClient.setQueriesData({ queryKey: ["messages"] }, (oldData: any) => {
        if (!oldData?.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.filter((msg: any) => msg.id !== messageId),
          total: Math.max(0, oldData.total - 1),
        };
      });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagesService.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      // Update conversation unread count
      queryClient.setQueryData(
        ["conversation", conversationId],
        (oldData: any) => (oldData ? { ...oldData, unreadCount: 0 } : oldData)
      );

      // Update conversations list
      queryClient.setQueryData(["conversations"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        );
      });
    },
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      file,
      onProgress,
    }: {
      conversationId: string;
      file: File;
      onProgress?: (progress: number) => void;
    }) => messagesService.uploadFile(conversationId, file, onProgress),
    onSuccess: (newMessage, variables) => {
      // Add file message to cache
      queryClient.setQueryData(
        ["messages", variables.conversationId, 1, 50],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [newMessage, ...oldData.messages],
            total: oldData.total + 1,
          };
        }
      );

      // Invalidate conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useSearchMessages = (query: string, conversationId?: string) => {
  return useQuery({
    queryKey: ["message-search", query, conversationId],
    queryFn: () => messagesService.searchMessages(query, conversationId),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesService.addReaction(messageId, emoji),
    onSuccess: (_, variables) => {
      // Invalidate messages to refresh reactions
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesService.removeReaction(messageId, emoji),
    onSuccess: () => {
      // Invalidate messages to refresh reactions
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};
