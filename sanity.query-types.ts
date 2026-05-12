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

/** Result type for PRODUCT_BY_SLUG_QUERY — null when no product matches */
export type PRODUCT_BY_SLUG_QUERYResult = {
  _id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  images: Array<{
    _key: string;
    asset: { _id: string; url: string | null } | null;
    hotspot: SanityImageHotspot | null;
  }> | null;
  category: { _id: string; title: string | null; slug: string | null } | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  stock: number | null;
  featured: boolean | null;
  assemblyRequired: boolean | null;
} | null;

// ============================================
// lib/sanity/queries/orders.ts
// ============================================

/** Result type for ORDERS_BY_USER_QUERY */
export type ORDERS_BY_USER_QUERYResult = Array<{
  _id: string;
  orderNumber: string | null;
  total: number | null;
  status: "paid" | "shipped" | "delivered" | "cancelled" | null;
  createdAt: string | null;
  itemCount: number | null;
  itemNames: Array<string | null> | null;
  itemImages: Array<string | null> | null;
}>;

/** Result type for ORDER_BY_ID_QUERY — null when no order matches */
export type ORDER_BY_ID_QUERYResult = {
  _id: string;
  orderNumber: string | null;
  clerkUserId: string | null;
  email: string | null;
  items: Array<{
    _key: string;
    quantity: number | null;
    priceAtPurchase: number | null;
    product: {
      _id: string;
      name: string | null;
      slug: string | null;
      image: {
        asset: { _id: string; url: string | null } | null;
      } | null;
    } | null;
  }> | null;
  total: number | null;
  status: "paid" | "shipped" | "delivered" | "cancelled" | null;
  address: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
  } | null;
  stripePaymentId: string | null;
  createdAt: string | null;
} | null;

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

// lib/ai/tools/search-products.ts
/** Result type for AI_SEARCH_PRODUCTS_QUERY */
export type AI_SEARCH_PRODUCTS_QUERYResult = Array<{
  _id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  image: {
    asset: {
      _id: string;
      url: string;
    } | null;
  } | null;
  category: {
    _id: string;
    title: string | null;
    slug: string | null;
  } | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  stock: number | null;
  featured: boolean | null;
  assemblyRequired: boolean | null;
}>;
