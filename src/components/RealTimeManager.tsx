import { useSessionReminders, SessionReminder } from "./SessionReminder";
import {
  useLiveMatchSuggestions,
  LiveMatchSuggestion,
} from "./LiveMatchSuggestion";
import { useJoinSession } from "../hooks/useSessions";
import { useNavigate } from "react-router-dom";

export const RealTimeManager = () => {
  const { reminders, dismissReminder } = useSessionReminders();
  const { suggestions, dismissSuggestion } = useLiveMatchSuggestions();
  const joinSessionMutation = useJoinSession();
  const navigate = useNavigate();

  const handleJoinSession = async (sessionId: string) => {
    try {
      const result = await joinSessionMutation.mutateAsync(sessionId);
      if (result.videoLink) {
        window.open(result.videoLink, "_blank");
      }
      dismissReminder(sessionId);
    } catch (error) {
      console.error("Failed to join session:", error);
    }
  };

  return (
    <>
      {/* Session Reminders */}
      {reminders.map((session, index) => (
        <div
          key={session.id}
          style={{ top: `${1 + index * 12}rem` }}
          className="fixed right-4 z-50"
        >
          <SessionReminder
            session={session}
            onDismiss={() => dismissReminder(session.id)}
            onJoin={() => handleJoinSession(session.id)}
          />
        </div>
      ))}

      {/* Live Match Suggestions */}
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id}
          style={{ top: `${5 + index * 12}rem` }}
          className="fixed right-4 z-40"
        >
          <LiveMatchSuggestion
            match={suggestion}
            onDismiss={() => dismissSuggestion(suggestion.id)}
          />
        </div>
      ))}
    </>
  );
};

export default RealTimeManager;
