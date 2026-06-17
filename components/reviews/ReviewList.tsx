"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ReviewCard } from "./ReviewCard";

type SortOption = "createdAt_desc" | "helpful" | "rating_asc" | "rating_desc";

type Review = {
  _id: string;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string;
  helpfulCount?: number | null;
  isVerifiedPurchase?: boolean | null;
  ownerReply?: { body: string; repliedAt: string } | null;
  customer?: { name?: string | null } | null;
};

interface ReviewListProps {
  reviews: Review[];
  totalCount: number;
  customerId?: string | null;
  onSortChange: (sort: SortOption) => void;
  onLoadMore: () => void;
  isLoading?: boolean;
  sort: SortOption;
}

const SORT_LABELS: Record<SortOption, string> = {
  createdAt_desc: "Most recent",
  helpful: "Most helpful",
  rating_desc: "Highest rated",
  rating_asc: "Lowest rated",
};

export function ReviewList({
  reviews,
  totalCount,
  customerId,
  onSortChange,
  onLoadMore,
  isLoading = false,
  sort,
}: ReviewListProps) {
  const [open, setOpen] = useState(false);

  if (totalCount === 0) return null;

  const hasMore = reviews.length < totalCount;

  return (
    <div>
      {/* Sort bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {totalCount} {totalCount === 1 ? "review" : "reviews"}
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {SORT_LABELS[sort]}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-800">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onSortChange(opt); setOpen(false); }}
                  className={`block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                    sort === opt
                      ? "font-semibold text-amber-600 dark:text-amber-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} customerId={customerId} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="rounded-lg border border-zinc-200 bg-white px-5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {isLoading ? "Loading…" : `Show more reviews (${totalCount - reviews.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
