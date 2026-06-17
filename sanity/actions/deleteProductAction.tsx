import { useState, useCallback } from "react";
import { TrashIcon } from "@sanity/icons";
import { useClient } from "sanity";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";

interface DeletePreview {
  reviewCount: number;
  helpfulVoteCount: number;
  orderCount: number;
  reviews: Array<{ _id: string; rating: number; body: string }>;
}

export const DeleteProductAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { id, type, onComplete } = props;
  const client = useClient({ apiVersion: "2024-01-01" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (type !== "product") return null;

  const baseId = id.replace(/^drafts\./, "");

  const onHandle = useCallback(async () => {
    setFetchError(null);
    try {
      const [reviews, orderCount] = await Promise.all([
        client.fetch<Array<{ _id: string; rating: number; body: string }>>(
          `*[_type == "review" && product._ref == $id]{ _id, rating, body }`,
          { id: baseId },
        ),
        client.fetch<number>(`count(*[_type == "order" && references($id)])`, { id: baseId }),
      ]);

      const reviewIds = reviews.map((r) => r._id);
      const helpfulVoteCount: number =
        reviewIds.length > 0
          ? await client.fetch(`count(*[_type == "reviewHelpful" && review._ref in $reviewIds])`, { reviewIds })
          : 0;

      setPreview({ reviewCount: reviews.length, helpfulVoteCount, orderCount: orderCount ?? 0, reviews });
      setDialogOpen(true);
    } catch {
      setFetchError("Could not load related data. Please try again.");
      setDialogOpen(true);
    }
  }, [baseId, client]);

  const onConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      const reviews = await client.fetch<{ _id: string }[]>(
        `*[_type == "review" && product._ref == $id]{ _id }`,
        { id: baseId },
      );
      const reviewIds = reviews.map((r) => r._id);
      const helpfulVotes =
        reviewIds.length > 0
          ? await client.fetch<{ _id: string }[]>(
              `*[_type == "reviewHelpful" && review._ref in $reviewIds]{ _id }`,
              { reviewIds },
            )
          : [];

      let tx = client.transaction();
      for (const v of helpfulVotes) tx = tx.delete(v._id);
      for (const r of reviews) {
        tx = tx.delete(r._id);
        tx = tx.delete(`drafts.${r._id}`);
      }
      tx = tx.delete(baseId);
      tx = tx.delete(`drafts.${baseId}`);

      await tx.commit();
      setDialogOpen(false);
      onComplete();
    } catch {
      setFetchError("Deletion failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [baseId, client, onComplete]);

  const reviewCount = preview?.reviewCount ?? 0;
  const helpfulVoteCount = preview?.helpfulVoteCount ?? 0;
  const orderCount = preview?.orderCount ?? 0;

  const lines: string[] = [];
  if (reviewCount > 0) {
    lines.push(`${reviewCount} review${reviewCount !== 1 ? "s" : ""}${helpfulVoteCount > 0 ? ` + ${helpfulVoteCount} helpful vote${helpfulVoteCount !== 1 ? "s" : ""}` : ""} will be permanently deleted.`);
  }
  if (orderCount > 0) {
    lines.push(`This product appears in ${orderCount} order${orderCount !== 1 ? "s" : ""} — order history is kept, only the product listing is removed.`);
  }
  if (reviewCount === 0 && orderCount === 0) {
    lines.push("No related reviews or orders. Safe to delete.");
  }

  return {
    label: "Delete product…",
    tone: "critical" as const,
    icon: TrashIcon,
    onHandle,
    dialog: dialogOpen
      ? {
          type: "confirm" as const,
          title: "Delete this product?",
          message: fetchError ?? lines.join("\n\n") + "\n\nThis action cannot be undone.",
          onConfirm,
          onCancel: () => {
            setDialogOpen(false);
            setPreview(null);
          },
          confirmButtonIcon: TrashIcon,
          confirmButtonText: deleting ? "Deleting…" : "Delete permanently",
        }
      : undefined,
  };
};
