import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "seo", title: "SEO & Content" },
  ],
  fields: [
    // ── Details ────────────────────────────────────────────────────────────────
    defineField({
      name: "title",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Category title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required for URL generation"),
    }),
    defineField({
      name: "description",
      type: "text",
      group: "details",
      rows: 2,
      description: "Short description shown on the shop page",
    }),
    defineField({
      name: "icon",
      type: "string",
      group: "details",
      description: "Emoji or icon character (e.g. 💍)",
    }),
    defineField({
      name: "image",
      type: "image",
      group: "details",
      options: { hotspot: true },
      description: "Category thumbnail image",
    }),
    defineField({
      name: "isFeatured",
      type: "boolean",
      group: "details",
      initialValue: false,
      description: "Show on homepage featured categories section",
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      group: "details",
      initialValue: true,
      description: "Inactive categories are hidden from navigation and shop",
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      group: "details",
      initialValue: 0,
      description: "Lower numbers appear first",
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
      rows: 6,
      description: "AI-generated category description for the category page (150–300 words). Targets searches like 'buy [category] in Nairobi'.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      icon: "icon",
      isActive: "isActive",
    },
    prepare({ title, media, icon, isActive }) {
      return {
        title: `${icon ? icon + " " : ""}${title}`,
        subtitle: isActive === false ? "Inactive" : undefined,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
    {
      title: "Title A–Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
});
