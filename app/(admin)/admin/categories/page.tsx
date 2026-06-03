import { client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import Link from "next/link";
import Image from "next/image";
import { Tag, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryActions, SubcategoryActions } from "./CategoryActions";

const ADMIN_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
] | order(sortOrder asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  icon,
  isActive,
  isFeatured,
  sortOrder,
  "imageUrl": image.asset->url,
  "subcategoryCount": count(*[_type == "subcategory" && parentCategory._ref == ^._id]),
  "productCount": count(*[_type == "product" && category._ref == ^._id])
}`);

const ADMIN_SUBCATEGORIES_QUERY = defineQuery(`*[
  _type == "subcategory"
] | order(parentCategory.title asc, sortOrder asc) {
  _id,
  title,
  "slug": slug.current,
  isActive,
  sortOrder,
  "imageUrl": image.asset->url,
  "parentCategory": parentCategory->{ _id, title, icon },
  "productCount": count(*[_type == "product" && subcategory._ref == ^._id])
}`);

interface AdminCategory {
  _id: string;
  title: string | null;
  slug: string | null;
  icon: string | null;
  isActive: boolean | null;
  isFeatured: boolean | null;
  sortOrder: number | null;
  imageUrl: string | null;
  subcategoryCount: number | null;
  productCount: number | null;
}

interface AdminSubcategory {
  _id: string;
  title: string | null;
  slug: string | null;
  isActive: boolean | null;
  sortOrder: number | null;
  imageUrl: string | null;
  parentCategory: { _id: string; title: string | null; icon: string | null } | null;
  productCount: number | null;
}

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, subcategories] = await Promise.all([
    client.fetch<AdminCategory[]>(ADMIN_CATEGORIES_QUERY),
    client.fetch<AdminSubcategory[]>(ADMIN_SUBCATEGORIES_QUERY),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Categories</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {categories.length} categories · {subcategories.length} subcategories
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/categories/subcategories/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Subcategory
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/categories/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>
      </div>

      {/* Categories */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">Categories</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {categories.length === 0 ? (
            <EmptyState
              message="No categories yet."
              hint='Click "Add Category" or run npm run seed:categories.'
            />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {categories.map((cat) => (
                <li key={cat._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {cat.imageUrl ? (
                      <Image src={cat.imageUrl} alt={cat.title ?? ""} fill className="object-cover" sizes="40px" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl">
                        {cat.icon ?? <Tag className="h-4 w-4 text-zinc-400" />}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {cat.title}
                      </span>
                      {cat.isFeatured && (
                        <Badge variant="outline" className="border-amber-300 text-xs text-amber-600">
                          Featured
                        </Badge>
                      )}
                      {!(cat.isActive ?? true) && (
                        <Badge variant="outline" className="text-xs text-zinc-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      /{cat.slug} · {cat.subcategoryCount ?? 0} subcategories · {cat.productCount ?? 0} products
                    </p>
                  </div>

                  <CategoryActions id={cat._id} title={cat.title} isActive={cat.isActive} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Subcategories */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">Subcategories</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {subcategories.length === 0 ? (
            <EmptyState message="No subcategories yet." hint='Click "Add Subcategory" to create one.' />
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {subcategories.map((sub) => (
                <li key={sub._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {sub.imageUrl ? (
                      <Image src={sub.imageUrl} alt={sub.title ?? ""} fill className="object-cover" sizes="40px" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl">
                        {sub.parentCategory?.icon ?? <Tag className="h-4 w-4 text-zinc-400" />}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {sub.parentCategory?.icon && (
                          <span className="mr-1">{sub.parentCategory.icon}</span>
                        )}
                        {sub.parentCategory?.title ?? "—"}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {sub.title}
                      </span>
                      {!(sub.isActive ?? true) && (
                        <Badge variant="outline" className="text-xs text-zinc-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      /{sub.slug} · {sub.productCount ?? 0} products
                    </p>
                  </div>

                  <SubcategoryActions id={sub._id} title={sub.title} isActive={sub.isActive} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <Tag className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
      <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">{message}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
