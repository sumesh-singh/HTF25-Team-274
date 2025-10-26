import { useEffect, useState } from "react";
import { useTypingIndicator } from "../hooks/useSocket";

interface TypingIndicatorProps {
  conversationId: string;
  className?: string;
}

export const TypingIndicator = ({
  conversationId,
  className = "",
}: TypingIndicatorProps) => {
  const { isTyping, typingCount } = useTypingIndicator(conversationId);
  const [dots, setDots] = useState("");

  // Animate the dots
  useEffect(() => {
    if (!isTyping) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  const getTypingText = () => {
    if (typingCount === 1) {
      return "Someone is typing";
    } else if (typingCount === 2) {
      return "2 people are typing";
    } else {
      return `${typingCount} people are typing`;
    }
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary ${className}`}
    >
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
      <span>
        {getTypingText()}
        {dots}
      </span>
    </div>
  );
};

export default TypingIndicator;
