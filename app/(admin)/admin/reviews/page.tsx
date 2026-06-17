import { client } from "@/sanity/lib/client";
import {
  ADMIN_PENDING_REVIEWS_QUERY,
  ADMIN_APPROVED_REVIEWS_QUERY,
  ADMIN_REJECTED_REVIEWS_QUERY,
  ADMIN_REVIEW_STATS_QUERY,
} from "@/lib/sanity/queries/reviews";
import { ReviewsAdminClient } from "./ReviewsAdminClient";

export const dynamic = "force-dynamic";

export default async function ReviewsAdminPage() {
  const [rawStats, pending, approved, rejected] = await Promise.all([
    client.fetch(ADMIN_REVIEW_STATS_QUERY),
    client.fetch(ADMIN_PENDING_REVIEWS_QUERY),
    client.fetch(ADMIN_APPROVED_REVIEWS_QUERY),
    client.fetch(ADMIN_REJECTED_REVIEWS_QUERY),
  ]);

  const ratings: number[] = rawStats?.approvedRatings ?? [];
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length) * 10) / 10
    : 0;

  const stats = {
    pending: rawStats?.pending ?? 0,
    flagged: rawStats?.flagged ?? 0,
    approved: rawStats?.approved ?? 0,
    rejected: rawStats?.rejected ?? 0,
    total: rawStats?.total ?? 0,
    thisWeek: rawStats?.thisWeek ?? 0,
    avgRating,
  };

  return (
    <ReviewsAdminClient
      stats={stats}
      pending={pending ?? []}
      approved={approved ?? []}
      rejected={rejected ?? []}
    />
  );
}
