import { Suspense } from "react";
import { sanityFetch } from "@/sanity/lib/live";
import { HOMEPAGE_CATEGORY_SECTIONS_QUERY, ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { FEATURED_PRODUCTS_QUERY } from "@/lib/sanity/queries/products";
import type { HOMEPAGE_CATEGORY_SECTIONS_QUERYResult } from "@/sanity.query-types";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { CategorySection } from "@/components/app/CategorySection";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    categorySectionsResult,
    { data: categories },
    { data: featuredProducts },
  ] = await Promise.all([
    sanityFetch({ query: HOMEPAGE_CATEGORY_SECTIONS_QUERY }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
    sanityFetch({ query: FEATURED_PRODUCTS_QUERY }),
  ]);

  const categorySections = (categorySectionsResult.data ?? []) as unknown as HOMEPAGE_CATEGORY_SECTIONS_QUERYResult;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      {/* Category pill nav */}
      <CategoryTiles categories={categories} />

      {/* Category sections — one per category with product row + "View all" */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {categorySections.map((cat) => (
          <CategorySection
            key={cat._id}
            title={cat.title ?? ""}
            icon={cat.icon}
            slug={cat.slug ?? ""}
            products={cat.products ?? []}
          />
        ))}
      </div>
    </div>
  );
}
