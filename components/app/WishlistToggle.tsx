"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsWishlisted, useWishlistActions } from "@/lib/store/wishlist-store-provider";
import type { WishlistItem } from "@/lib/store/wishlist-store";

interface WishlistToggleProps {
  item: WishlistItem;
  className?: string;
}

export function WishlistToggle({ item, className }: WishlistToggleProps) {
  const isWishlisted = useIsWishlisted(item.productId);
  const { toggleItem } = useWishlistActions();

  return (
    <button
      type="button"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(item);
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        isWishlisted
          ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/40"
          : "bg-white/80 text-zinc-500 shadow-sm backdrop-blur-sm hover:bg-white hover:text-rose-500 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:text-rose-400",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
    </button>
  );
}
