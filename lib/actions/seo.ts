"use server";

import { revalidatePath } from "next/cache";
import { writeClient } from "@/sanity/lib/client";

export interface SeoSaveData {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl: string;
  noIndex: boolean;
  seoDescription: string;
  imageAltTexts?: { _key: string; altText: string }[];
  socialCaption?: string;
  searchTags?: string[];
}

export async function saveSeoFields(
  documentId: string,
  documentType: "product" | "category" | "subcategory",
  data: SeoSaveData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const patch: Record<string, unknown> = {
      "seo.metaTitle": data.metaTitle || null,
      "seo.metaDescription": data.metaDescription || null,
      "seo.ogTitle": data.ogTitle || null,
      "seo.ogDescription": data.ogDescription || null,
      "seo.focusKeyword": data.focusKeyword || null,
      "seo.secondaryKeywords": data.secondaryKeywords,
      "seo.canonicalUrl": data.canonicalUrl || null,
      "seo.noIndex": data.noIndex,
      seoDescription: data.seoDescription || null,
    };

    if (documentType === "product") {
      patch.imageAltTexts = data.imageAltTexts ?? [];
      patch.socialCaption = data.socialCaption || null;
      patch.searchTags = data.searchTags ?? [];
    }

    await writeClient.patch(documentId).set(patch).commit();

    revalidatePath("/admin/seo");
    revalidatePath(`/admin/seo/${documentId}`);

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
