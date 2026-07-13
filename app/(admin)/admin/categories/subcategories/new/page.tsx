import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { adminClient } from "@/sanity/lib/client";
import { Button } from "@/components/ui/button";
import { createSubcategory } from "@/lib/actions/categories";

export const dynamic = "force-dynamic";

export default async function NewSubcategoryPage() {
  const categories = await adminClient.fetch<{ _id: string; title: string; icon: string | null }[]>(
    `*[_type == "category"] | order(sortOrder asc, title asc) { _id, title, icon }`
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">New Subcategory</h1>
      </div>

      <form action={createSubcategory} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Parent category */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Parent Category *
          </label>
          <select
            name="parentId"
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select a category…</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.icon ? `${cat.icon} ` : ""}{cat.title}
              </option>
            ))}
          </select>
        </div>

        <Field label="Title *" name="title" placeholder="e.g. Hypoallergenic Earrings" required />
        <Field
          label="Slug"
          name="slug"
          placeholder="auto-generated from title if left blank"
          hint="Used in the URL: /shop/category/your-slug"
        />

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Image
          </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="mt-1 w-full text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700"
          />
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            JPG or PNG. Shown on the category landing page.
          </p>
        </div>

        <Field label="Description" name="description" multiline placeholder="Optional short description" />
        <Field label="Sort order" name="sortOrder" type="number" placeholder="0" />

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1">Create Subcategory</Button>
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
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {multiline ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={base} />
      ) : (
        <input type={type} name={name} placeholder={placeholder} required={required} className={base} />
      )}
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
