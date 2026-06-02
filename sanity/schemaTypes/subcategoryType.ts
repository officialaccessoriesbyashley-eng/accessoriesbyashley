import { TagIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const subcategoryType = defineType({
  name: "subcategory",
  title: "Subcategory",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required().error("Subcategory title is required"),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required for URL generation"),
    }),
    defineField({
      name: "parentCategory",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required().error("Parent category is required"),
      description: "The category this subcategory belongs to",
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      initialValue: 0,
      description: "Lower numbers appear first within the parent category",
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
