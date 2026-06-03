import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import { CATEGORY_WITH_SUBCATEGORIES_QUERY, ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export const dynamic = "force-dynamic";

export default async function ShopCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;

  const [{ data: category }, { data: allCategories }] = await Promise.all([
    sanityFetch({ query: CATEGORY_WITH_SUBCATEGORIES_QUERY, params: { slug: categorySlug } }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
  ]);

  if (!category) notFound();

  type SubcategoryItem = {
    _id: string;
    title: string | null;
    slug: string | null;
    image?: { asset?: { _id: string; url: string | null } | null; hotspot?: unknown } | null;
  };
  const subcategories = (category as { subcategories?: SubcategoryItem[] }).subcategories ?? [];

  if (subcategories.length === 0) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Page banner */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-zinc-800 dark:text-zinc-100">
              {(category as { icon?: string | null }).icon && (
                <span className="mr-1">{(category as { icon?: string | null }).icon}</span>
              )}
              {category.title}
            </span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {(category as { icon?: string | null }).icon && (
              <span className="mr-2">{(category as { icon?: string | null }).icon}</span>
            )}
            {category.title}
          </h1>
          {(category as { description?: string | null }).description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {(category as { description?: string | null }).description}
            </p>
          )}
        </div>

        {/* Category tiles */}
        <CategoryTiles categories={allCategories} activeCategory={categorySlug} />
      </div>

      {/* Subcategory grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Select a subcategory to browse products
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {subcategories.map((sub) => {
            const imageUrl = sub.image?.asset?.url;
            return (
              <Link
                key={sub._id}
                href={`/shop/${categorySlug}/${sub.slug}`}
                className="group relative overflow-hidden rounded-2xl ring-1 ring-zinc-200 transition-all duration-300 hover:ring-zinc-300 hover:shadow-md dark:ring-zinc-800 dark:hover:ring-zinc-700"
              >
                <div className="relative aspect-[4/3]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={sub.title ?? "Subcategory"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <span className="text-sm font-semibold text-white drop-shadow-md sm:text-base">
                      {sub.title}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
