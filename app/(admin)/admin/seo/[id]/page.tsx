import { notFound } from "next/navigation";
import { adminClient } from "@/sanity/lib/client";
import {
  PRODUCT_SEO_EDITOR_QUERY,
  CATEGORY_SEO_EDITOR_QUERY,
} from "@/lib/sanity/queries/seo";
import { SeoEditorClient } from "./SeoEditorClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function SeoEditorPage({ params, searchParams }: PageProps) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);

  const isCategory = type === "category";

  if (isCategory) {
    const cat = await adminClient.fetch(CATEGORY_SEO_EDITOR_QUERY, { id });
    if (!cat) notFound();

    return (
      <SeoEditorClient
        documentId={id}
        documentType="category"
        name={cat.title ?? ""}
        slug={cat.slug ?? ""}
        imageUrl={cat.imageUrl ?? null}
        seo={cat.seo ?? null}
        seoDescription={cat.seoDescription ?? ""}
      />
    );
  }

  const product = await adminClient.fetch(PRODUCT_SEO_EDITOR_QUERY, { id });
  if (!product) notFound();

  return (
    <SeoEditorClient
      documentId={id}
      documentType="product"
      name={product.name ?? ""}
      slug={product.slug ?? ""}
      imageUrl={product.images?.[0]?.asset?.url ?? null}
      images={product.images ?? []}
      seo={product.seo ?? null}
      seoDescription={product.seoDescription ?? ""}
      imageAltTexts={product.imageAltTexts ?? []}
      socialCaption={product.socialCaption ?? ""}
      searchTags={product.searchTags ?? []}
    />
  );
}
