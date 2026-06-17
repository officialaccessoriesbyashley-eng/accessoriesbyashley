import { defineQuery } from "next-sanity";

// ── Product page ──────────────────────────────────────────────────────────────

type ReviewSortKey = "createdAt_desc" | "helpful" | "rating_asc" | "rating_desc";

const SORT_CLAUSE: Record<ReviewSortKey, string> = {
  createdAt_desc: "createdAt desc",
  helpful: "helpfulCount desc",
  rating_asc: "rating asc",
  rating_desc: "rating desc",
};

const REVIEW_PROJECTION = `{
  _id,
  rating,
  title,
  body,
  createdAt,
  helpfulCount,
  isVerifiedPurchase,
  ownerReply { body, repliedAt },
  customer->{ name }
}`;

/** Approved reviews for a product, paginated — sort must be injected at call site */
export function getProductReviewsQuery(sort: ReviewSortKey = "createdAt_desc"): string {
  return `*[
  _type == "review"
  && product._ref == $productId
  && status == "approved"
] | order(${SORT_CLAUSE[sort]}) [$start...$end] ${REVIEW_PROJECTION}`;
}

export type { ReviewSortKey };

/** Count of approved reviews for a product (for pagination) */
export const PRODUCT_REVIEWS_COUNT_QUERY = defineQuery(`count(*[
  _type == "review"
  && product._ref == $productId
  && status == "approved"
])`);

/** Current user's own review for a product (including pending — for showing back to reviewer) */
export const MY_REVIEW_QUERY = defineQuery(`*[
  _type == "review"
  && product._ref == $productId
  && customer._ref == $customerId
  && status != "rejected"
][0] {
  _id,
  rating,
  title,
  body,
  status,
  createdAt
}`);

/** reviewStats + latest reviews for JSON-LD structured data */
export const PRODUCT_REVIEW_STATS_QUERY = defineQuery(`*[
  _type == "product"
  && _id == $productId
][0] {
  reviewStats {
    averageRating,
    totalReviews,
    ratingDistribution { five, four, three, two, one },
    lastReviewedAt
  }
}`);

/** Up to 10 most recent approved reviews for JSON-LD */
export const PRODUCT_REVIEWS_FOR_JSONLD_QUERY = defineQuery(`*[
  _type == "review"
  && product._ref == $productId
  && status == "approved"
] | order(createdAt desc) [0...10] {
  _id,
  rating,
  title,
  body,
  createdAt,
  customer->{ name }
}`);

// ── Purchase eligibility ──────────────────────────────────────────────────────

/** Check if customer has a delivered order containing this product.
 *  Matches by customer._ref OR userId fallback (for orders without a customer ref).
 *  Accepts deliveryStatus "delivered"/"collected" OR payment status "delivered". */
export const DELIVERED_ORDER_WITH_PRODUCT_QUERY = defineQuery(`*[
  _type == "order"
  && (customer._ref == $customerId || userId == $userId)
  && (deliveryStatus in ["delivered", "collected"] || status == "delivered")
  && $productId in items[].product._ref
][0] {
  _id,
  orderNumber
}`);

/** Check if customer has already reviewed this product (non-rejected) */
export const EXISTING_REVIEW_QUERY = defineQuery(`*[
  _type == "review"
  && customer._ref == $customerId
  && product._ref == $productId
  && status != "rejected"
][0] { _id, status }`);

/** Check if customer has voted helpful on a review */
export const HELPFUL_VOTE_QUERY = defineQuery(`*[
  _type == "reviewHelpful"
  && customer._ref == $customerId
  && review._ref == $reviewId
][0] { _id }`);

// ── Admin ─────────────────────────────────────────────────────────────────────

/** All pending + flagged reviews (flagged pinned first) */
export const ADMIN_PENDING_REVIEWS_QUERY = defineQuery(`*[
  _type == "review"
  && status in ["pending", "flagged"]
] | order(
  select(status == "flagged" => 0, 1) asc,
  createdAt desc
) {
  _id,
  rating,
  title,
  body,
  status,
  aiSentiment,
  aiSummary,
  aiFlagReason,
  createdAt,
  product->{ _id, name, "slug": slug.current, "imageUrl": images[0].asset->url },
  customer->{ _id, name, email, phone },
  order->{ _id, orderNumber }
}`);

/** Approved reviews for admin */
export const ADMIN_APPROVED_REVIEWS_QUERY = defineQuery(`*[
  _type == "review"
  && status == "approved"
] | order(createdAt desc) {
  _id,
  rating,
  title,
  body,
  status,
  aiSentiment,
  helpfulCount,
  ownerReply { body, repliedAt },
  createdAt,
  product->{ _id, name, "slug": slug.current, "imageUrl": images[0].asset->url },
  customer->{ _id, name, email }
}`);

/** Rejected reviews for admin */
export const ADMIN_REJECTED_REVIEWS_QUERY = defineQuery(`*[
  _type == "review"
  && status == "rejected"
] | order(createdAt desc) {
  _id,
  rating,
  title,
  body,
  rejectionReason,
  createdAt,
  product->{ _id, name, "imageUrl": images[0].asset->url },
  customer->{ _id, name, email }
}`);

/** Admin review stats */
export const ADMIN_REVIEW_STATS_QUERY = defineQuery(`{
  "pending": count(*[_type == "review" && status == "pending"]),
  "flagged": count(*[_type == "review" && status == "flagged"]),
  "approved": count(*[_type == "review" && status == "approved"]),
  "rejected": count(*[_type == "review" && status == "rejected"]),
  "total": count(*[_type == "review"]),
  "thisWeek": count(*[_type == "review" && dateTime(createdAt) > dateTime(now()) - 60*60*24*7]),
  "approvedRatings": *[_type == "review" && status == "approved"].rating
}`);
