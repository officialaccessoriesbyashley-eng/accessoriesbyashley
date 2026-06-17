"use server";

import { revalidatePath } from "next/cache";
import { client, writeClient } from "@/sanity/lib/client";

export interface ProductDeletePreview {
  productName: string | null;
  reviews: Array<{ _id: string; rating: number; body: string; createdAt: string }>;
  helpfulVoteCount: number;
  orderCount: number;
}

export async function getProductDeletePreview(productId: string): Promise<ProductDeletePreview> {
  const [product, reviews, orderCount] = await Promise.all([
    client.fetch<{ name: string } | null>(
      `*[_type == "product" && (_id == $id || _id == "drafts." + $id)][0]{ name }`,
      { id: productId },
    ),
    client.fetch<Array<{ _id: string; rating: number; body: string; createdAt: string }>>(
      `*[_type == "review" && product._ref == $id] | order(createdAt desc) { _id, rating, body, createdAt }`,
      { id: productId },
    ),
    client.fetch<number>(
      `count(*[_type == "order" && references($id)])`,
      { id: productId },
    ),
  ]);

  const reviewIds = reviews.map((r) => r._id);
  const helpfulVoteCount: number =
    reviewIds.length > 0
      ? await client.fetch(`count(*[_type == "reviewHelpful" && review._ref in $reviewIds])`, { reviewIds })
      : 0;

  return {
    productName: product?.name ?? null,
    reviews,
    helpfulVoteCount,
    orderCount: orderCount ?? 0,
  };
}

export async function deleteProductAndRelated(
  productId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseId = productId.replace(/^drafts\./, "");

    const [reviews] = await Promise.all([
      client.fetch<{ _id: string }[]>(
        `*[_type == "review" && product._ref == $id]{ _id }`,
        { id: baseId },
      ),
    ]);

    const reviewIds = reviews.map((r) => r._id);

    const helpfulVotes =
      reviewIds.length > 0
        ? await client.fetch<{ _id: string }[]>(
            `*[_type == "reviewHelpful" && review._ref in $reviewIds]{ _id }`,
            { reviewIds },
          )
        : [];

    let tx = writeClient.transaction();

    for (const vote of helpfulVotes) {
      tx = tx.delete(vote._id);
    }
    for (const review of reviews) {
      tx = tx.delete(review._id);
      tx = tx.delete(`drafts.${review._id}`);
    }
    tx = tx.delete(baseId);
    tx = tx.delete(`drafts.${baseId}`);

    await tx.commit({ visibility: "async" });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/reviews");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Product deletion failed:", error);
    return { success: false, error: "Deletion failed. Please try again." };
  }
}
