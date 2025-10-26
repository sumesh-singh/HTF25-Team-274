import { apiClient } from "../lib/api";
import { Message, Conversation, SendMessageRequest } from "../types/api";

export const messagesService = {
  // Conversations
  getConversations: (): Promise<Conversation[]> =>
    apiClient.get("/conversations"),

  getConversation: (conversationId: string): Promise<Conversation> =>
    apiClient.get(`/conversations/${conversationId}`),

  createConversation: (participantId: string): Promise<Conversation> =>
    apiClient.post("/conversations", { participantId }),

  // Messages
  getMessages: (
    conversationId: string,
    page?: number,
    limit?: number
  ): Promise<{ messages: Message[]; total: number }> =>
    apiClient.get(`/conversations/${conversationId}/messages`, { page, limit }),

  sendMessage: (data: SendMessageRequest): Promise<Message> =>
    apiClient.post(`/conversations/${data.conversationId}/messages`, data),

  editMessage: (messageId: string, content: string): Promise<Message> =>
    apiClient.put(`/messages/${messageId}`, { content }),

  deleteMessage: (messageId: string): Promise<void> =>
    apiClient.delete(`/messages/${messageId}`),

  markAsRead: (conversationId: string): Promise<void> =>
    apiClient.post(`/conversations/${conversationId}/read`),

  // File sharing
  uploadFile: (
    conversationId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Message> =>
    apiClient.uploadFile(
      `/conversations/${conversationId}/files`,
      file,
      onProgress
    ),

  // Search
  searchMessages: (
    query: string,
    conversationId?: string
  ): Promise<Message[]> =>
    apiClient.get("/messages/search", { query, conversationId }),

  // Message reactions (if implemented)
  addReaction: (messageId: string, emoji: string): Promise<void> =>
    apiClient.post(`/messages/${messageId}/reactions`, { emoji }),

  removeReaction: (messageId: string, emoji: string): Promise<void> =>
    apiClient.delete(`/messages/${messageId}/reactions/${emoji}`),
};
