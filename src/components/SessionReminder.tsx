import { useState, useEffect } from "react";
import { X, Calendar, Clock, Video, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Session } from "../types/api";
import { useSocket } from "../hooks/useSocket";

interface SessionReminderProps {
  session: Session;
  onDismiss: () => void;
  onJoin: () => void;
}

export const SessionReminder = ({
  session,
  onDismiss,
  onJoin,
}: SessionReminderProps) => {
  const [timeUntilSession, setTimeUntilSession] = useState("");
  const [canJoin, setCanJoin] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const sessionTime = new Date(session.scheduledAt);
      const now = new Date();
      const timeDiff = sessionTime.getTime() - now.getTime();

      // Can join 15 minutes before session
      const canJoinTime = sessionTime.getTime() - 15 * 60 * 1000;
      setCanJoin(now.getTime() >= canJoinTime);

      if (timeDiff > 0) {
        setTimeUntilSession(
          formatDistanceToNow(sessionTime, { addSuffix: true })
        );
      } else {
        setTimeUntilSession("Session has started");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session.scheduledAt]);

  const getOtherParticipant = () => {
    // This would need to be determined based on current user context
    // For now, we'll show the teacher if current user is learner, and vice versa
    return session.teacher; // Simplified for this example
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-lg p-4 animate-slide-in-right">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Session Reminder
            </h3>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {timeUntilSession}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            {session.title}
          </h4>
          <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            <Clock className="h-3 w-3" />
            <span>
              {format(new Date(session.scheduledAt), "MMM d, yyyy at h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
            <User className="h-3 w-3" />
            <span>
              with {otherParticipant.firstName} {otherParticipant.lastName}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-primary/5 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={onJoin}
            disabled={!canJoin}
            className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Video className="h-3 w-3" />
            {canJoin ? "Join Session" : "Join in 15 min"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to manage session reminders
export const useSessionReminders = () => {
  const [reminders, setReminders] = useState<Session[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleSessionReminder = (session: Session) => {
      setReminders((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r.id === session.id)) return prev;
        return [...prev, session];
      });

      // Auto-dismiss after 5 minutes
      setTimeout(() => {
        setReminders((prev) => prev.filter((r) => r.id !== session.id));
      }, 5 * 60 * 1000);
    };

    socket.on("session_reminder", handleSessionReminder);

    return () => {
      socket.off("session_reminder", handleSessionReminder);
    };
  }, [socket]);

  const dismissReminder = (sessionId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== sessionId));
  };

  return {
    reminders,
    dismissReminder,
  };
};

export default SessionReminder;
