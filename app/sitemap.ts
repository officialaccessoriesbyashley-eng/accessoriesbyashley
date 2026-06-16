import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import {
  SITEMAP_PRODUCTS_QUERY,
  SITEMAP_CATEGORIES_QUERY,
  SITEMAP_SUBCATEGORIES_QUERY,
} from "@/lib/sanity/queries/seo";

const SITE_URL = "https://accessoriesbyashley.com";

export const revalidate = 3600; // re-generate sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, subcategories] = await Promise.all([
    client.fetch(SITEMAP_PRODUCTS_QUERY),
    client.fetch(SITEMAP_CATEGORIES_QUERY),
    client.fetch(SITEMAP_SUBCATEGORIES_QUERY),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map(
    (cat: { slug: string; _updatedAt: string }) => ({
      url: `${SITE_URL}/shop/${cat.slug}`,
      lastModified: cat._updatedAt ? new Date(cat._updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  const subcategoryPages: MetadataRoute.Sitemap = (subcategories ?? [])
    .filter((sub: { parentSlug?: string | null }) => sub.parentSlug)
    .map((sub: { slug: string; parentSlug: string; _updatedAt: string }) => ({
      url: `${SITE_URL}/shop/${sub.parentSlug}/${sub.slug}`,
      lastModified: sub._updatedAt ? new Date(sub._updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const productPages: MetadataRoute.Sitemap = (products ?? []).map(
    (product: { slug: string; _updatedAt: string }) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product._updatedAt ? new Date(product._updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  return [...staticPages, ...categoryPages, ...subcategoryPages, ...productPages];
}
