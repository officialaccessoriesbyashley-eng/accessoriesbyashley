import { CogIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "siteName",
      title: "Site Name",
      type: "string",
      initialValue: "Accessories by Ashley",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "siteDescription",
      title: "Default Meta Description",
      type: "text",
      rows: 3,
      description: "Used on pages that don't have their own meta description",
    }),
    defineField({
      name: "siteUrl",
      title: "Site URL",
      type: "url",
      initialValue: "https://accessoriesbyashley.com",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "defaultOgImage",
      title: "Default Social Share Image",
      type: "image",
      options: { hotspot: true },
      description: "Fallback when a page has no specific social share image",
    }),
    defineField({
      name: "googleSiteVerification",
      title: "Google Site Verification Code",
      type: "string",
      description: "From Google Search Console — the content value of the verification meta tag",
    }),
    defineField({
      name: "organizationSchema",
      title: "Organization Details",
      description: "Used to generate Schema.org Organization structured data",
      type: "object",
      fields: [
        defineField({
          name: "name",
          title: "Organization Name",
          type: "string",
          initialValue: "Accessories by Ashley",
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "logo",
          title: "Logo",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({ name: "phone", title: "Phone", type: "string" }),
        defineField({ name: "email", title: "Email", type: "string" }),
        defineField({ name: "address", title: "Address", type: "text", rows: 2 }),
        defineField({
          name: "socialLinks",
          title: "Social Media Links",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "platform",
                  title: "Platform",
                  type: "string",
                  options: {
                    list: [
                      { title: "Instagram", value: "instagram" },
                      { title: "Facebook", value: "facebook" },
                      { title: "Twitter / X", value: "twitter" },
                      { title: "TikTok", value: "tiktok" },
                    ],
                    layout: "radio",
                    direction: "horizontal",
                  },
                }),
                defineField({ name: "url", title: "URL", type: "url" }),
              ],
              preview: {
                select: { platform: "platform", url: "url" },
                prepare({ platform, url }: Record<string, unknown>) {
                  return { title: String(platform ?? ""), subtitle: String(url ?? "") };
                },
              },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: "seoGlobalKeywords",
      title: "Global SEO Keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Brand-level keywords applied to all pages, e.g. 'accessories by ashley', 'jewelry shop nairobi'",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
