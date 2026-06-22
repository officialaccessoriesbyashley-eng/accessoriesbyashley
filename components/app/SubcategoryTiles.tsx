"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubcategoryTileItem {
  _id: string;
  title: string | null;
  slug: string | null;
  image?: { asset?: { _id: string; url: string | null } | null } | null;
}

interface SubcategoryTilesProps {
  subcategories: SubcategoryTileItem[];
  categorySlug: string;
  activeSub?: string;
}

export function SubcategoryTiles({ subcategories, categorySlug, activeSub }: SubcategoryTilesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -240 : 240, behavior: "smooth" });
  };

  if (subcategories.length === 0) return null;

  const allItems = [
    { _id: "__all__", title: "All", slug: null as string | null },
    ...subcategories,
  ];

  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-1 overflow-x-auto scroll-smooth py-2.5 scrollbar-hide"
          >
            {allItems.map((sub) => {
              const isAll = sub._id === "__all__";
              const isActive = isAll ? !activeSub : activeSub === sub.slug;
              const href = isAll
                ? `/shop/${categorySlug}`
                : isActive
                  ? `/shop/${categorySlug}`
                  : `/shop/${categorySlug}?sub=${sub.slug}`;

              return (
                <Link
                  key={sub._id}
                  href={href}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-full transition-all duration-200",
                    isActive
                      ? "bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white shadow-md ring-1 ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-200"
                      : "px-3.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  )}
                >
                  {sub.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
