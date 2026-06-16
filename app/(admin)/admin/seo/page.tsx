import { client } from "@/sanity/lib/client";
import {
  ADMIN_SEO_PRODUCTS_QUERY,
  ADMIN_SEO_CATEGORIES_QUERY,
  SEO_HEALTH_STATS_QUERY,
} from "@/lib/sanity/queries/seo";
import { SeoOverviewClient } from "./SeoOverviewClient";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const [stats, products, categories] = await Promise.all([
    client.fetch(SEO_HEALTH_STATS_QUERY),
    client.fetch(ADMIN_SEO_PRODUCTS_QUERY),
    client.fetch(ADMIN_SEO_CATEGORIES_QUERY),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">SEO Management</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Monitor and manage search engine optimisation across all products and categories.
        </p>
      </div>

      <SeoOverviewClient
        stats={stats}
        products={products ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
