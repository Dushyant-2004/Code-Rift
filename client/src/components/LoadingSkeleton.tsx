"use client";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score skeleton */}
      <div className="flex items-center gap-6 p-6 rounded-2xl bg-surface-800/50 border border-white/5">
        <div className="skeleton h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-full max-w-md" />
          <div className="skeleton h-4 w-64" />
        </div>
      </div>

      {/* Issues skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-surface-800/50 border border-white/5 space-y-3"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-5 w-48" />
            </div>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
