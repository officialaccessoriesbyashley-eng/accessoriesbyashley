"use client";

import { useState, useTransition } from "react";
import { CheckCircle, ThumbsUp } from "lucide-react";
import { StarDisplay } from "./StarDisplay";
import { markReviewHelpful } from "@/lib/actions/reviews";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function displayName(name: string | null | undefined): string {
  if (!name) return "Customer";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

interface ReviewCardProps {
  review: {
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
  customerId?: string | null;
  isPending?: boolean;
}

export function ReviewCard({ review, customerId, isPending = false }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount ?? 0);
  const [voted, setVoted] = useState(false);
  const [isPending2, startTransition] = useTransition();

  const handleHelpful = () => {
    if (!customerId || voted) return;
    startTransition(async () => {
      const result = await markReviewHelpful(review._id, customerId);
      if (result.success) {
        setHelpfulCount((n) => n + 1);
        setVoted(true);
      }
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {displayName(review.customer?.name)}
            </span>
            {review.isVerifiedPurchase !== false && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                <CheckCircle className="h-3 w-3" />
                Verified Purchase
              </span>
            )}
          </div>
          <StarDisplay rating={review.rating} size="sm" />
        </div>
        <time className="text-xs text-zinc-400 dark:text-zinc-500" dateTime={review.createdAt}>
          {formatDate(review.createdAt)}
        </time>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-1">
        {review.title && (
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{review.title}</p>
        )}
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
          {review.body}
        </p>
      </div>

      {/* Ashley's reply */}
      {review.ownerReply && (
        <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-zinc-50 px-4 py-3 dark:bg-zinc-800">
          <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Reply from Ashley
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
            {review.ownerReply.body}
          </p>
          <time className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500" dateTime={review.ownerReply.repliedAt}>
            {formatDate(review.ownerReply.repliedAt)}
          </time>
        </div>
      )}

      {/* Helpful */}
      {!isPending && (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleHelpful}
            disabled={!customerId || voted || isPending2}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
              voted
                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            <ThumbsUp className="h-3 w-3" />
            Helpful {helpfulCount > 0 && `(${helpfulCount})`}
          </button>
        </div>
      )}
    </div>
  );
}
