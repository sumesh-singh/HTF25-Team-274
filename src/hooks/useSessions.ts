import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionsService } from "../services/sessionsService";
import { CreateSessionRequest, SessionRating } from "../types/api";

export const useSessions = (status?: string) => {
  return useQuery({
    queryKey: ["sessions", status],
    queryFn: () => sessionsService.getSessions(status),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsService.getSession(sessionId),
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUpcomingSessions = () => {
  return useQuery({
    queryKey: ["sessions", "upcoming"],
    queryFn: sessionsService.getUpcomingSessions,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useSessionHistory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["sessions", "history", page, limit],
    queryFn: () => sessionsService.getSessionHistory(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionRequest) =>
      sessionsService.createSession(data),
    onSuccess: () => {
      // Invalidate sessions queries
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      // Invalidate credit balance since credits might be escrowed
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
    },
  });
};

export const useConfirmSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      selectedTime,
    }: {
      sessionId: string;
      selectedTime: string;
    }) => sessionsService.confirmSession(sessionId, selectedTime),
    onSuccess: (_, variables) => {
      // Invalidate specific session
      queryClient.invalidateQueries({
        queryKey: ["session", variables.sessionId],
      });

      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      // Invalidate upcoming sessions
      queryClient.invalidateQueries({ queryKey: ["sessions", "upcoming"] });
    },
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      reason,
    }: {
      sessionId: string;
      reason?: string;
    }) => sessionsService.cancelSession(sessionId, reason),
    onSuccess: (_, variables) => {
      // Invalidate specific session
      queryClient.invalidateQueries({
        queryKey: ["session", variables.sessionId],
      });

      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      // Invalidate credit balance (refund might be processed)
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
    },
  });
};

export const useJoinSession = () => {
  return useMutation({
    mutationFn: (sessionId: string) => sessionsService.joinSession(sessionId),
  });
};

export const useRateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      rating,
    }: {
      sessionId: string;
      rating: Omit<SessionRating, "id" | "sessionId" | "raterId" | "createdAt">;
    }) => sessionsService.rateSession(sessionId, rating),
    onSuccess: (_, variables) => {
      // Invalidate specific session
      queryClient.invalidateQueries({
        queryKey: ["session", variables.sessionId],
      });

      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      // Invalidate session history
      queryClient.invalidateQueries({ queryKey: ["sessions", "history"] });

      // Invalidate credit balance (credits might be released)
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });

      // Invalidate user profile (rating might have changed)
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useSessionRatings = (sessionId: string) => {
  return useQuery({
    queryKey: ["session-ratings", sessionId],
    queryFn: () => sessionsService.getSessionRatings(sessionId),
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Learning Circles
export const useCreateLearningCircle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionRequest & { maxParticipants: number }) =>
      sessionsService.createLearningCircle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
    },
  });
};

export const useJoinLearningCircle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      sessionsService.joinLearningCircle(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};

// Micro Learning
export const useCreateMicroLearning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Omit<CreateSessionRequest, "duration"> & { question: string }
    ) => sessionsService.createMicroLearning(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["credit-balance"] });
    },
  });
};
