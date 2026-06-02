import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required().error("Category title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required for URL generation"),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      description: "Short description shown on the shop page",
    }),
    defineField({
      name: "icon",
      type: "string",
      description: "Emoji or icon character (e.g. 💍)",
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      description: "Category thumbnail image",
    }),
    defineField({
      name: "isFeatured",
      type: "boolean",
      initialValue: false,
      description: "Show on homepage featured categories section",
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      initialValue: true,
      description: "Inactive categories are hidden from navigation and shop",
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      initialValue: 0,
      description: "Lower numbers appear first",
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
