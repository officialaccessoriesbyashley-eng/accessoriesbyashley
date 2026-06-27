import { sanityFetch } from "@/sanity/lib/live";
import { ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import { MobileHeader } from "@/components/app/MobileHeader";

export async function MobileNav() {
  const { data: categories } = await sanityFetch({ query: ALL_CATEGORIES_QUERY });
  return <MobileHeader categories={categories} />;
}
