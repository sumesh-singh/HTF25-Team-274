import { io, Socket } from "socket.io-client";
import { Message, Notification, Session, MatchSuggestion } from "../types/api";

interface ClientEvents {
  join_conversation: (conversationId: string) => void;
  leave_conversation: (conversationId: string) => void;
  send_message: (data: {
    conversationId: string;
    content: string;
    type: string;
  }) => void;
  typing_start: (conversationId: string) => void;
  typing_stop: (conversationId: string) => void;
  join_session: (sessionId: string) => void;
  session_update: (data: { sessionId: string; status: string }) => void;
}

interface ServerEvents {
  message_received: (message: Message) => void;
  message_updated: (message: Message) => void;
  message_deleted: (messageId: string) => void;
  typing_indicator: (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  user_online: (userId: string) => void;
  user_offline: (userId: string) => void;
  notification: (notification: Notification) => void;
  session_reminder: (session: Session) => void;
  session_updated: (session: Session) => void;
  match_suggestion: (match: MatchSuggestion) => void;
  credit_updated: (data: { balance: number; transaction: any }) => void;
  skill_verified: (data: { userSkillId: string; isVerified: boolean }) => void;
}

class SocketManager {
  private socket: Socket<ServerEvents, ClientEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): Socket<ServerEvents, ClientEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);

      // Auto-reconnect for certain disconnect reasons
      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }

      this.handleReconnect();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.handleReconnect();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.socket?.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
  }

  getSocket(): Socket<ServerEvents, ClientEvents> | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Conversation methods
  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leave_conversation", conversationId);
  }

  sendMessage(conversationId: string, content: string, type = "text") {
    this.socket?.emit("send_message", { conversationId, content, type });
  }

  startTyping(conversationId: string) {
    this.socket?.emit("typing_start", conversationId);
  }

  stopTyping(conversationId: string) {
    this.socket?.emit("typing_stop", conversationId);
  }

  // Session methods
  joinSession(sessionId: string) {
    this.socket?.emit("join_session", sessionId);
  }

  updateSession(sessionId: string, status: string) {
    this.socket?.emit("session_update", { sessionId, status });
  }

  // Event listeners
  onMessageReceived(callback: (message: Message) => void) {
    this.socket?.on("message_received", callback);
  }

  onMessageUpdated(callback: (message: Message) => void) {
    this.socket?.on("message_updated", callback);
  }

  onMessageDeleted(callback: (messageId: string) => void) {
    this.socket?.on("message_deleted", callback);
  }

  onTypingIndicator(
    callback: (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => void
  ) {
    this.socket?.on("typing_indicator", callback);
  }

  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on("user_online", callback);
  }

  onUserOffline(callback: (userId: string) => void) {
    this.socket?.on("user_offline", callback);
  }

  onNotification(callback: (notification: Notification) => void) {
    this.socket?.on("notification", callback);
  }

  onSessionReminder(callback: (session: Session) => void) {
    this.socket?.on("session_reminder", callback);
  }

  onSessionUpdated(callback: (session: Session) => void) {
    this.socket?.on("session_updated", callback);
  }

  onMatchSuggestion(callback: (match: MatchSuggestion) => void) {
    this.socket?.on("match_suggestion", callback);
  }

  onCreditUpdated(
    callback: (data: { balance: number; transaction: any }) => void
  ) {
    this.socket?.on("credit_updated", callback);
  }

  onSkillVerified(
    callback: (data: { userSkillId: string; isVerified: boolean }) => void
  ) {
    this.socket?.on("skill_verified", callback);
  }

  // Remove listeners
  off(event: keyof ServerEvents, callback?: Function) {
    this.socket?.off(event, callback as any);
  }
}

// Create singleton instance
export const socketManager = new SocketManager();

// Export for use in components
export default socketManager;
