import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { getProductReviewsQuery, PRODUCT_REVIEWS_COUNT_QUERY } from "@/lib/sanity/queries/reviews";
import type { ReviewSortKey } from "@/lib/sanity/queries/reviews";

const VALID_SORTS = new Set<ReviewSortKey>(["createdAt_desc", "helpful", "rating_asc", "rating_desc"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const start = parseInt(searchParams.get("start") ?? "0", 10);
  const end = parseInt(searchParams.get("end") ?? "5", 10);
  const rawSort = searchParams.get("sort") ?? "createdAt_desc";
  const sort: ReviewSortKey = VALID_SORTS.has(rawSort as ReviewSortKey)
    ? (rawSort as ReviewSortKey)
    : "createdAt_desc";

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const [reviews, total] = await Promise.all([
    client.fetch(getProductReviewsQuery(sort), { productId, start, end }),
    client.fetch(PRODUCT_REVIEWS_COUNT_QUERY, { productId }),
  ]);

  return NextResponse.json({ reviews, total });
}
