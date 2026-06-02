"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  toggleCategoryActive,
  deleteCategory,
  toggleSubcategoryActive,
  deleteSubcategory,
} from "@/lib/actions/categories";

// ── Category row actions ──────────────────────────────────────────────────────

export function CategoryActions({
  id,
  title,
  isActive,
}: {
  id: string;
  title: string | null;
  isActive: boolean | null;
}) {
  const [pending, startTransition] = useTransition();
  const active = isActive ?? true;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Active toggle */}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => toggleCategoryActive(id, !active))
        }
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          active ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
        title={active ? "Deactivate" : "Activate"}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>

      {/* Edit */}
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href={`/admin/categories/${id}/edit`} title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>

      {/* Delete */}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
          startTransition(() => deleteCategory(id));
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
        title="Delete category"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Subcategory row actions ───────────────────────────────────────────────────

export function SubcategoryActions({
  id,
  title,
  isActive,
}: {
  id: string;
  title: string | null;
  isActive: boolean | null;
}) {
  const [pending, startTransition] = useTransition();
  const active = isActive ?? true;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Active toggle */}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => toggleSubcategoryActive(id, !active))
        }
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          active ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
        title={active ? "Deactivate" : "Activate"}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>

      {/* Edit */}
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link href={`/admin/categories/subcategories/${id}/edit`} title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>

      {/* Delete */}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
          startTransition(() => deleteSubcategory(id));
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
        title="Delete subcategory"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
