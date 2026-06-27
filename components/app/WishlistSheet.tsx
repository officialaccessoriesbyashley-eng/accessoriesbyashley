"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  useWishlistItems,
  useWishlistIsOpen,
  useWishlistActions,
} from "@/lib/store/wishlist-store-provider";
import { AddToCartButton } from "@/components/app/AddToCartButton";

export function WishlistSheet() {
  const items = useWishlistItems();
  const isOpen = useWishlistIsOpen();
  const { closeWishlist, removeItem } = useWishlistActions();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeWishlist()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Heart className="h-4 w-4 text-rose-500" />
            Wishlist {items.length > 0 && <span className="text-zinc-400">({items.length})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <Heart className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
            <p className="text-sm font-medium text-zinc-500">Your wishlist is empty</p>
            <p className="text-xs text-zinc-400">Tap the heart on any product to save it here</p>
            <Button variant="outline" size="sm" onClick={closeWishlist} asChild>
              <Link href="/">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <Link href={`/products/${item.slug}`} onClick={closeWishlist} className="shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeWishlist}
                        className="text-sm font-medium leading-tight text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        aria-label="Remove from wishlist"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(item.price)}
                    </p>
                    <AddToCartButton
                      productId={item.productId}
                      name={item.name}
                      price={item.price}
                      image={item.image}
                      stock={99}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
