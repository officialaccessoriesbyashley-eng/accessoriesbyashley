import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import {
  getProductReviewsQuery,
  PRODUCT_REVIEWS_COUNT_QUERY,
  PRODUCT_REVIEW_STATS_QUERY,
  MY_REVIEW_QUERY,
} from "@/lib/sanity/queries/reviews";
import { canReviewProduct } from "@/lib/actions/reviews";
import { ReviewSectionClient } from "./ReviewSectionClient";

interface ReviewSectionProps {
  productId: string;
  scrollToForm?: boolean;
}

export async function ReviewSection({ productId, scrollToForm = false }: ReviewSectionProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? session?.user?.email;

  // Fetch customer document for this user
  const customer = userId
    ? await client.fetch<{ _id: string } | null>(
        `*[_type == "customer" && userId == $userId][0]{ _id }`,
        { userId },
      )
    : null;

  const customerId = customer?._id ?? null;

  // Parallel: initial reviews, total, stats, eligibility, own review
  const [initialReviews, total, statsDoc, eligibility, ownReview] = await Promise.all([
    client.fetch(getProductReviewsQuery("createdAt_desc"), {
      productId,
      start: 0,
      end: 5,
    }),
    client.fetch(PRODUCT_REVIEWS_COUNT_QUERY, { productId }),
    client.fetch(PRODUCT_REVIEW_STATS_QUERY, { productId }),
    canReviewProduct(customerId, productId, userId),
    customerId
      ? client.fetch(MY_REVIEW_QUERY, { productId, customerId })
      : Promise.resolve(null),
  ]);

  const stats = statsDoc?.reviewStats ?? {};

  let eligibilityState: "not_logged_in" | "not_purchased" | "not_delivered" | "already_reviewed" | "can_review";
  let orderId: string | null = null;

  if (!eligibility.canReview) {
    eligibilityState = eligibility.reason === "not_logged_in"
      ? "not_logged_in"
      : eligibility.reason === "not_purchased"
        ? "not_purchased"
        : eligibility.reason === "not_delivered"
          ? "not_delivered"
          : "already_reviewed";
  } else {
    eligibilityState = "can_review";
    orderId = eligibility.orderId;
  }

  return (
    <ReviewSectionClient
      productId={productId}
      initialReviews={initialReviews ?? []}
      initialTotal={total ?? 0}
      stats={stats}
      eligibility={eligibilityState}
      orderId={orderId}
      customerId={customerId}
      ownReview={ownReview}
      scrollToForm={scrollToForm}
    />
  );
}
