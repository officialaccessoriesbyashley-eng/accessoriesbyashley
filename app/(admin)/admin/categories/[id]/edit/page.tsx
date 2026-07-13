import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { adminClient } from "@/sanity/lib/client";
import { Button } from "@/components/ui/button";
import { updateCategory } from "@/lib/actions/categories";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;

  const cat = await adminClient.fetch<{
    _id: string;
    title: string;
    slug: string;
    icon: string | null;
    description: string | null;
    isFeatured: boolean | null;
    sortOrder: number | null;
    imageUrl: string | null;
  } | null>(
    `*[_type == "category" && _id == $id][0]{
      _id, title, "slug": slug.current, icon, description, isFeatured, sortOrder,
      "imageUrl": image.asset->url
    }`,
    { id }
  );

  if (!cat) notFound();

  const action = updateCategory.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/admin/categories">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Edit Category</h1>
      </div>

      <form action={action} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Field label="Title *" name="title" defaultValue={cat.title} required />
        <Field
          label="Slug"
          name="slug"
          defaultValue={cat.slug}
          hint="Changing the slug will break existing links to this category."
        />

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Image
          </label>
          {cat.imageUrl && (
            <div className="relative mt-1 mb-2 h-36 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Image
                src={cat.imageUrl}
                alt={cat.title}
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
            {cat.imageUrl ? "Upload a new image to replace the current one." : "Upload a JPG or PNG image."}
          </p>
        </div>

        <Field label="Icon (emoji)" name="icon" defaultValue={cat.icon ?? ""} />
        <Field
          label="Description"
          name="description"
          defaultValue={cat.description ?? ""}
          multiline
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            defaultChecked={cat.isFeatured ?? false}
            className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Featured — show on homepage
          </label>
        </div>

        <Field
          label="Sort order"
          name="sortOrder"
          type="number"
          defaultValue={String(cat.sortOrder ?? 0)}
        />

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
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue} rows={3} className={base} />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          required={required}
          className={base}
        />
      )}
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
