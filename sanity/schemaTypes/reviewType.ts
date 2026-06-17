import { StarIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

const STATUS_LIST = [
  { title: "Pending", value: "pending" },
  { title: "Approved", value: "approved" },
  { title: "Rejected", value: "rejected" },
  { title: "Flagged by AI", value: "flagged" },
];

export const reviewType = defineType({
  name: "review",
  title: "Review",
  type: "document",
  icon: StarIcon,
  groups: [
    { name: "review", title: "Review", default: true },
    { name: "moderation", title: "Moderation" },
    { name: "meta", title: "Meta" },
  ],
  fields: [
    defineField({
      name: "product",
      type: "reference",
      to: [{ type: "product" }],
      group: "review",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      group: "review",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      type: "reference",
      to: [{ type: "order" }],
      group: "review",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rating",
      type: "number",
      group: "review",
      validation: (rule) => rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: "title",
      type: "string",
      group: "review",
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: "body",
      type: "text",
      group: "review",
      rows: 5,
      validation: (rule) => rule.required().min(10).max(1000),
    }),
    defineField({
      name: "status",
      type: "string",
      group: "moderation",
      initialValue: "pending",
      options: { list: STATUS_LIST, layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rejectionReason",
      type: "string",
      group: "moderation",
      description: "Internal note — not shown to the customer",
    }),
    defineField({
      name: "ownerReply",
      type: "object",
      group: "moderation",
      description: "Ashley's public reply shown below the review",
      fields: [
        defineField({
          name: "body",
          type: "text",
          rows: 4,
          validation: (rule) => rule.required().max(500),
        }),
        defineField({
          name: "repliedAt",
          type: "datetime",
          readOnly: true,
          initialValue: () => new Date().toISOString(),
        }),
      ],
    }),
    defineField({
      name: "isVerifiedPurchase",
      type: "boolean",
      group: "meta",
      initialValue: true,
      readOnly: true,
    }),
    defineField({
      name: "aiSentiment",
      type: "string",
      group: "moderation",
      readOnly: true,
      options: {
        list: [
          { title: "Positive", value: "positive" },
          { title: "Neutral", value: "neutral" },
          { title: "Negative", value: "negative" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "aiSummary",
      type: "string",
      group: "moderation",
      readOnly: true,
      description: "One-line AI-generated summary for quick scanning",
    }),
    defineField({
      name: "aiFlagReason",
      type: "string",
      group: "moderation",
      readOnly: true,
      description: "Why the AI flagged this review (if flagged)",
    }),
    defineField({
      name: "helpfulCount",
      type: "number",
      group: "meta",
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "meta",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "updatedAt",
      type: "datetime",
      group: "meta",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      rating: "rating",
      title: "title",
      body: "body",
      status: "status",
      customer: "customer.name",
      product: "product.name",
    },
    prepare({ rating, title, body, status, customer, product }) {
      const stars = "★".repeat(rating ?? 0) + "☆".repeat(5 - (rating ?? 0));
      return {
        title: `${stars} ${title ?? (body as string | null)?.slice(0, 40) ?? "Review"}`,
        subtitle: `${product ?? "—"} · ${customer ?? "Unknown"} · ${status ?? "pending"}`,
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Pending & Flagged First",
      name: "pendingFirst",
      by: [
        { field: "status", direction: "asc" },
        { field: "createdAt", direction: "desc" },
      ],
    },
  ],
});
