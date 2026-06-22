import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.query-types";

interface CategoryGridProps {
  categories: ALL_CATEGORIES_QUERYResult;
  activeCat?: string;
  /** When true, clicking always stays on the same page via /?cat= instead of navigating to /shop/[slug] */
  inPage?: boolean;
}

export function CategoryGrid({ categories, activeCat, inPage = false }: CategoryGridProps) {
  if (categories.length === 0) return null;

  const hasActive = !!activeCat;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {categories.map((category) => {
          const imageUrl = category.image?.asset?.url;
          const isActive = activeCat === category.slug;
          const href = inPage
            ? isActive ? "/" : `/?cat=${category.slug}`
            : `/shop/${category.slug}`;

          return (
            <Link
              key={category._id}
              href={href}
              className={cn(
                "group block transition-opacity duration-200",
                hasActive && !isActive && "opacity-40",
              )}
            >
              {/* Square image */}
              <div
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 transition-all duration-200 dark:bg-zinc-800",
                  isActive
                    ? "ring-4 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-950"
                    : "group-hover:ring-2 group-hover:ring-zinc-400 group-hover:ring-offset-1",
                )}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={category.title ?? "Category"}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-500 ease-out",
                      isActive ? "scale-105" : "group-hover:scale-105",
                    )}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    {category.icon ?? "🛍️"}
                  </div>
                )}

                {/* Active checkmark badge */}
                {isActive && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100">
                    <svg className="h-3.5 w-3.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label below */}
              <div className="mt-3 px-1">
                <p
                  className={cn(
                    "text-sm font-semibold transition-colors sm:text-base",
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300",
                  )}
                >
                  {category.icon && (
                    <span className="mr-1.5">{category.icon}</span>
                  )}
                  {category.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
