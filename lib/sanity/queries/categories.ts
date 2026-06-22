import { defineQuery } from "next-sanity";

const SUBCATEGORY_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`;

/**
 * Navigation categories — active only, with subcategories that have products, ordered by sortOrder
 * Used in header mega-menu and mobile drawer
 */
export const NAV_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && isActive != false
  && count(*[_type == "subcategory" && parentCategory._ref == ^._id && isActive != false && count(*[_type == "product" && subcategory._ref == ^._id]) > 0]) > 0
] | order(sortOrder asc) {
  _id,
  title,
  "slug": slug.current,
  icon,
  "subcategories": *[
    _type == "subcategory"
    && parentCategory._ref == ^._id
    && isActive != false
    && count(*[_type == "product" && subcategory._ref == ^._id]) > 0
  ] | order(sortOrder asc) ${SUBCATEGORY_PROJECTION}
}`);

/**
 * Featured categories for homepage
 */
export const FEATURED_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && isActive != false
  && isFeatured == true
] | order(sortOrder asc) {
  _id,
  title,
  "slug": slug.current,
  icon,
  description,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`);

/**
 * Single category with its subcategories by slug — only subcategories that have products
 * Used on shop category pages
 */
export const CATEGORY_WITH_SUBCATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && slug.current == $slug
  && isActive != false
][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  icon,
  "image": image{
    asset->{ _id, url },
    hotspot
  },
  "subcategories": *[
    _type == "subcategory"
    && parentCategory._ref == ^._id
    && isActive != false
    && count(*[_type == "product" && subcategory._ref == ^._id]) > 0
  ] | order(sortOrder asc) ${SUBCATEGORY_PROJECTION}
}`);

/**
 * Single subcategory with its parent category by slug
 * Used on shop subcategory pages
 */
export const SUBCATEGORY_WITH_PARENT_QUERY = defineQuery(`*[
  _type == "subcategory"
  && slug.current == $subcategorySlug
  && isActive != false
][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  "parentCategory": parentCategory->{
    _id,
    title,
    "slug": slug.current,
    icon
  }
}`);

/**
 * Active categories that have at least one subcategory with products — for category tiles
 * Ordered by sortOrder
 */
export const ALL_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && isActive != false
  && count(*[_type == "subcategory" && parentCategory._ref == ^._id && isActive != false && count(*[_type == "product" && subcategory._ref == ^._id]) > 0]) > 0
] | order(sortOrder asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  icon,
  isActive,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`);

/**
 * Homepage category sections — each category with its latest 6 products
 */
export const HOMEPAGE_CATEGORY_SECTIONS_QUERY = defineQuery(`*[
  _type == "category"
  && isActive != false
  && count(*[_type == "product" && category._ref == ^._id && stock > 0]) > 0
] | order(sortOrder asc, title asc) {
  _id,
  title,
  "slug": slug.current,
  icon,
  "products": *[
    _type == "product"
    && category._ref == ^._id
  ] | order(_createdAt desc) [0...6] {
    _id,
    name,
    "slug": slug.current,
    price,
    stock,
    "images": images[0...2]{
      _key,
      asset->{ _id, url }
    },
    category->{
      _id,
      title,
      "slug": slug.current
    }
  }
}`);

/**
 * Get category by slug (admin / legacy)
 */
export const CATEGORY_BY_SLUG_QUERY = defineQuery(`*[
  _type == "category"
  && slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  "image": image{
    asset->{ _id, url },
    hotspot
  }
}`);
