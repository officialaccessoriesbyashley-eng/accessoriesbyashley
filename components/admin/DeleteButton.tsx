"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Star, ShoppingCart, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DocumentHandle } from "@sanity/sdk-react";
import {
  getProductDeletePreview,
  deleteProductAndRelated,
  type ProductDeletePreview,
} from "@/lib/actions/products";

interface DeleteButtonProps {
  handle: DocumentHandle;
  redirectTo?: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DeleteButtonContent({ handle, redirectTo = "/admin/inventory" }: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ProductDeletePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const baseId = handle.documentId.replace(/^drafts\./, "");

  const handleOpenModal = async () => {
    setLoading(true);
    setError(null);
    const data = await getProductDeletePreview(baseId);
    setPreview(data);
    setLoading(false);
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      const result = await deleteProductAndRelated(baseId);
      if (result.success) {
        setOpen(false);
        router.push(redirectTo);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={handleOpenModal}
        disabled={loading}
      >
        <Trash2 className="h-4 w-4" />
        {loading ? "Checking…" : "Delete"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete "{preview?.productName ?? "this product"}"?
            </DialogTitle>
          </DialogHeader>

          {preview && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This action is permanent and cannot be undone. The following will also be removed:
              </p>

              {/* Reviews */}
              {preview.reviews.length > 0 ? (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {preview.reviews.length} review{preview.reviews.length !== 1 ? "s" : ""}
                      {preview.helpfulVoteCount > 0 && ` + ${preview.helpfulVoteCount} helpful vote${preview.helpfulVoteCount !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-40 overflow-y-auto">
                    {preview.reviews.map((r) => (
                      <li key={r._id} className="flex items-start gap-3 px-3 py-2">
                        <StarRow rating={r.rating} />
                        <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {r.body.slice(0, 80)}{r.body.length > 80 ? "…" : ""}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-400">{formatDate(r.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <Star className="h-4 w-4" />
                  No reviews to delete
                </div>
              )}

              {/* Orders warning */}
              {preview.orderCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-950/20">
                  <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    This product appears in <strong>{preview.orderCount} order{preview.orderCount !== 1 ? "s" : ""}</strong>.
                    Order history is kept — only the product listing is removed.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Yes, delete everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteButton(props: DeleteButtonProps) {
  return (
    <Suspense fallback={<Skeleton className="h-9 w-20" />}>
      <DeleteButtonContent {...props} />
    </Suspense>
  );
}
