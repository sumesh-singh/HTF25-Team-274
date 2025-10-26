import { useOnlineStatus } from "../hooks/useSocket";

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const OnlineStatus = ({
  userId,
  showText = false,
  className = "",
  size = "md",
}: OnlineStatusProps) => {
  const onlineStatus = useOnlineStatus([userId]);
  const isOnline = onlineStatus[userId] || false;

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
          }`}
        />
        {isOnline && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`}
          />
        )}
      </div>
      {showText && (
        <span
          className={`${textSizeClasses[size]} ${
            isOnline
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
