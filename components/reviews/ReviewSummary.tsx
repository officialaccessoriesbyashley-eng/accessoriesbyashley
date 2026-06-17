import { StarDisplay } from "./StarDisplay";

interface ReviewStats {
  averageRating?: number | null;
  totalReviews?: number | null;
  ratingDistribution?: {
    five?: number | null;
    four?: number | null;
    three?: number | null;
    two?: number | null;
    one?: number | null;
  } | null;
}

export function ReviewSummary({
  stats,
  onFilterRating,
  activeFilter,
}: {
  stats: ReviewStats;
  onFilterRating?: (rating: number | null) => void;
  activeFilter?: number | null;
}) {
  const avg = stats.averageRating ?? 0;
  const total = stats.totalReviews ?? 0;
  const dist = stats.ratingDistribution;

  const counts = [
    { label: 5, count: dist?.five ?? 0 },
    { label: 4, count: dist?.four ?? 0 },
    { label: 3, count: dist?.three ?? 0 },
    { label: 2, count: dist?.two ?? 0 },
    { label: 1, count: dist?.one ?? 0 },
  ];

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
      {/* Big average */}
      <div className="flex flex-col items-center justify-center text-center sm:w-32 sm:shrink-0">
        <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {avg.toFixed(1)}
        </span>
        <StarDisplay rating={avg} size="md" />
        <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {total} {total === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 space-y-1.5">
        {counts.map(({ label, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isActive = activeFilter === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onFilterRating?.(isActive ? null : label)}
              className={`flex w-full items-center gap-2 rounded text-left text-xs transition-opacity ${
                activeFilter && !isActive ? "opacity-50" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-right text-zinc-500 dark:text-zinc-400">{label}</span>
              <svg viewBox="0 0 20 20" className="h-3 w-3 shrink-0 text-amber-400" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-zinc-500 dark:text-zinc-400">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
