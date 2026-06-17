"use server";

import { revalidatePath } from "next/cache";
import { client, writeClient } from "@/sanity/lib/client";
import {
  DELIVERED_ORDER_WITH_PRODUCT_QUERY,
  EXISTING_REVIEW_QUERY,
  HELPFUL_VOTE_QUERY,
} from "@/lib/sanity/queries/reviews";

// ── Purchase eligibility ──────────────────────────────────────────────────────

export type CanReviewResult =
  | { canReview: true; orderId: string }
  | { canReview: false; reason: "not_logged_in" | "not_purchased" | "not_delivered" | "already_reviewed" };

export async function canReviewProduct(
  customerId: string | null | undefined,
  productId: string,
  userId?: string | null,
): Promise<CanReviewResult> {
  if (!customerId && !userId) return { canReview: false, reason: "not_logged_in" };

  const safeCustomerId = customerId ?? "";
  const safeUserId = userId ?? "";

  const [deliveredOrder, existingReview] = await Promise.all([
    client.fetch(DELIVERED_ORDER_WITH_PRODUCT_QUERY, {
      customerId: safeCustomerId,
      userId: safeUserId,
      productId,
    }),
    customerId
      ? client.fetch(EXISTING_REVIEW_QUERY, { customerId, productId })
      : Promise.resolve(null),
  ]);

  if (!deliveredOrder) {
    const anyOrder = await client.fetch(
      `*[_type == "order" && (customer._ref == $customerId || userId == $userId) && $productId in items[].product._ref][0]{ _id }`,
      { customerId: safeCustomerId, userId: safeUserId, productId },
    );
    return { canReview: false, reason: anyOrder ? "not_delivered" : "not_purchased" };
  }

  if (existingReview) {
    return { canReview: false, reason: "already_reviewed" };
  }

  return { canReview: true, orderId: deliveredOrder._id as string };
}

// ── Review stats ──────────────────────────────────────────────────────────────

export async function updateProductReviewStats(productId: string): Promise<void> {
  const reviews = await client.fetch<{ rating: number }[]>(
    `*[_type == "review" && product._ref == $productId && status == "approved"] { rating }`,
    { productId },
  );

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  const dist = { five: 0, four: 0, three: 0, two: 0, one: 0 };
  for (const r of reviews) {
    if (r.rating === 5) dist.five++;
    else if (r.rating === 4) dist.four++;
    else if (r.rating === 3) dist.three++;
    else if (r.rating === 2) dist.two++;
    else if (r.rating === 1) dist.one++;
  }

  await writeClient.patch(productId).set({
    "reviewStats.averageRating": averageRating,
    "reviewStats.totalReviews": totalReviews,
    "reviewStats.ratingDistribution": dist,
    "reviewStats.lastReviewedAt": totalReviews > 0 ? new Date().toISOString() : null,
  }).commit();
}

// ── Admin actions ─────────────────────────────────────────────────────────────

export async function approveReview(reviewId: string): Promise<{ success: boolean }> {
  const review = await client.fetch<{ product?: { _ref: string } } | null>(
    `*[_type == "review" && _id == $reviewId][0]{ product }`,
    { reviewId },
  );
  if (!review?.product?._ref) return { success: false };

  await writeClient.patch(reviewId).set({
    status: "approved",
    updatedAt: new Date().toISOString(),
  }).commit();

  await updateProductReviewStats(review.product._ref);

  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products`);
  return { success: true };
}

export async function rejectReview(
  reviewId: string,
  reason?: string,
): Promise<{ success: boolean }> {
  const review = await client.fetch<{ product?: { _ref: string }; status?: string } | null>(
    `*[_type == "review" && _id == $reviewId][0]{ product, status }`,
    { reviewId },
  );
  if (!review?.product?._ref) return { success: false };

  const wasApproved = review.status === "approved";

  await writeClient.patch(reviewId).set({
    status: "rejected",
    rejectionReason: reason ?? null,
    updatedAt: new Date().toISOString(),
  }).commit();

  if (wasApproved) {
    await updateProductReviewStats(review.product._ref);
  }

  revalidatePath(`/admin/reviews`);
  return { success: true };
}

export async function postOwnerReply(
  reviewId: string,
  body: string,
): Promise<{ success: boolean }> {
  await writeClient.patch(reviewId).set({
    ownerReply: {
      body: body.trim(),
      repliedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  }).commit();

  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products`);
  return { success: true };
}

export async function deleteOwnerReply(reviewId: string): Promise<{ success: boolean }> {
  await writeClient.patch(reviewId).unset(["ownerReply"]).commit();
  revalidatePath(`/admin/reviews`);
  revalidatePath(`/products`);
  return { success: true };
}

export async function markReviewHelpful(
  reviewId: string,
  customerId: string,
): Promise<{ success: boolean; alreadyVoted?: boolean }> {
  const existing = await client.fetch(HELPFUL_VOTE_QUERY, { reviewId, customerId });
  if (existing) return { success: false, alreadyVoted: true };

  await writeClient.create({
    _type: "reviewHelpful",
    review: { _type: "reference", _ref: reviewId },
    customer: { _type: "reference", _ref: customerId },
    createdAt: new Date().toISOString(),
  });

  // Increment helpful count on the review
  await writeClient.patch(reviewId).inc({ helpfulCount: 1 }).commit();

  return { success: true };
}

export async function markReviewRequestSent(orderId: string): Promise<{ success: boolean }> {
  await writeClient.patch(orderId).set({
    reviewRequestSent: true,
    reviewRequestSentAt: new Date().toISOString(),
  }).commit();

  revalidatePath(`/admin/orders`);
  return { success: true };
}
