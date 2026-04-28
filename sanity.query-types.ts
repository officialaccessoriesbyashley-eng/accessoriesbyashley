/**
 * ---------------------------------------------------------------------------------
 * Manually defined query result types.
 *
 * Sanity typegen can't statically analyse queries that use template literal
 * interpolation (e.g. shared filter fragments). These types mirror the GROQ
 * projections and are kept here so `sanity typegen generate` doesn't overwrite them.
 * ---------------------------------------------------------------------------------
 */

import type { SanityImageHotspot } from "./sanity.types";

// ============================================
// lib/sanity/queries/categories.ts
// ============================================

/** Result type for ALL_CATEGORIES_QUERY */
export type ALL_CATEGORIES_QUERYResult = Array<{
  _id: string;
  title: string | null;
  slug: string | null;
  image: {
    asset: {
      _id: string;
      url: string | null;
    } | null;
    hotspot: SanityImageHotspot | null;
  } | null;
}>;

// ============================================
// lib/sanity/queries/products.ts
// ============================================

/** Shared image shape used in filtered product queries (images[0...4]) */
type ProductImage = {
  _key: string;
  asset: {
    _id: string;
    url: string | null;
  } | null;
};

/** Shared category reference shape */
type ProductCategory = {
  _id: string;
  title: string | null;
  slug: string | null;
};

/**
 * Result type for FILTER_PRODUCTS_BY_NAME_QUERY
 * (also covers FILTER_PRODUCTS_BY_PRICE_ASC/DESC and RELEVANCE queries –
 *  they share the same projection)
 */
export type FILTER_PRODUCTS_BY_NAME_QUERYResult = Array<{
  _id: string;
  name: string | null;
  slug: string | null;
  price: number | null;
  images: Array<ProductImage> | null;
  category: ProductCategory | null;
  material: string | null;
  color: string | null;
  stock: number | null;
}>;

/** Result type for FEATURED_PRODUCTS_QUERY */
export type FEATURED_PRODUCTS_QUERYResult = Array<{
  _id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  images: Array<
    ProductImage & {
      hotspot: SanityImageHotspot | null;
    }
  > | null;
  category: ProductCategory | null;
  stock: number | null;
}>;
