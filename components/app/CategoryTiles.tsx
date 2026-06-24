"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.query-types";

interface CategoryTilesProps {
  categories: ALL_CATEGORIES_QUERYResult;
  activeCategory?: string;
}

export function CategoryTiles({ categories, activeCategory }: CategoryTilesProps) {
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

  const allItems = [
    { _id: "__all__", title: "All", slug: "", icon: null },
    ...categories,
  ];

  return (
    <div className="relative border-b border-zinc-100 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute left-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-1 overflow-x-auto scroll-smooth py-3 scrollbar-hide"
          >
            {allItems.map((cat) => {
              const isAll = cat._id === "__all__";
              const isActive = isAll ? !activeCategory : activeCategory === cat.slug;

              return (
                <Link
                  key={cat._id}
                  href={isAll ? "/" : `/shop/${cat.slug}`}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  )}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
