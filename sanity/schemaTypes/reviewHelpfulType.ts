import { HeartIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const reviewHelpfulType = defineType({
  name: "reviewHelpful",
  title: "Review Helpful Vote",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({
      name: "review",
      type: "reference",
      to: [{ type: "review" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      customer: "customer.name",
      review: "review._ref",
    },
    prepare({ customer }) {
      return { title: `${customer ?? "Unknown"} — helpful vote` };
    },
  },
});
