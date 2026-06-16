"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SeoStats {
  totalProducts: number;
  productsWithSeo: number;
  productsWithGoodScore: number;
  productsMissingSeo: number;
  productsMissingAltText: number;
  totalCategories: number;
  categoriesWithSeo: number;
}

interface ProductSeoRow {
  _id: string;
  name: string;
  slug?: string | null;
  price?: number | null;
  seo?: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    focusKeyword?: string | null;
    seoScore?: number | null;
    lastSeoGeneration?: string | null;
    aiGenerated?: boolean | null;
    noIndex?: boolean | null;
  } | null;
  hasSeoDescription?: boolean | null;
  imageCount?: number | null;
  altTextCount?: number | null;
  hasSocialCaption?: boolean | null;
  category?: { title?: string | null } | null;
  imageUrl?: string | null;
}

interface CategorySeoRow {
  _id: string;
  title?: string | null;
  slug?: string | null;
  seo?: {
    metaTitle?: string | null;
    seoScore?: number | null;
    lastSeoGeneration?: string | null;
    aiGenerated?: boolean | null;
  } | null;
  hasSeoDescription?: boolean | null;
  imageUrl?: string | null;
}

interface Props {
  stats: SeoStats;
  products: ProductSeoRow[];
  categories: CategorySeoRow[];
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score?: number | null }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        None
      </span>
    );
  }
  const { bg, text } =
    score >= 80
      ? { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" }
      : score >= 60
        ? { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" }
        : score >= 40
          ? { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" }
          : { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
      {score}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  variant = "default",
}: {
  label: string;
  value: number | string;
  sub?: string;
  variant?: "default" | "danger" | "success";
}) {
  const colors =
    variant === "danger"
      ? "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20"
      : variant === "success"
        ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";
  const valueColor =
    variant === "danger"
      ? "text-red-700 dark:text-red-400"
      : variant === "success"
        ? "text-green-700 dark:text-green-400"
        : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className={`rounded-xl border p-5 ${colors}`}>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SeoOverviewClient({ stats, products, categories }: Props) {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (activeTab === "products") {
      setSelectedIds(new Set(products.map((p) => p._id)));
    } else {
      setSelectedIds(new Set(categories.map((c) => c._id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBatch = (opts: { all?: boolean; onlyMissing?: boolean; regenerate?: boolean }) => {
    const documentType = activeTab === "products" ? "product" : "category";
    const documentIds = opts.all ? undefined : [...selectedIds];

    startTransition(async () => {
      setBatchResult(null);
      try {
        const res = await fetch("/api/ai/generate-seo/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType,
            documentIds: opts.all ? undefined : documentIds,
            all: opts.all ?? false,
            onlyMissing: opts.onlyMissing ?? true,
            regenerate: opts.regenerate ?? false,
          }),
        });
        const data = (await res.json()) as { succeeded?: number; skipped?: number; failed?: number; processed?: number };
        setBatchResult(
          `Done: ${data.succeeded ?? 0} generated, ${data.skipped ?? 0} skipped, ${data.failed ?? 0} failed (${data.processed ?? 0} processed).`
        );
        clearSelection();
      } catch (err) {
        setBatchResult(`Error: ${String(err)}`);
      }
    });
  };

  const seoPercent = stats.totalProducts > 0
    ? Math.round((stats.productsWithSeo / stats.totalProducts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Health stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Products with SEO"
          value={`${stats.productsWithSeo}/${stats.totalProducts}`}
          sub={`${seoPercent}% coverage`}
          variant={seoPercent < 50 ? "danger" : seoPercent < 80 ? "default" : "success"}
        />
        <StatCard
          label="Good SEO Score (≥60)"
          value={stats.productsWithGoodScore}
          sub="Products scoring 60+"
          variant={stats.productsWithGoodScore < stats.totalProducts / 2 ? "danger" : "success"}
        />
        <StatCard
          label="Missing SEO"
          value={stats.productsMissingSeo}
          sub="Products with no meta title"
          variant={stats.productsMissingSeo > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Missing Alt Text"
          value={stats.productsMissingAltText}
          sub="Images without alt text"
          variant={stats.productsMissingAltText > 0 ? "danger" : "success"}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(["products", "categories"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => { setActiveTab(tab); clearSelection(); }}
            className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Batch actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={selectAll}
          disabled={isPending}
        >
          Select all
        </Button>
        {selectedIds.size > 0 && (
          <>
            <Button
              size="sm"
              onClick={() => runBatch({})}
              disabled={isPending}
              className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Sparkles className="h-4 w-4" />
              Generate SEO for selected ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runBatch({ regenerate: true })}
              disabled={isPending}
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate selected
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} disabled={isPending}>
              Clear
            </Button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBatch({ all: true, onlyMissing: true })}
            disabled={isPending}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            {isPending ? "Generating…" : "Generate all missing"}
          </Button>
        </div>
      </div>

      {/* Batch result feedback */}
      {batchResult && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {batchResult}
        </div>
      )}

      {/* Products table */}
      {activeTab === "products" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === products.length && products.length > 0}
                    onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 hidden md:table-cell">Meta Title</th>
                <th className="px-4 py-3 hidden lg:table-cell">Focus Keyword</th>
                <th className="px-4 py-3 hidden lg:table-cell">Content</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {products.map((product) => {
                const score = product.seo?.seoScore;
                const missingAlt = (product.imageCount ?? 0) > (product.altTextCount ?? 0);
                return (
                  <tr
                    key={product._id}
                    className={`bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${selectedIds.has(product._id) ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product._id)}
                        onChange={() => toggleSelect(product._id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-zinc-400">{product.category?.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={score} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {product.seo?.metaTitle ? (
                        <span className="line-clamp-1 text-zinc-700 dark:text-zinc-300">{product.seo.metaTitle}</span>
                      ) : (
                        <span className="text-zinc-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {product.seo?.focusKeyword ? (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {product.seo.focusKeyword}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1">
                        <span title={product.hasSeoDescription ? "Has SEO description" : "Missing SEO description"}>
                          {product.hasSeoDescription ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                          )}
                        </span>
                        <span title={missingAlt ? "Images missing alt text" : "Alt texts complete"}>
                          {missingAlt ? (
                            <ImageIcon className="h-3.5 w-3.5 text-orange-400" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/seo/${product._id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Edit SEO
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500">No products found.</div>
          )}
        </div>
      )}

      {/* Categories table */}
      {activeTab === "categories" && (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === categories.length && categories.length > 0}
                    onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 hidden md:table-cell">Meta Title</th>
                <th className="px-4 py-3 hidden lg:table-cell">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {categories.map((cat) => (
                <tr
                  key={cat._id}
                  className={`bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${selectedIds.has(cat._id) ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(cat._id)}
                      onChange={() => toggleSelect(cat._id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{cat.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={cat.seo?.seoScore} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {cat.seo?.metaTitle ? (
                      <span className="line-clamp-1 text-zinc-700 dark:text-zinc-300">{cat.seo.metaTitle}</span>
                    ) : (
                      <span className="text-zinc-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {cat.hasSeoDescription ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/seo/${cat._id}?type=category`}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Edit SEO
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500">No categories found.</div>
          )}
        </div>
      )}
    </div>
  );
}
