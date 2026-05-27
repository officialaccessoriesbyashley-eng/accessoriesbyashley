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
      validation: (rule) => [
        rule.required().error("Category title is required"),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => [
        rule.required().error("Slug is required for URL generation"),
      ],
    }),
    defineField({
      name: "image",
      type: "image",
      options: {
        hotspot: true,
      },
      description: "Category thumbnail image",
    }),
    defineField({
      name: "parent",
      type: "reference",
      to: [{ type: "category" }],
      description: "Optional parent category for sub-categories",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      parentTitle: "parent.title",
    },
    prepare({ title, media, parentTitle }) {
      return {
        title,
        subtitle: parentTitle ? `Sub-category of ${parentTitle}` : undefined,
        media,
      };
    },
  },
});
