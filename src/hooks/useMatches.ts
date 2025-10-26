import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchesService } from "../services/matchesService";
import { MatchFilters } from "../types/api";

export const useMatchSuggestions = (limit?: number) => {
  return useQuery({
    queryKey: ["match-suggestions", limit],
    queryFn: () => matchesService.getMatchSuggestions(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });
};

export const useFilterMatches = () => {
  return useMutation({
    mutationFn: (filters: MatchFilters) =>
      matchesService.filterMatches(filters),
  });
};

export const useFavoriteMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchesService.favoriteMatch(matchId),
    onSuccess: (_, matchId) => {
      // Remove from suggestions and add to favorites
      queryClient.setQueryData(["match-suggestions"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((match: any) => match.id !== matchId);
      });

      // Invalidate favorites
      queryClient.invalidateQueries({ queryKey: ["favorite-matches"] });

      // Invalidate match stats
      queryClient.invalidateQueries({ queryKey: ["match-stats"] });
    },
  });
};

export const usePassMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchesService.passMatch(matchId),
    onSuccess: (_, matchId) => {
      // Remove from suggestions
      queryClient.setQueryData(["match-suggestions"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((match: any) => match.id !== matchId);
      });

      // Invalidate match stats
      queryClient.invalidateQueries({ queryKey: ["match-stats"] });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      matchesService.blockUser(userId, reason),
    onSuccess: (_, variables) => {
      // Remove from all match-related caches
      queryClient.setQueryData(["match-suggestions"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter(
          (match: any) => match.user.id !== variables.userId
        );
      });

      queryClient.setQueryData(["favorite-matches"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter(
          (match: any) => match.user.id !== variables.userId
        );
      });

      // Invalidate search results
      queryClient.invalidateQueries({ queryKey: ["user-search"] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => matchesService.unblockUser(userId),
    onSuccess: () => {
      // Invalidate match suggestions to potentially show unblocked user
      queryClient.invalidateQueries({ queryKey: ["match-suggestions"] });
    },
  });
};

export const useFavoriteMatches = () => {
  return useQuery({
    queryKey: ["favorite-matches"],
    queryFn: matchesService.getFavoriteMatches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => matchesService.removeFavorite(matchId),
    onSuccess: (_, matchId) => {
      // Remove from favorites cache
      queryClient.setQueryData(["favorite-matches"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((match: any) => match.id !== matchId);
      });

      // Invalidate match stats
      queryClient.invalidateQueries({ queryKey: ["match-stats"] });
    },
  });
};

export const useSearchUsers = (
  query: string,
  filters?: Partial<MatchFilters>
) => {
  return useQuery({
    queryKey: ["user-search", query, filters],
    queryFn: () => matchesService.searchUsers(query, filters),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => matchesService.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMatchStats = () => {
  return useQuery({
    queryKey: ["match-stats"],
    queryFn: matchesService.getMatchStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
