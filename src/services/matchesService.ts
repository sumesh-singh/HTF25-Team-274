import { apiClient } from "../lib/api";
import { MatchSuggestion, MatchFilters, User } from "../types/api";

export const matchesService = {
  // Match suggestions
  getMatchSuggestions: (limit?: number): Promise<MatchSuggestion[]> =>
    apiClient.get("/matches/suggestions", { limit }),

  filterMatches: (filters: MatchFilters): Promise<MatchSuggestion[]> =>
    apiClient.post("/matches/filter", filters),

  // Match interactions
  favoriteMatch: (matchId: string): Promise<void> =>
    apiClient.post(`/matches/${matchId}/favorite`),

  passMatch: (matchId: string): Promise<void> =>
    apiClient.post(`/matches/${matchId}/pass`),

  blockUser: (userId: string, reason?: string): Promise<void> =>
    apiClient.post(`/matches/${userId}/block`, { reason }),

  unblockUser: (userId: string): Promise<void> =>
    apiClient.delete(`/matches/${userId}/block`),

  // Favorites
  getFavoriteMatches: (): Promise<MatchSuggestion[]> =>
    apiClient.get("/matches/favorites"),

  removeFavorite: (matchId: string): Promise<void> =>
    apiClient.delete(`/matches/${matchId}/favorite`),

  // User discovery
  searchUsers: (
    query: string,
    filters?: Partial<MatchFilters>
  ): Promise<User[]> => apiClient.get("/matches/search", { query, ...filters }),

  getUserProfile: (userId: string): Promise<User> =>
    apiClient.get(`/users/${userId}`),

  // Match analytics
  getMatchStats: (): Promise<{
    totalSuggestions: number;
    favoriteCount: number;
    passCount: number;
    responseRate: number;
  }> => apiClient.get("/matches/stats"),
};
