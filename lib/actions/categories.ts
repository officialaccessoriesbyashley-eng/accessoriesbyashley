"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeClient } from "@/sanity/lib/client";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = slugify((formData.get("slug") as string).trim() || title);
  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const isFeatured = formData.get("isFeatured") === "on";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!title) throw new Error("Title is required");

  await writeClient.create({
    _type: "category",
    title,
    slug: { _type: "slug", current: slug },
    icon,
    description,
    isFeatured,
    isActive: true,
    sortOrder,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = slugify((formData.get("slug") as string).trim() || title);
  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const isFeatured = formData.get("isFeatured") === "on";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!title) throw new Error("Title is required");

  await writeClient.patch(id).set({
    title,
    slug: { _type: "slug", current: slug },
    icon,
    description,
    isFeatured,
    sortOrder,
  }).commit();

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  await writeClient.patch(id).set({ isActive }).commit();
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  await writeClient.delete(id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

// ── Subcategories ─────────────────────────────────────────────────────────────

export async function createSubcategory(formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = slugify((formData.get("slug") as string).trim() || title);
  const parentId = (formData.get("parentId") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!title || !parentId) throw new Error("Title and parent category are required");

  await writeClient.create({
    _type: "subcategory",
    title,
    slug: { _type: "slug", current: slug },
    parentCategory: { _type: "reference", _ref: parentId },
    description,
    isActive: true,
    sortOrder,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateSubcategory(id: string, formData: FormData) {
  const title = (formData.get("title") as string).trim();
  const slug = slugify((formData.get("slug") as string).trim() || title);
  const parentId = (formData.get("parentId") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!title || !parentId) throw new Error("Title and parent category are required");

  await writeClient.patch(id).set({
    title,
    slug: { _type: "slug", current: slug },
    parentCategory: { _type: "reference", _ref: parentId },
    description,
    sortOrder,
  }).commit();

  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function toggleSubcategoryActive(id: string, isActive: boolean) {
  await writeClient.patch(id).set({ isActive }).commit();
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteSubcategory(id: string) {
  await writeClient.delete(id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
  redirect("/admin/categories");
}
