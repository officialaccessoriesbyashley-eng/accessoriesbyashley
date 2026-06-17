"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquarePlus, Star } from "lucide-react";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewList } from "./ReviewList";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";

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

type ReviewStats = {
  averageRating?: number | null;
  totalReviews?: number | null;
  ratingDistribution?: {
    five?: number | null;
    four?: number | null;
    three?: number | null;
    two?: number | null;
    one?: number | null;
  } | null;
};

type OwnReview = {
  _id: string;
  rating: number;
  title?: string | null;
  body: string;
  status: string;
  createdAt: string;
} | null;

type EligibilityState =
  | "not_logged_in"
  | "not_purchased"
  | "not_delivered"
  | "already_reviewed"
  | "can_review";

interface ReviewSectionClientProps {
  productId: string;
  initialReviews: Review[];
  initialTotal: number;
  stats: ReviewStats;
  eligibility: EligibilityState;
  orderId?: string | null;
  customerId?: string | null;
  ownReview?: OwnReview;
  scrollToForm?: boolean;
}

const PAGE_SIZE = 5;

export function ReviewSectionClient({
  productId,
  initialReviews,
  initialTotal,
  stats,
  eligibility,
  orderId,
  customerId,
  ownReview,
  scrollToForm = false,
}: ReviewSectionClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [sort, setSort] = useState<SortOption>("createdAt_desc");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll to form on mount if ?review=true
  useEffect(() => {
    if (scrollToForm && eligibility === "can_review") {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [scrollToForm, eligibility]);

  const fetchReviews = useCallback(
    async (newSort: SortOption, start = 0, append = false) => {
      const params = new URLSearchParams({
        productId,
        start: String(start),
        end: String(start + PAGE_SIZE),
        sort: newSort,
      });
      const res = await fetch(`/api/reviews/list?${params}`);
      if (!res.ok) return;
      const data: { reviews: Review[]; total: number } = await res.json();
      setTotal(data.total);
      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
    },
    [productId],
  );

  const handleSortChange = async (newSort: SortOption) => {
    setSort(newSort);
    setRatingFilter(null);
    await fetchReviews(newSort, 0, false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchReviews(sort, reviews.length, true);
    setLoadingMore(false);
  };

  const handleFilterRating = (rating: number | null) => {
    setRatingFilter(rating);
  };

  // Client-side rating filter (applied on top of current reviews)
  const filteredReviews = ratingFilter
    ? reviews.filter((r) => r.rating === ratingFilter)
    : reviews;

  return (
    <section ref={sectionRef} className="mt-12 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Reviews &amp; Ratings
      </h2>

      {/* Summary + distribution */}
      {(stats.totalReviews ?? 0) > 0 && (
        <div className="mb-8">
          <ReviewSummary
            stats={stats}
            onFilterRating={handleFilterRating}
            activeFilter={ratingFilter}
          />
        </div>
      )}

      {/* Eligibility / form CTA */}
      {!submitted && (
        <div className="mb-8">
          {eligibility === "can_review" && !showForm && (
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <Star className="h-4 w-4" />
              Write a review
            </button>
          )}
          {eligibility === "can_review" && showForm && (
            <div ref={formRef}>
              <ReviewForm
                productId={productId}
                orderId={orderId!}
                onSubmitted={() => { setSubmitted(true); setShowForm(false); }}
              />
            </div>
          )}
          {eligibility === "not_logged_in" && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              <a href="/sign-in" className="font-medium text-amber-600 underline underline-offset-2 dark:text-amber-400">
                Sign in
              </a>{" "}
              to leave a review.
            </div>
          )}
          {eligibility === "not_purchased" && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              Only customers who have purchased this product can leave a review.
            </div>
          )}
          {eligibility === "not_delivered" && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              You can leave a review once your order has been delivered.
            </div>
          )}
        </div>
      )}

      {/* Submitted thank-you */}
      {submitted && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/30 dark:bg-green-950/10 dark:text-green-400">
          Thank you for your review!
        </div>
      )}

      {/* User's own review (visible to them regardless of approval status) */}
      {eligibility === "already_reviewed" && ownReview && ownReview.status !== "approved" && (
        <div className="mb-8">
          <ReviewCard
            review={{
              _id: ownReview._id,
              rating: ownReview.rating,
              title: ownReview.title,
              body: ownReview.body,
              createdAt: ownReview.createdAt,
              helpfulCount: 0,
              isVerifiedPurchase: true,
            }}
          />
        </div>
      )}

      {/* No reviews yet + reviewer can write */}
      {total === 0 && eligibility !== "can_review" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <MessageSquarePlus className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No reviews yet for this product.</p>
        </div>
      )}

      {/* Review list */}
      {filteredReviews.length > 0 && (
        <ReviewList
          reviews={filteredReviews}
          totalCount={ratingFilter ? filteredReviews.length : total}
          customerId={customerId}
          sort={sort}
          onSortChange={handleSortChange}
          onLoadMore={handleLoadMore}
          isLoading={loadingMore}
        />
      )}

      {/* No results after filtering */}
      {ratingFilter && filteredReviews.length === 0 && total > 0 && (
        <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          No {ratingFilter}-star reviews yet.
        </p>
      )}
    </section>
  );
}
