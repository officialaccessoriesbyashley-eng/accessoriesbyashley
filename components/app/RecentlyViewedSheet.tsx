"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  useRecentlyViewedItems,
  useHistoryIsOpen,
  useRecentlyViewedActions,
} from "@/lib/store/recently-viewed-store-provider";

export function RecentlyViewedSheet() {
  const items = useRecentlyViewedItems();
  const isOpen = useHistoryIsOpen();
  const { closeHistory, clearHistory } = useRecentlyViewedActions();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeHistory()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4" />
              Recently Viewed
            </SheetTitle>
            {items.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <Clock className="h-12 w-12 text-zinc-200 dark:text-zinc-700" />
            <p className="text-sm font-medium text-zinc-500">No browsing history yet</p>
            <p className="text-xs text-zinc-400">Products you view will appear here</p>
            <Button variant="outline" size="sm" onClick={closeHistory} asChild>
              <Link href="/">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {items.map((item) => (
                <Link
                  key={item.productId}
                  href={`/products/${item.slug}`}
                  onClick={closeHistory}
                  className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <p className="line-clamp-2 text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </p>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
