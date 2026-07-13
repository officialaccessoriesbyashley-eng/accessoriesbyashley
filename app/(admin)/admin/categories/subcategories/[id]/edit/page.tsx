import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { adminClient } from "@/sanity/lib/client";
import { Button } from "@/components/ui/button";
import { updateSubcategory } from "@/lib/actions/categories";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditSubcategoryPage({ params }: PageProps) {
  const { id } = await params;

  const [sub, categories] = await Promise.all([
    adminClient.fetch<{
      _id: string;
      title: string;
      slug: string;
      description: string | null;
      sortOrder: number | null;
      parentId: string | null;
      imageUrl: string | null;
    } | null>(
      `*[_type == "subcategory" && _id == $id][0]{
        _id, title, "slug": slug.current, description, sortOrder,
        "parentId": parentCategory._ref,
        "imageUrl": image.asset->url
      }`,
      { id }
    ),
    adminClient.fetch<{ _id: string; title: string; icon: string | null }[]>(
      `*[_type == "category"] | order(sortOrder asc, title asc) { _id, title, icon }`
    ),
  ]);

  if (!sub) notFound();

  const action = updateSubcategory.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Edit Subcategory</h1>
      </div>

      <form action={action} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Parent category */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Parent Category *
          </label>
          <select
            name="parentId"
            required
            defaultValue={sub.parentId ?? ""}
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

        <Field label="Title *" name="title" defaultValue={sub.title} required />
        <Field
          label="Slug"
          name="slug"
          defaultValue={sub.slug}
          hint="Changing the slug will break existing links to this subcategory."
        />

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Image
          </label>
          {sub.imageUrl && (
            <div className="relative mt-1 mb-2 h-36 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Image
                src={sub.imageUrl}
                alt={sub.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 576px"
              />
            </div>
          )}
          <input
            type="file"
            name="image"
            accept="image/*"
            className="mt-1 w-full text-sm text-zinc-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700"
          />
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {sub.imageUrl ? "Upload a new image to replace the current one." : "Upload a JPG or PNG image."}
          </p>
        </div>

        <Field label="Description" name="description" defaultValue={sub.description ?? ""} multiline />
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={String(sub.sortOrder ?? 0)} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1">Save Changes</Button>
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
  defaultValue,
  hint,
  required,
  multiline,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
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
        <textarea name={name} defaultValue={defaultValue} rows={3} className={base} />
      ) : (
        <input type={type} name={name} defaultValue={defaultValue} required={required} className={base} />
      )}
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
