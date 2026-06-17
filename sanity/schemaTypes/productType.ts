import { PackageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { MATERIALS_SANITY_LIST, COLORS_SANITY_LIST } from "@/lib/constants/filters";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "media", title: "Media" },
    { name: "inventory", title: "Inventory" },
    { name: "seo", title: "SEO & Content" },
  ],
  fields: [
    // ── Details ────────────────────────────────────────────────────────────────
    defineField({
      name: "name",
      type: "string",
      group: "details",
      validation: (rule) => [rule.required().error("Product name is required")],
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => [rule.required().error("Slug is required for URL generation")],
    }),
    defineField({
      name: "description",
      type: "text",
      group: "details",
      rows: 4,
      description: "Short product description shown on the product card and page header",
    }),
    defineField({
      name: "price",
      type: "number",
      group: "details",
      description: "Price in KSh",
      validation: (rule) => [
        rule.required().error("Price is required"),
        rule.positive().error("Price must be a positive number"),
      ],
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      group: "details",
      validation: (rule) => [rule.required().error("Category is required")],
    }),
    defineField({
      name: "subcategory",
      type: "reference",
      to: [{ type: "subcategory" }],
      group: "details",
      description: "Optional subcategory for finer filtering",
    }),
    defineField({
      name: "tags",
      type: "array",
      group: "details",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Keywords for search and filtering (e.g. gold, minimalist, gift)",
    }),
    defineField({
      name: "gender",
      type: "string",
      group: "details",
      options: {
        list: [
          { title: "Women", value: "women" },
          { title: "Men", value: "men" },
          { title: "Unisex", value: "unisex" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "material",
      type: "string",
      group: "details",
      options: { list: MATERIALS_SANITY_LIST, layout: "radio" },
    }),
    defineField({
      name: "color",
      type: "string",
      group: "details",
      options: { list: COLORS_SANITY_LIST, layout: "radio" },
    }),
    defineField({
      name: "dimensions",
      type: "string",
      group: "details",
      description: 'e.g., "120cm x 80cm x 75cm"',
    }),

    // ── Media ──────────────────────────────────────────────────────────────────
    defineField({
      name: "images",
      type: "array",
      group: "media",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (rule) => [rule.min(1).error("At least one image is required")],
    }),

    // ── Inventory ──────────────────────────────────────────────────────────────
    defineField({
      name: "stock",
      type: "number",
      group: "inventory",
      initialValue: 0,
      description: "Number of items in stock",
      validation: (rule) => [
        rule.min(0).error("Stock cannot be negative"),
        rule.integer().error("Stock must be a whole number"),
      ],
    }),
    defineField({
      name: "featured",
      type: "boolean",
      group: "inventory",
      initialValue: false,
      description: "Show on homepage and promotions",
    }),
    defineField({
      name: "assemblyRequired",
      type: "boolean",
      group: "inventory",
      initialValue: false,
      description: "Does this product require assembly?",
    }),

    // ── SEO & Content ──────────────────────────────────────────────────────────
    defineField({
      name: "seo",
      title: "SEO",
      type: "seoFields",
      group: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      group: "seo",
      rows: 8,
      description: "AI-generated long-form product description optimised for Google (300–500 words). Shown below the fold on the product page. Different from the short description above.",
    }),
    defineField({
      name: "imageAltTexts",
      title: "Image Alt Texts",
      type: "array",
      group: "seo",
      of: [{
        type: "object",
        fields: [
          defineField({
            name: "altText",
            title: "Alt Text",
            type: "string",
            description: "Descriptive alt text for this image (max 125 characters).",
            validation: (rule) => rule.max(125),
          }),
        ],
        preview: {
          select: { altText: "altText" },
          prepare({ altText }: Record<string, unknown>) {
            return { title: String(altText ?? "No alt text") };
          },
        },
      }],
      description: "AI-generated alt text for each product image, in order. Used for accessibility and image SEO.",
    }),
    defineField({
      name: "socialCaption",
      title: "Social Media Caption",
      type: "text",
      group: "seo",
      rows: 4,
      description: "AI-generated Instagram/WhatsApp caption Ashley can copy-paste when posting this product.",
    }),
    defineField({
      name: "searchTags",
      title: "Search Tags",
      type: "array",
      group: "seo",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "AI-generated search-relevant tags: product attributes, occasions, styles, location terms.",
    }),

    // ── Reviews (computed, do not edit manually) ───────────────────────────────
    defineField({
      name: "reviewStats",
      title: "Review Stats",
      type: "object",
      description: "Auto-computed when reviews are approved or removed — do not edit manually.",
      readOnly: true,
      fields: [
        defineField({ name: "averageRating", type: "number" }),
        defineField({ name: "totalReviews", type: "number" }),
        defineField({
          name: "ratingDistribution",
          type: "object",
          fields: [
            defineField({ name: "five", type: "number", initialValue: 0 }),
            defineField({ name: "four", type: "number", initialValue: 0 }),
            defineField({ name: "three", type: "number", initialValue: 0 }),
            defineField({ name: "two", type: "number", initialValue: 0 }),
            defineField({ name: "one", type: "number", initialValue: 0 }),
          ],
        }),
        defineField({ name: "lastReviewedAt", type: "datetime" }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category.title",
      media: "images.0",
      price: "price",
    },
    prepare({ title, subtitle, media, price }) {
      return {
        title,
        subtitle: `${subtitle ? subtitle + " • " : ""}KSh ${price ?? 0}`,
        media,
      };
    },
  },
});
