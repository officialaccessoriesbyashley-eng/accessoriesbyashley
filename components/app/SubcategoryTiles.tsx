"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
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

export function SubcategoryTiles({
  subcategories,
  categorySlug,
  activeSub,
}: SubcategoryTilesProps) {
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
    el.scrollBy({ left: direction === "left" ? -(el.clientWidth * 0.7) : el.clientWidth * 0.7, behavior: "smooth" });
  };

  const allItems = [
    { _id: "__all__", title: "All", slug: "" as string | null, image: null },
    ...subcategories,
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute top-1/2 left-0 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-zinc-200 backdrop-blur transition-colors hover:bg-white dark:bg-zinc-800/90 dark:ring-zinc-700 dark:hover:bg-zinc-800 sm:left-1"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute top-1/2 right-0 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg ring-1 ring-zinc-200 backdrop-blur transition-colors hover:bg-white dark:bg-zinc-800/90 dark:ring-zinc-700 dark:hover:bg-zinc-800 sm:right-1"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
        </button>
      )}

      {/* Edge fades */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-gradient-to-r from-white to-transparent dark:from-zinc-950 sm:left-2" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-gradient-to-l from-white to-transparent dark:from-zinc-950 sm:right-2" />
      )}

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide"
      >
        {allItems.map((sub) => {
          const isAll = sub._id === "__all__";
          const isActive = isAll ? !activeSub : activeSub === sub.slug;
          const imageUrl = (sub as SubcategoryTileItem).image?.asset?.url;
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
                "group relative w-36 flex-shrink-0 overflow-hidden rounded-2xl transition-all duration-300 sm:w-48 md:w-52",
                isActive
                  ? "ring-2 ring-amber-500 shadow-lg shadow-amber-500/10"
                  : "ring-1 ring-zinc-200 hover:ring-zinc-300 hover:shadow-md dark:ring-zinc-800 dark:hover:ring-zinc-700",
              )}
            >
              <div className="relative aspect-[4/3]">
                {/* Background */}
                {isAll ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800" />
                ) : imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={sub.title ?? "Subcategory"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 208px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700" />
                )}

                {/* Icon for "All" tile */}
                {isAll && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LayoutGrid className="h-8 w-8 text-white/50 transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <span className="text-sm font-semibold text-white drop-shadow-md sm:text-base">
                    {sub.title}
                  </span>
                </div>

                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white/80" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
