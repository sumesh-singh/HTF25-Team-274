import { useState, useEffect } from "react";
import { X, Heart, UserPlus, Star, MapPin, Clock } from "lucide-react";
import { MatchSuggestion } from "../types/api";
import { useSocket } from "../hooks/useSocket";
import { useFavoriteMatch, usePassMatch } from "../hooks/useMatches";
import OnlineStatus from "./OnlineStatus";

interface LiveMatchSuggestionProps {
  match: MatchSuggestion;
  onDismiss: () => void;
}

export const LiveMatchSuggestion = ({
  match,
  onDismiss,
}: LiveMatchSuggestionProps) => {
  const favoriteMatchMutation = useFavoriteMatch();
  const passMatchMutation = usePassMatch();

  const handleFavorite = async () => {
    try {
      await favoriteMatchMutation.mutateAsync(match.id);
      onDismiss();
    } catch (error) {
      console.error("Failed to favorite match:", error);
    }
  };

  const handlePass = async () => {
    try {
      await passMatchMutation.mutateAsync(match.id);
      onDismiss();
    } catch (error) {
      console.error("Failed to pass match:", error);
    }
  };

  const getMatchReasonIcon = (reason: string) => {
    if (reason.includes("skill")) return "🎯";
    if (reason.includes("rating")) return "⭐";
    if (reason.includes("availability")) return "⏰";
    if (reason.includes("location")) return "📍";
    return "✨";
  };

  return (
    <div className="fixed top-20 right-4 z-40 w-80 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-full">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                New Match Found!
              </h3>
              <div className="flex items-center gap-1 text-xs text-primary">
                <span>{Math.round(match.score)}% match</span>
                <span>{getMatchReasonIcon(match.explanation)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            {match.user.avatar ? (
              <img
                src={match.user.avatar}
                alt={`${match.user.firstName} ${match.user.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {match.user.firstName[0]}
                  {match.user.lastName[0]}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <OnlineStatus userId={match.user.id} size="sm" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary">
              {match.user.firstName} {match.user.lastName}
            </h4>

            <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{match.user.rating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span>{match.user.totalSessions} sessions</span>
            </div>

            {match.user.location && (
              <div className="flex items-center gap-1 text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                <MapPin className="h-3 w-3" />
                <span>{match.user.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Explanation */}
        <div className="bg-primary/5 rounded-lg p-3 mb-4">
          <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
            {match.explanation}
          </p>
        </div>

        {/* Skill Matches */}
        {match.skillMatches && match.skillMatches.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              Skill Exchange Opportunities:
            </h5>
            <div className="space-y-2">
              {match.skillMatches.slice(0, 2).map((skillMatch, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-green-600 dark:text-green-400">
                    You teach: {skillMatch.teachingSkill.skill.name}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    They teach: {skillMatch.learningSkill.skill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePass}
            disabled={passMatchMutation.isPending}
            className="flex-1 px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Pass
          </button>
          <button
            onClick={handleFavorite}
            disabled={favoriteMatchMutation.isPending}
            className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Heart className="h-3 w-3" />
            Favorite
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to manage live match suggestions
export const useLiveMatchSuggestions = () => {
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleMatchSuggestion = (match: MatchSuggestion) => {
      setSuggestions((prev) => {
        // Avoid duplicates and limit to 3 suggestions
        const filtered = prev.filter((s) => s.id !== match.id);
        return [match, ...filtered].slice(0, 3);
      });

      // Auto-dismiss after 30 seconds
      setTimeout(() => {
        setSuggestions((prev) => prev.filter((s) => s.id !== match.id));
      }, 30 * 1000);
    };

    socket.on("match_suggestion", handleMatchSuggestion);

    return () => {
      socket.off("match_suggestion", handleMatchSuggestion);
    };
  }, [socket]);

  const dismissSuggestion = (matchId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== matchId));
  };

  return {
    suggestions,
    dismissSuggestion,
  };
};

export default LiveMatchSuggestion;
