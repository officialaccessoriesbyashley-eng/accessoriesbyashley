"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trash2,
  AlertTriangle,
  Star,
  ThumbsUp,
  Flag,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import {
  approveReview,
  rejectReview,
  postOwnerReply,
  deleteOwnerReply,
} from "@/lib/actions/reviews";

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminReview {
  _id: string;
  rating: number;
  title?: string | null;
  body: string;
  status: string;
  aiSentiment?: string | null;
  aiSummary?: string | null;
  aiFlagReason?: string | null;
  helpfulCount?: number | null;
  rejectionReason?: string | null;
  ownerReply?: { body: string; repliedAt: string } | null;
  createdAt: string;
  product?: {
    _id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  } | null;
  customer?: {
    _id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  order?: { _id: string; orderNumber: string } | null;
}

interface ReviewStats {
  pending: number;
  flagged: number;
  approved: number;
  rejected: number;
  total: number;
  thisWeek: number;
  avgRating: number;
}

interface ReviewsAdminClientProps {
  stats: ReviewStats;
  pending: AdminReview[];
  approved: AdminReview[];
  rejected: AdminReview[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  negative: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
};

// ── Stat cards ────────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: ReviewStats }) {
  const cards = [
    { label: "Pending", value: stats.pending, icon: Clock, accent: "text-amber-500" },
    { label: "Flagged", value: stats.flagged, icon: Flag, accent: "text-red-500" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, accent: "text-green-500" },
    { label: "Avg Rating", value: stats.avgRating ? stats.avgRating.toFixed(1) : "—", icon: Star, accent: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
            <Icon className={`h-5 w-5 ${accent}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewAdminCard({ review, onRefresh }: { review: AdminReview; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState(review.ownerReply?.body ?? "");

  const isFlagged = review.status === "flagged";
  const isPendingStatus = review.status === "pending" || isFlagged;
  const isApproved = review.status === "approved";

  const handleApprove = () => {
    startTransition(async () => {
      await approveReview(review._id);
      onRefresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectReview(review._id, rejectReason.trim() || undefined);
      setShowRejectForm(false);
      onRefresh();
    });
  };

  const handleReply = () => {
    startTransition(async () => {
      await postOwnerReply(review._id, replyBody);
      setShowReplyForm(false);
      onRefresh();
    });
  };

  const handleDeleteReply = () => {
    startTransition(async () => {
      await deleteOwnerReply(review._id);
      setReplyBody("");
      onRefresh();
    });
  };

  return (
    <div className={`rounded-xl border bg-white p-4 sm:p-5 dark:bg-zinc-900 ${
      isFlagged
        ? "border-red-200 dark:border-red-900/40"
        : "border-zinc-200 dark:border-zinc-800"
    } ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        {/* Product thumbnail */}
        <div className="shrink-0">
          {review.product?.imageUrl ? (
            <Image
              src={review.product.imageUrl}
              alt={review.product.name ?? ""}
              width={60}
              height={60}
              className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-16 sm:w-16" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-0.5">
              {review.product && (
                <Link
                  href={`/admin/inventory/${review.product._id}`}
                  className="truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {review.product.name}
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{review.customer?.name ?? "Unknown"}</span>
                {review.customer?.email && <span>·</span>}
                {review.customer?.email && <span>{review.customer.email}</span>}
                {review.order && (
                  <>
                    <span>·</span>
                    <span>Order #{review.order.orderNumber}</span>
                  </>
                )}
              </div>
            </div>
            <time className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
              {formatDate(review.createdAt)}
            </time>
          </div>

          {/* Rating + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StarDisplay rating={review.rating} size="sm" />
            {review.aiSentiment && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SENTIMENT_STYLES[review.aiSentiment] ?? SENTIMENT_STYLES.neutral}`}>
                {review.aiSentiment}
              </span>
            )}
            {isFlagged && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Flagged
              </span>
            )}
            {isApproved && (review.helpfulCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <ThumbsUp className="h-3 w-3" />
                {review.helpfulCount} helpful
              </span>
            )}
          </div>

          {/* AI summary */}
          {review.aiSummary && (
            <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs italic text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              AI: {review.aiSummary}
            </p>
          )}

          {/* Flag reason */}
          {review.aiFlagReason && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
              Flag reason: {review.aiFlagReason}
            </p>
          )}

          {/* Review body */}
          <div className="space-y-1">
            {review.title && (
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{review.title}</p>
            )}
            <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{review.body}</p>
          </div>

          {/* Rejection reason */}
          {review.status === "rejected" && review.rejectionReason && (
            <p className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Rejection reason: {review.rejectionReason}
            </p>
          )}

          {/* Owner reply (approved only) */}
          {isApproved && review.ownerReply && !showReplyForm && (
            <div className="rounded-lg border-l-4 border-amber-400 bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Reply from Ashley</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setReplyBody(review.ownerReply!.body); setShowReplyForm(true); }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteReply}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">{review.ownerReply.body}</p>
            </div>
          )}

          {/* Reply form */}
          {isApproved && showReplyForm && (
            <div className="space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value.slice(0, 500))}
                placeholder="Write a reply from Ashley…"
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={!replyBody.trim()}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Save reply
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReplyForm(false); setReplyBody(review.ownerReply?.body ?? ""); }}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {isPendingStatus && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                {!showRejectForm ? (
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                ) : (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason (optional)"
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleReject}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {isApproved && !showReplyForm && !review.ownerReply && (
              <button
                type="button"
                onClick={() => setShowReplyForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyReviews({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Star className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm text-zinc-400 dark:text-zinc-500">{message}</p>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export function ReviewsAdminClient({
  stats,
  pending,
  approved,
  rejected,
}: ReviewsAdminClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState("pending");

  const refresh = () => router.refresh();

  const flaggedCount = pending.filter((r) => r.status === "flagged").length;
  const queueCount = pending.length;

  const tabReviews: Record<string, AdminReview[]> = {
    pending,
    approved,
    rejected,
    all: [...pending, ...approved, ...rejected].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };

  const emptyMessages: Record<string, string> = {
    pending: "No reviews awaiting approval.",
    approved: "No approved reviews yet.",
    rejected: "No rejected reviews.",
    all: "No reviews yet.",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Moderate customer reviews and reply to feedback
        </p>
      </div>

      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-max">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Queue
              {queueCount > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  flaggedCount > 0
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {queueCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs sm:text-sm">
              Approved
              {stats.approved > 0 && (
                <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {stats.approved}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">Rejected</TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {tabReviews[tab].length === 0 ? (
          <EmptyReviews message={emptyMessages[tab]} />
        ) : (
          tabReviews[tab].map((review) => (
            <ReviewAdminCard key={review._id} review={review} onRefresh={refresh} />
          ))
        )}
      </div>
    </div>
  );
}
