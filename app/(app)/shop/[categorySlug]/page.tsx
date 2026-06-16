import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/live";
import {
  SHOP_FILTER_PRODUCTS_BY_NAME_QUERY,
  SHOP_FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  SHOP_FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  SHOP_FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_NAME_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  SUBCATEGORY_FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
} from "@/lib/sanity/queries/products";
import { CATEGORY_WITH_SUBCATEGORIES_QUERY, ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { CATEGORY_META_QUERY, SITE_SETTINGS_QUERY } from "@/lib/sanity/queries/seo";
import { ProductSection } from "@/components/app/ProductSection";
import { CategoryTiles } from "@/components/app/CategoryTiles";
import { SubcategoryTiles } from "@/components/app/SubcategoryTiles";
import { CategoryJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SITE_URL = "https://accessoriesbyashley.co.ke";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{
    sub?: string;
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

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;

  const [category, siteSettings] = await Promise.all([
    client.fetch(CATEGORY_META_QUERY, { slug: categorySlug }),
    client.fetch(SITE_SETTINGS_QUERY),
  ]);

  if (!category) return { title: "Category Not Found" };

  const siteName = siteSettings?.siteName ?? "Accessories by Ashley";
  const siteUrl = siteSettings?.siteUrl ?? SITE_URL;
  const globalKeywords = siteSettings?.seoGlobalKeywords ?? [];

  const title = category.seo?.metaTitle ?? `${category.title} | ${siteName}`;
  const description = category.seo?.metaDescription ?? category.description ?? siteSettings?.siteDescription ?? "";
  const ogImage = category.seo?.ogImageUrl ?? category.imageUrl ?? siteSettings?.defaultOgImageUrl;
  const canonical = category.seo?.canonicalUrl ?? `${siteUrl}/shop/${categorySlug}`;

  const keywords = [
    category.seo?.focusKeyword,
    ...(category.seo?.secondaryKeywords ?? []),
    ...globalKeywords,
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: category.seo?.ogTitle ?? category.title ?? title,
      description: category.seo?.ogDescription ?? description,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "website",
      url: canonical,
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: category.seo?.ogTitle ?? category.title ?? title,
      description: category.seo?.ogDescription ?? description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: { canonical },
    robots: category.seo?.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function ShopCategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const sp = await searchParams;

  const selectedSub = sp.sub ?? "";
  const searchQuery = sp.q ?? "";
  const color = sp.color ?? "";
  const material = sp.material ?? "";
  const minPrice = Number(sp.minPrice) || 0;
  const maxPrice = Number(sp.maxPrice) || 0;
  const sort = sp.sort ?? "name";
  const inStock = sp.inStock === "true";

  const isSubSelected = !!selectedSub;

  const filterParams = isSubSelected
    ? { subcategorySlug: selectedSub, searchQuery, color, material, minPrice, maxPrice, inStock }
    : { categorySlug, searchQuery, color, material, minPrice, maxPrice, inStock };

  const getQuery = () => {
    if (isSubSelected) {
      if (searchQuery && sort === "relevance") return SUBCATEGORY_FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      switch (sort) {
        case "price_asc": return SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
        case "price_desc": return SUBCATEGORY_FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
        case "relevance": return SUBCATEGORY_FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
        default: return SUBCATEGORY_FILTER_PRODUCTS_BY_NAME_QUERY;
      }
    }
    if (searchQuery && sort === "relevance") return SHOP_FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
    switch (sort) {
      case "price_asc": return SHOP_FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
      case "price_desc": return SHOP_FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
      case "relevance": return SHOP_FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      default: return SHOP_FILTER_PRODUCTS_BY_NAME_QUERY;
    }
  };

  const [{ data: products }, { data: category }, { data: allCategories }] = await Promise.all([
    sanityFetch({ query: getQuery(), params: filterParams }),
    sanityFetch({ query: CATEGORY_WITH_SUBCATEGORIES_QUERY, params: { slug: categorySlug } }),
    sanityFetch({ query: ALL_CATEGORIES_QUERY }),
  ]);

  if (!category) notFound();

  const subcategories = (category as { subcategories?: { _id: string; title: string | null; slug: string | null; image?: { asset?: { _id: string; url: string | null } | null } | null }[] }).subcategories ?? [];
  if (subcategories.length === 0) notFound();

  const cat = category as {
    _id?: string | null;
    title?: string | null;
    icon?: string | null;
    description?: string | null;
    seoDescription?: string | null;
  };

  const productList = (products ?? []) as { slug?: string | null }[];
  const productUrls = productList
    .filter((p) => p.slug)
    .map((p) => `https://accessoriesbyashley.com/products/${p.slug}`);

  const breadcrumbs = [
    { name: "Home", url: "https://accessoriesbyashley.com/" },
    { name: cat.title ?? categorySlug, url: `https://accessoriesbyashley.com/shop/${categorySlug}` },
  ];

  return (
    <>
      <CategoryJsonLd category={{ ...cat, slug: categorySlug }} productUrls={productUrls} />
      <BreadcrumbJsonLd items={breadcrumbs} />
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Page banner */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-zinc-800 dark:text-zinc-100">
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.title}
            </span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {cat.icon && <span className="mr-2">{cat.icon}</span>}
            {cat.title}
          </h1>
          {cat.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{cat.description}</p>
          )}
        </div>

        {/* Category tiles */}
        <CategoryTiles categories={allCategories} activeCategory={categorySlug} />

        {/* Subcategory tiles — same design as category tiles */}
        <SubcategoryTiles
          subcategories={subcategories}
          categorySlug={categorySlug}
          activeSub={selectedSub || undefined}
        />
      </div>

      {/* Products */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={allCategories}
          products={products}
          searchQuery={searchQuery}
        />
      </div>
    </div>
    </>
  );
}
