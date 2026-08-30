import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 rounded-xl ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-3xl p-6 space-y-4 bg-white/50 dark:bg-[#0c1322]/50 border border-slate-200/60 dark:border-slate-800/60 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-5 rounded-lg" />
        <Skeleton className="w-full h-3.5 rounded-lg" />
        <Skeleton className="w-2/3 h-3.5 rounded-lg" />
      </div>
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <Skeleton className="w-20 h-4 rounded-lg" />
        <Skeleton className="w-14 h-4 rounded-lg" />
      </div>
    </div>
  );
};

export const DocumentCardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-3xl p-6 space-y-4 bg-white/50 dark:bg-[#0c1322]/50 border border-slate-200/60 dark:border-slate-800/60 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="w-32 h-4 rounded-md" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-12 h-5 rounded-full" />
      </div>
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <Skeleton className="w-16 h-4 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="w-7 h-7 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="glass-card rounded-3xl p-5 bg-white/50 dark:bg-[#0c1322]/50 border border-slate-200/60 dark:border-slate-800/60 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="w-12 h-4 rounded-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="w-16 h-6 rounded-md" />
            <Skeleton className="w-24 h-3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
