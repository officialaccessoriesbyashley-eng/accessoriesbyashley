"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StarInput } from "./StarInput";

interface ReviewFormProps {
  productId: string;
  orderId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productId, orderId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center dark:border-green-900/30 dark:bg-green-950/10">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Thank you for your review!</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Your review has been posted.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Write a review</h3>

      {/* Star rating */}
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Your rating</p>
        <StarInput value={rating} onChange={setRating} />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Title <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          placeholder="Summarise your experience"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Body */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor="review-body" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Your review
          </label>
          <span className={`text-xs tabular-nums ${body.length > 900 ? "text-amber-500" : "text-zinc-400"}`}>
            {body.length}/1000
          </span>
        </div>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          placeholder="What did you think of this product?"
          rows={4}
          className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-amber-400"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
