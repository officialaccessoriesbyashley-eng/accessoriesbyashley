import { Skeleton } from "@/components/ui/skeleton";

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
      <Skeleton className="aspect-square w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <div className="px-5 pb-5 space-y-2">
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    </div>
  );
}

export default function ShopCategoryLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-48" />

        {/* Subcategory grid skeleton */}
        <div>
          <Skeleton className="h-6 w-36 mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
