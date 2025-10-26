import { apiClient } from "../lib/api";
import { Session, CreateSessionRequest, SessionRating } from "../types/api";

export const sessionsService = {
  // Session management
  getSessions: (status?: string): Promise<Session[]> =>
    apiClient.get("/sessions", { status }),

  getSession: (sessionId: string): Promise<Session> =>
    apiClient.get(`/sessions/${sessionId}`),

  createSession: (data: CreateSessionRequest): Promise<Session> =>
    apiClient.post("/sessions", data),

  updateSession: (
    sessionId: string,
    data: Partial<Session>
  ): Promise<Session> => apiClient.put(`/sessions/${sessionId}`, data),

  cancelSession: (sessionId: string, reason?: string): Promise<void> =>
    apiClient.delete(`/sessions/${sessionId}`, { reason }),

  confirmSession: (sessionId: string, selectedTime: string): Promise<Session> =>
    apiClient.post(`/sessions/${sessionId}/confirm`, { selectedTime }),

  joinSession: (sessionId: string): Promise<{ videoLink: string }> =>
    apiClient.post(`/sessions/${sessionId}/join`),

  // Session ratings
  rateSession: (
    sessionId: string,
    rating: Omit<SessionRating, "id" | "sessionId" | "raterId" | "createdAt">
  ): Promise<SessionRating> =>
    apiClient.post(`/sessions/${sessionId}/rate`, rating),

  getSessionRatings: (sessionId: string): Promise<SessionRating[]> =>
    apiClient.get(`/sessions/${sessionId}/ratings`),

  // Session history
  getUpcomingSessions: (): Promise<Session[]> =>
    apiClient.get("/sessions/upcoming"),

  getSessionHistory: (
    page?: number,
    limit?: number
  ): Promise<{ sessions: Session[]; total: number }> =>
    apiClient.get("/sessions/history", { page, limit }),

  // Session types
  createLearningCircle: (
    data: CreateSessionRequest & { maxParticipants: number }
  ): Promise<Session> => apiClient.post("/sessions/learning-circle", data),

  joinLearningCircle: (sessionId: string): Promise<void> =>
    apiClient.post(`/sessions/${sessionId}/join-circle`),

  createMicroLearning: (
    data: Omit<CreateSessionRequest, "duration"> & { question: string }
  ): Promise<Session> =>
    apiClient.post("/sessions/micro-learning", { ...data, duration: 15 }),
};
