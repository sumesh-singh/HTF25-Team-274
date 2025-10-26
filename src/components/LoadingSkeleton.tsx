import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export const Skeleton = ({
  className = "",
  width,
  height,
  rounded = false,
}: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";
  const roundedClasses = rounded ? "rounded-full" : "rounded";
  const sizeClasses = width || height ? "" : "h-4 w-full";

  const style = {
    ...(width && { width }),
    ...(height && { height }),
  };

  return (
    <div
      className={`${baseClasses} ${roundedClasses} ${sizeClasses} ${className}`}
      style={style}
    />
  );
};

export const SkillCardSkeleton = () => (
  <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton width="24px" height="24px" rounded />
        <Skeleton width="24px" height="24px" rounded />
      </div>
    </div>

    <div className="mb-4">
      <Skeleton className="h-4 w-20 mb-2" />
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <Skeleton className="h-2 w-3/4 rounded-full" />
      </div>
    </div>

    <div className="flex gap-2 mb-4">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>

    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

export const MatchCardSkeleton = () => (
  <div className="bg-surface-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <Skeleton width="64px" height="64px" rounded />
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton width="48px" height="48px" rounded />
    </div>

    <div className="mb-4 p-3 bg-primary/5 rounded-lg">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>

    <div className="mb-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>

    <div className="flex justify-between mb-4">
      <div className="flex items-center gap-2">
        <Skeleton width="16px" height="16px" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>

    <div className="grid grid-cols-3 gap-2">
      <Skeleton className="h-8 rounded-lg" />
      <Skeleton className="h-8 rounded-lg" />
      <Skeleton className="h-8 rounded-lg" />
    </div>
  </div>
);

export const MessageSkeleton = () => (
  <div className="flex gap-3 p-4">
    <Skeleton width="40px" height="40px" rounded />
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

export const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border-b border-border-light dark:border-border-dark">
    <Skeleton width="48px" height="48px" rounded />
    <div className="flex-1">
      <div className="flex justify-between items-start mb-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

export const SessionCardSkeleton = () => (
  <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-6">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>

    <div className="flex items-center gap-4 mb-4">
      <Skeleton width="40px" height="40px" rounded />
      <div>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>

    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Skeleton width="16px" height="16px" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width="16px" height="16px" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>

    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="h-9 flex-1 rounded-lg" />
    </div>
  </div>
);

export const NotificationSkeleton = () => (
  <div className="flex gap-3 p-4">
    <Skeleton width="32px" height="32px" rounded />
    <div className="flex-1">
      <div className="flex justify-between items-start mb-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

export const TableSkeleton = ({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) => (
  <div className="space-y-4">
    {/* Header */}
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
