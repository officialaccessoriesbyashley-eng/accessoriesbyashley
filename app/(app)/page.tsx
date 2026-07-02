import { Suspense } from "react";
import { sanityFetch } from "@/sanity/lib/live";
import { ALL_CATEGORIES_QUERY, CATEGORY_WITH_SUBCATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { FEATURED_PRODUCTS_QUERY, SUBCATEGORY_FILTER_PRODUCTS_BY_NAME_QUERY } from "@/lib/sanity/queries/products";
import { CategoryGrid } from "@/components/app/CategoryGrid";
import { SubcategoryGrid } from "@/components/app/SubcategoryGrid";
import { ProductGrid } from "@/components/app/ProductGrid";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/app/FeaturedCarouselSkeleton";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.query-types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ cat?: string; sub?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const selectedCat = sp.cat ?? "";
  const selectedSub = sp.sub ?? "";

  // Fetch all data in parallel — avoids sequential round trips to Sanity
  const [
    { data: categories },
    { data: featuredProducts },
    categoryResult,
    productsResult,
  ] = await Promise.all([
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
    sanityFetch({ query: FEATURED_PRODUCTS_QUERY }),
    selectedCat
      ? sanityFetch({ query: CATEGORY_WITH_SUBCATEGORIES_QUERY, params: { slug: selectedCat } })
      : Promise.resolve({ data: null }),
    selectedCat && selectedSub
      ? sanityFetch({
          query: SUBCATEGORY_FILTER_PRODUCTS_BY_NAME_QUERY,
          params: { subcategorySlug: selectedSub, searchQuery: "", color: "", material: "", minPrice: 0, maxPrice: 0, inStock: false },
        })
      : Promise.resolve({ data: [] }),
  ]);

  const categoryData = categoryResult.data;
  const typedCategory = categoryData as { title?: string | null; icon?: string | null; subcategories?: { _id: string; title: string | null; slug: string | null; image?: { asset?: { _id: string; url: string | null } | null } | null }[] } | null;
  const subcategories = typedCategory?.subcategories ?? [];
  const activeCatTitle = typedCategory?.title ?? selectedCat;
  const activeCatIcon = typedCategory?.icon ?? null;
  const activeSubTitle = selectedSub ? (subcategories.find((s) => s.slug === selectedSub)?.title ?? selectedSub) : null;

  const products = productsResult.data ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      {/* Section label */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Shop by Category
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Stunning jewellery &amp; accessories for every occasion
        </p>
      </div>

      {/* Category grid — stays on this page, active card highlighted */}
      <CategoryGrid categories={categories} activeCat={selectedCat || undefined} inPage anchor="subcategories" />

      {/* Subcategory grid — appears below when a category is selected */}
      {selectedCat && subcategories.length > 0 && (
        <>
          <div id="subcategories" className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div className="pt-6">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                {activeCatIcon && <span className="mr-2">{activeCatIcon}</span>}
                {activeCatTitle}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose a subcategory</p>
            </div>
          </div>
          <SubcategoryGrid
            subcategories={subcategories}
            categorySlug={selectedCat}
            activeSub={selectedSub || undefined}
            baseHref={`/?cat=${selectedCat}`}
            anchor="products"
          />
        </>
      )}

      {/* Products — appear below when a subcategory is selected */}
      {selectedCat && selectedSub && (
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div id="products" className="scroll-mt-20 mb-6 h-px bg-zinc-100 dark:bg-zinc-800" />
          <h2 className="mb-6 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {activeSubTitle}
          </h2>
          <ProductGrid products={products as FILTER_PRODUCTS_BY_NAME_QUERYResult} />
        </div>
      )}
    </div>
  );
}
