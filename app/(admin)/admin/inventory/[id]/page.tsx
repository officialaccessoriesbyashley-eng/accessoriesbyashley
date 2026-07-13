"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import {
  useDocument,
  useEditDocument,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PublishButton,
  RevertButton,
  ImageUploader,
  DeleteButton,
} from "@/components/admin";
import { MATERIALS, COLORS } from "@/lib/constants/filters";

type CatOption = { _id: string; title: string; icon: string | null; subcategories: { _id: string; title: string }[] };

// ── Field editors ─────────────────────────────────────────────────────────────

function NameEditor(handle: DocumentHandle) {
  const { data: name } = useDocument({ ...handle, path: "name" });
  const editName = useEditDocument({ ...handle, path: "name" });
  return (
    <Input
      value={(name as string) ?? ""}
      onChange={(e) => editName(e.target.value)}
      placeholder="Product name"
    />
  );
}

function SlugEditor(handle: DocumentHandle) {
  const { data: slug } = useDocument({ ...handle, path: "slug" });
  const editSlug = useEditDocument({ ...handle, path: "slug" });
  const slugValue = (slug as { current?: string })?.current ?? "";
  return (
    <Input
      value={slugValue}
      onChange={(e) => editSlug({ _type: "slug", current: e.target.value })}
      placeholder="product-slug"
    />
  );
}

function DescriptionEditor(handle: DocumentHandle) {
  const { data: description } = useDocument({ ...handle, path: "description" });
  const editDescription = useEditDocument({ ...handle, path: "description" });
  return (
    <Textarea
      value={(description as string) ?? ""}
      onChange={(e) => editDescription(e.target.value)}
      placeholder="Short product description shown on the product card and page."
      rows={4}
    />
  );
}

function PriceEditor(handle: DocumentHandle) {
  const { data: price } = useDocument({ ...handle, path: "price" });
  const editPrice = useEditDocument({ ...handle, path: "price" });
  return (
    <Input
      type="number"
      step="0.01"
      min="0"
      value={(price as number) ?? ""}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        editPrice(parseFloat(e.target.value) || 0)
      }
      placeholder="0.00"
    />
  );
}

function StockEditor(handle: DocumentHandle) {
  const { data: stock } = useDocument({ ...handle, path: "stock" });
  const editStock = useEditDocument({ ...handle, path: "stock" });
  return (
    <Input
      type="number"
      min="0"
      value={(stock as number) ?? 0}
      onChange={(e) => editStock(parseInt(e.target.value) || 0)}
      placeholder="0"
    />
  );
}

function CategoryEditor({ handle, cats }: { handle: DocumentHandle; cats: CatOption[] }) {
  const { data: categoryRef } = useDocument({ ...handle, path: "category" });
  const editCategory = useEditDocument({ ...handle, path: "category" });
  const editSubcategory = useEditDocument({ ...handle, path: "subcategory" });

  const currentId = (categoryRef as { _ref?: string } | null)?._ref ?? "";

  return (
    <Select
      value={currentId}
      onValueChange={(value) => {
        editCategory(value ? { _type: "reference", _ref: value } : null);
        editSubcategory(null);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {cats.map((c) => (
          <SelectItem key={c._id} value={c._id}>
            {c.icon ? `${c.icon} ` : ""}{c.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SubcategoryEditor({ handle, cats }: { handle: DocumentHandle; cats: CatOption[] }) {
  const { data: categoryRef } = useDocument({ ...handle, path: "category" });
  const { data: subcategoryRef } = useDocument({ ...handle, path: "subcategory" });
  const editSubcategory = useEditDocument({ ...handle, path: "subcategory" });

  const categoryId = (categoryRef as { _ref?: string } | null)?._ref ?? "";
  const currentSubId = (subcategoryRef as { _ref?: string } | null)?._ref ?? "";
  const subcategories = cats.find((c) => c._id === categoryId)?.subcategories ?? [];

  return (
    <Select
      value={currentSubId}
      onValueChange={(value) =>
        editSubcategory(value ? { _type: "reference", _ref: value } : null)
      }
      disabled={!categoryId || subcategories.length === 0}
    >
      <SelectTrigger>
        <SelectValue placeholder={categoryId ? (subcategories.length === 0 ? "No subcategories" : "Select subcategory") : "Select a category first"} />
      </SelectTrigger>
      <SelectContent>
        {subcategories.map((s) => (
          <SelectItem key={s._id} value={s._id}>
            {s.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function GenderEditor(handle: DocumentHandle) {
  const { data: gender } = useDocument({ ...handle, path: "gender" });
  const editGender = useEditDocument({ ...handle, path: "gender" });
  return (
    <Select
      value={(gender as string) ?? ""}
      onValueChange={(value) => editGender(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select gender" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="women">Women</SelectItem>
        <SelectItem value="men">Men</SelectItem>
        <SelectItem value="unisex">Unisex</SelectItem>
      </SelectContent>
    </Select>
  );
}

function MaterialEditor(handle: DocumentHandle) {
  const { data: material } = useDocument({ ...handle, path: "material" });
  const editMaterial = useEditDocument({ ...handle, path: "material" });
  return (
    <Select
      value={(material as string) ?? ""}
      onValueChange={(value) => editMaterial(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select material" />
      </SelectTrigger>
      <SelectContent>
        {MATERIALS.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ColorEditor(handle: DocumentHandle) {
  const { data: color } = useDocument({ ...handle, path: "color" });
  const editColor = useEditDocument({ ...handle, path: "color" });
  return (
    <Select
      value={(color as string) ?? ""}
      onValueChange={(value) => editColor(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select color" />
      </SelectTrigger>
      <SelectContent>
        {COLORS.map((c) => (
          <SelectItem key={c.value} value={c.value}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TagsEditor(handle: DocumentHandle) {
  const { data: tags } = useDocument({ ...handle, path: "tags" });
  const editTags = useEditDocument({ ...handle, path: "tags" });

  const currentTags = (tags as string[] | null) ?? [];
  const [inputValue, setInputValue] = useState(currentTags.join(", "));

  // Sync external changes (e.g. revert)
  useEffect(() => {
    setInputValue((tags as string[] | null ?? []).join(", "));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tags)]);

  function handleBlur() {
    const parsed = inputValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    editTags(parsed.length > 0 ? parsed : null);
  }

  return (
    <div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g. gold, minimalist, gift, earrings"
      />
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Separate tags with commas.</p>
    </div>
  );
}

function SizeNotesEditor(handle: DocumentHandle) {
  const { data: dimensions } = useDocument({ ...handle, path: "dimensions" });
  const editDimensions = useEditDocument({ ...handle, path: "dimensions" });
  return (
    <Input
      value={(dimensions as string) ?? ""}
      onChange={(e) => editDimensions(e.target.value)}
      placeholder='e.g. "Ring Size 7", "18cm chain", "One size fits all"'
    />
  );
}

function FeaturedEditor(handle: DocumentHandle) {
  const { data: featured } = useDocument({ ...handle, path: "featured" });
  const editFeatured = useEditDocument({ ...handle, path: "featured" });
  return (
    <Switch
      checked={(featured as boolean) ?? false}
      onCheckedChange={(checked: boolean) => editFeatured(checked)}
    />
  );
}

interface ProductSlugProjection {
  slug: { current: string } | null;
}

function ProductStoreLink(handle: DocumentHandle) {
  const { data } = useDocumentProjection<ProductSlugProjection>({
    ...handle,
    projection: `{ slug }`,
  });
  const slug = data?.slug?.current;
  if (!slug) return null;
  return (
    <Link
      href={`/products/${slug}`}
      target="_blank"
      className="flex items-center justify-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      View on store
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

function ProductDetailContent({ handle }: { handle: DocumentHandle }) {
  const { data: name } = useDocument({ ...handle, path: "name" });
  const [cats, setCats] = useState<CatOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories-for-editor")
      .then((r) => r.json())
      .then(setCats)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {(name as string) || "New Product"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Edit product details</p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteButton handle={handle} />
          <Suspense fallback={null}>
            <RevertButton {...handle} />
          </Suspense>
          <Suspense fallback={null}>
            <PublishButton {...handle} />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Basic Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <NameEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <SlugEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Suspense fallback={<Skeleton className="h-24" />}>
                  <DescriptionEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Category</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <CategoryEditor handle={handle} cats={cats} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <SubcategoryEditor handle={handle} cats={cats} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Pricing & Inventory</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price (KSh)</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <PriceEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <StockEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Attributes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Material</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <MaterialEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <ColorEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <GenderEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2">
                <Label>Size / Fit Notes</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <SizeNotesEditor {...handle} />
                </Suspense>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tags</Label>
                <Suspense fallback={<Skeleton className="h-10" />}>
                  <TagsEditor {...handle} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Options</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Featured Product</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Show on homepage and promotions</p>
              </div>
              <Suspense fallback={<Skeleton className="h-6 w-11" />}>
                <FeaturedEditor {...handle} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">Product Images</h2>
            <ImageUploader {...handle} />
            <div className="mt-4">
              <Suspense fallback={null}>
                <ProductStoreLink {...handle} />
              </Suspense>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Advanced Editing</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Edit SEO, alt texts, and social captions in Sanity Studio.
            </p>
            <Link
              href={`/studio/structure/product;${handle.documentId}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              Open in Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-7 w-48 sm:h-8" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const handle: DocumentHandle = {
    documentId: id,
    documentType: "product",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/inventory"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Link>

      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent handle={handle} />
      </Suspense>
    </div>
  );
}
