import { defineQuery } from "next-sanity";

// ── Shared projections ────────────────────────────────────────────────────────

const SEO_FIELDS_PROJECTION = `seo {
  metaTitle,
  metaDescription,
  ogTitle,
  ogDescription,
  "ogImageUrl": ogImage.asset->url,
  focusKeyword,
  secondaryKeywords,
  canonicalUrl,
  noIndex,
  seoScore,
  lastSeoGeneration,
  aiGenerated
}`;

// ── Site Settings ─────────────────────────────────────────────────────────────

export const SITE_SETTINGS_QUERY = defineQuery(`*[
  _type == "siteSettings"
][0] {
  siteName,
  siteDescription,
  siteUrl,
  "defaultOgImageUrl": defaultOgImage.asset->url,
  googleSiteVerification,
  organizationSchema {
    name,
    description,
    "logoUrl": logo.asset->url,
    phone,
    email,
    address,
    socialLinks[]{ platform, url }
  },
  seoGlobalKeywords
}`);

// ── Sitemap queries ───────────────────────────────────────────────────────────

export const SITEMAP_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && !coalesce(seo.noIndex, false)
] | order(name asc) {
  "slug": slug.current,
  _updatedAt
}`);

export const SITEMAP_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && isActive != false
] | order(sortOrder asc) {
  "slug": slug.current,
  _updatedAt
}`);

export const SITEMAP_SUBCATEGORIES_QUERY = defineQuery(`*[
  _type == "subcategory"
  && isActive != false
] | order(sortOrder asc) {
  "slug": slug.current,
  "parentSlug": parentCategory->slug.current,
  _updatedAt
}`);

// ── generateMetadata queries ──────────────────────────────────────────────────

/** Slim product query for generateMetadata — only SEO-relevant fields */
export const PRODUCT_META_QUERY = defineQuery(`*[
  _type == "product"
  && slug.current == $slug
][0] {
  name,
  "slug": slug.current,
  description,
  price,
  "firstImageUrl": images[0].asset->url,
  ${SEO_FIELDS_PROJECTION}
}`);

/** Slim category query for generateMetadata */
export const CATEGORY_META_QUERY = defineQuery(`*[
  _type == "category"
  && slug.current == $slug
][0] {
  title,
  "slug": slug.current,
  description,
  "imageUrl": image.asset->url,
  ${SEO_FIELDS_PROJECTION}
}`);

// ── Admin SEO overview queries ────────────────────────────────────────────────

/** All products with SEO status — used in admin SEO table */
export const ADMIN_SEO_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
] | order(coalesce(seo.seoScore, -1) asc, name asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  seo {
    metaTitle,
    metaDescription,
    focusKeyword,
    seoScore,
    lastSeoGeneration,
    aiGenerated,
    noIndex
  },
  defined(seoDescription) && string::length(seoDescription) > 50,
  "hasSeoDescription": defined(seoDescription) && string::length(seoDescription) > 50,
  "imageCount": count(images),
  "altTextCount": count(imageAltTexts),
  hasSocialCaption,
  "hasSocialCaption": defined(socialCaption),
  category->{ title },
  "imageUrl": images[0].asset->url
}`);

/** All categories with SEO status */
export const ADMIN_SEO_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
] | order(sortOrder asc) {
  _id,
  title,
  "slug": slug.current,
  seo {
    metaTitle,
    metaDescription,
    focusKeyword,
    seoScore,
    lastSeoGeneration,
    aiGenerated
  },
  "hasSeoDescription": defined(seoDescription) && string::length(seoDescription) > 30,
  "imageUrl": image.asset->url
}`);

/** Full product SEO data for the SEO editor page */
export const PRODUCT_SEO_EDITOR_QUERY = defineQuery(`*[
  _type == "product"
  && _id == $id
][0] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  material,
  color,
  tags,
  category->{ _id, title, "slug": slug.current },
  subcategory->{ _id, title, "slug": slug.current },
  "images": images[]{ _key, asset->{ _id, url } },
  seo {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    "ogImageUrl": ogImage.asset->url,
    focusKeyword,
    secondaryKeywords,
    canonicalUrl,
    noIndex,
    seoScore,
    lastSeoGeneration,
    aiGenerated
  },
  seoDescription,
  imageAltTexts[]{ _key, altText },
  socialCaption,
  searchTags
}`);

/** Full category SEO data for the SEO editor page */
export const CATEGORY_SEO_EDITOR_QUERY = defineQuery(`*[
  _type == "category"
  && _id == $id
][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  "imageUrl": image.asset->url,
  seo {
    metaTitle,
    metaDescription,
    ogTitle,
    ogDescription,
    focusKeyword,
    secondaryKeywords,
    canonicalUrl,
    noIndex,
    seoScore,
    lastSeoGeneration,
    aiGenerated
  },
  seoDescription
}`);

/** SEO health overview stats for admin dashboard widget */
export const SEO_HEALTH_STATS_QUERY = defineQuery(`{
  "totalProducts": count(*[_type == "product"]),
  "productsWithSeo": count(*[_type == "product" && defined(seo.metaTitle)]),
  "productsWithGoodScore": count(*[_type == "product" && coalesce(seo.seoScore, 0) >= 60]),
  "productsMissingSeo": count(*[_type == "product" && !defined(seo.metaTitle)]),
  "productsMissingAltText": count(*[_type == "product" && count(images) > count(imageAltTexts)]),
  "totalCategories": count(*[_type == "category"]),
  "categoriesWithSeo": count(*[_type == "category" && defined(seo.metaTitle)])
}`);

/** Document data needed to build AI generation prompt — product */
export const PRODUCT_FOR_AI_QUERY = defineQuery(`*[
  _type == "product"
  && _id == $id
][0] {
  _id,
  name,
  description,
  price,
  material,
  color,
  tags,
  dimensions,
  gender,
  stock,
  category->{ title },
  subcategory->{ title },
  "imageCount": count(images),
  seo { aiGenerated }
}`);

/** Document data needed to build AI generation prompt — category */
export const CATEGORY_FOR_AI_QUERY = defineQuery(`*[
  _type == "category"
  && _id == $id
][0] {
  _id,
  title,
  description,
  "productCount": count(*[_type == "product" && category._ref == ^._id]),
  seo { aiGenerated }
}`);

/** Document data needed to build AI generation prompt — subcategory */
export const SUBCATEGORY_FOR_AI_QUERY = defineQuery(`*[
  _type == "subcategory"
  && _id == $id
][0] {
  _id,
  title,
  description,
  parentCategory->{ title },
  "productCount": count(*[_type == "product" && subcategory._ref == ^._id]),
  seo { aiGenerated }
}`);
