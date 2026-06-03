import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
}

export default async function ShopSubcategoryPage({ params }: PageProps) {
  const { categorySlug, subcategorySlug } = await params;
  redirect(`/shop/${categorySlug}?sub=${subcategorySlug}`);
}
