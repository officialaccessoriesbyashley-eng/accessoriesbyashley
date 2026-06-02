import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCategory } from "@/lib/actions/categories";

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">New Category</h1>
      </div>

      <form action={createCategory} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Field label="Title *" name="title" placeholder="e.g. Quality Necklaces" required />
        <Field
          label="Slug"
          name="slug"
          placeholder="auto-generated from title if left blank"
          hint="Used in the URL: /shop/your-slug"
        />
        <Field label="Icon (emoji)" name="icon" placeholder="e.g. 📿" />
        <Field
          label="Description"
          name="description"
          placeholder="Short description shown on the shop page"
          multiline
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Featured — show on homepage
          </label>
        </div>

        <Field label="Sort order" name="sortOrder" type="number" placeholder="0" />

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1">Create Category</Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/admin/categories">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  hint,
  required,
  multiline,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
}) {
  const base =
    "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {multiline ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={base} />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          className={base}
        />
      )}
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
