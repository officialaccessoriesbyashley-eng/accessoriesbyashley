import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const subcategoryType = defineType({
  name: "subcategory",
  title: "Subcategory",
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
      validation: (rule) => rule.required().error("Subcategory title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required for URL generation"),
    }),
    defineField({
      name: "parentCategory",
      type: "reference",
      group: "details",
      to: [{ type: "category" }],
      validation: (rule) => rule.required().error("Parent category is required"),
      description: "The category this subcategory belongs to",
    }),
    defineField({
      name: "description",
      type: "text",
      group: "details",
      rows: 2,
    }),
    defineField({
      name: "image",
      type: "image",
      group: "details",
      options: { hotspot: true },
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      group: "details",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      group: "details",
      initialValue: 0,
      description: "Lower numbers appear first within the parent category",
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
      rows: 5,
      description: "AI-generated subcategory description (100–200 words). More specific than the category description.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      parentTitle: "parentCategory.title",
      media: "image",
      isActive: "isActive",
    },
    prepare({ title, parentTitle, media, isActive }) {
      return {
        title,
        subtitle: `${parentTitle ?? "No parent"}${isActive === false ? " • Inactive" : ""}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Parent Category then Sort Order",
      name: "parentSortAsc",
      by: [
        { field: "parentCategory.title", direction: "asc" },
        { field: "sortOrder", direction: "asc" },
      ],
    },
  ],
});
