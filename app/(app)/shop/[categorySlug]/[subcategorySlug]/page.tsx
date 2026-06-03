import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import {
  SUBCATEGORY_FILTER_PRODUCTS_BY_NAME_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
} from "@/lib/sanity/queries/products";
import {
  CATEGORY_WITH_SUBCATEGORIES_QUERY,
  SUBCATEGORY_WITH_PARENT_QUERY,
  ALL_CATEGORIES_QUERY,
} from "@/lib/sanity/queries/categories";
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<{
    q?: string;
    color?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ShopSubcategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug, subcategorySlug } = await params;
  const sp = await searchParams;

  const searchQuery = sp.q ?? "";
  const color = sp.color ?? "";
  const material = sp.material ?? "";
  const minPrice = Number(sp.minPrice) || 0;
  const maxPrice = Number(sp.maxPrice) || 0;
  const sort = sp.sort ?? "name";
  const inStock = sp.inStock === "true";

  const filterParams = {
    subcategorySlug,
    searchQuery,
    color,
    material,
    minPrice,
    maxPrice,
    inStock,
  };

  const getQuery = () => {
    if (searchQuery && sort === "relevance") return SUBCATEGORY_FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
    switch (sort) {
      case "price_asc": return SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
      case "price_desc": return SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
      case "relevance": return SUBCATEGORY_FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      default: return SUBCATEGORY_FILTER_PRODUCTS_BY_NAME_QUERY;
    }
  };

  const [
    { data: products },
    { data: subcategory },
    { data: category },
    { data: allCategories },
  ] = await Promise.all([
    sanityFetch({ query: getQuery(), params: filterParams }),
    sanityFetch({ query: SUBCATEGORY_WITH_PARENT_QUERY, params: { subcategorySlug } }),
    sanityFetch({ query: CATEGORY_WITH_SUBCATEGORIES_QUERY, params: { slug: categorySlug } }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
  ]);

  if (!subcategory) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Page banner */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/shop/${categorySlug}`}
              className="hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {subcategory.parentCategory?.icon && (
                <span className="mr-1">{subcategory.parentCategory.icon}</span>
              )}
              {subcategory.parentCategory?.title ?? categorySlug}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-zinc-800 dark:text-zinc-100">
              {subcategory.title}
            </span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {subcategory.title}
          </h1>
          {subcategory.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {subcategory.description}
            </p>
          )}
        </div>

        {/* Category tiles */}
        <CategoryTiles categories={allCategories} activeCategory={categorySlug} />

        {/* Subcategory pill nav */}
        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8 scrollbar-hide">
            <div className="flex gap-2">
              {category.subcategories.map((sub: { _id: string; title: string; slug: string }) => (
                <Link
                  key={sub._id}
                  href={`/shop/${categorySlug}/${sub.slug}`}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    sub.slug === subcategorySlug
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600",
                  )}
                >
                  {sub.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={allCategories}
          products={products}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
