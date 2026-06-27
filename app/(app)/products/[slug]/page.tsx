import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/live";
import { PRODUCT_BY_SLUG_QUERY } from "@/lib/sanity/queries/products";
import { PRODUCT_META_QUERY, SITE_SETTINGS_QUERY } from "@/lib/sanity/queries/seo";
import {
  PRODUCT_REVIEW_STATS_QUERY,
  PRODUCT_REVIEWS_FOR_JSONLD_QUERY,
} from "@/lib/sanity/queries/reviews";
import { Suspense } from "react";
import { ProductGallery } from "@/components/app/ProductGallery";
import { ProductInfo } from "@/components/app/ProductInfo";
import { TrackRecentlyViewed } from "@/components/app/TrackRecentlyViewed";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import type { PRODUCT_BY_SLUG_QUERYResult } from "@/sanity.query-types";

const SITE_URL = "https://accessoriesbyashley.co.ke";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ review?: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  const [product, siteSettings] = await Promise.all([
    client.fetch(PRODUCT_META_QUERY, { slug }),
    client.fetch(SITE_SETTINGS_QUERY),
  ]);

  if (!product) return { title: "Product Not Found" };

  const siteName = siteSettings?.siteName ?? "Accessories by Ashley";
  const siteUrl = siteSettings?.siteUrl ?? SITE_URL;
  const globalKeywords = siteSettings?.seoGlobalKeywords ?? [];

  const title = product.seo?.metaTitle ?? `${product.name} | ${siteName}`;
  const description = product.seo?.metaDescription ?? product.description ?? siteSettings?.siteDescription ?? "";
  const ogTitle = product.seo?.ogTitle ?? product.name;
  const ogDescription = product.seo?.ogDescription ?? description;
  const ogImage = product.seo?.ogImageUrl ?? product.firstImageUrl ?? siteSettings?.defaultOgImageUrl;
  const canonical = product.seo?.canonicalUrl ?? `${siteUrl}/products/${slug}`;
  const noIndex = product.seo?.noIndex ?? false;

  const keywords = [
    product.seo?.focusKeyword,
    ...(product.seo?.secondaryKeywords ?? []),
    ...globalKeywords,
  ].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [{ url: ogImage }] : [],
      type: "website",
      url: canonical,
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    },
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [{ slug }, { review }] = await Promise.all([params, searchParams]);

  const { data: product } = (await sanityFetch({
    query: PRODUCT_BY_SLUG_QUERY,
    params: { slug },
  })) as { data: PRODUCT_BY_SLUG_QUERYResult };

  if (!product) notFound();

  const [reviewStatsDoc, jsonLdReviews] = await Promise.all([
    client.fetch(PRODUCT_REVIEW_STATS_QUERY, { productId: product._id }),
    client.fetch(PRODUCT_REVIEWS_FOR_JSONLD_QUERY, { productId: product._id }),
  ]);

  const breadcrumbs = [
    { name: "Home", url: `${SITE_URL}/` },
    ...(product.category ? [{ name: product.category.title ?? "Shop", url: `${SITE_URL}/shop/${product.category.slug}` }] : []),
    { name: product.name ?? "", url: `${SITE_URL}/products/${slug}` },
  ];

  return (
    <>
      {/* Structured data */}
      <ProductJsonLd
        product={product}
        reviewStats={reviewStatsDoc?.reviewStats}
        reviews={jsonLdReviews}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* Track this visit in recently viewed (client-side, silent) */}
      <TrackRecentlyViewed
        productId={product._id}
        name={product.name ?? ""}
        price={product.price ?? 0}
        image={product.images?.[0]?.asset?.url ?? undefined}
        slug={slug}
      />

      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image Gallery */}
            <ProductGallery images={product.images} productName={product.name} />

            {/* Product Info */}
            <ProductInfo product={product} />
          </div>

          {/* AI-generated SEO description — "About This Piece" */}
          {product.seoDescription && (
            <section className="mt-12 border-t border-zinc-200 pt-10 dark:border-zinc-800">
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                About This Piece
              </h2>
              <div className="max-w-3xl space-y-4">
                {product.seoDescription.split("\n\n").filter(Boolean).map((para: string, i: number) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static prose paragraphs
                  <p key={i} className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {para.trim()}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <Suspense fallback={null}>
            <ReviewSection productId={product._id} scrollToForm={review === "true"} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
