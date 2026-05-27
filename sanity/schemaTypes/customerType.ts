import { UserIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const customerType = defineType({
  name: "customer",
  title: "Customer",
  type: "document",
  icon: UserIcon,
  groups: [
    { name: "details", title: "Customer Details", default: true },
    { name: "delivery", title: "Delivery Preferences" },
    { name: "comms", title: "Communication" },
  ],
  fields: [
    defineField({
      name: "email",
      type: "string",
      group: "details",
      validation: (rule) => rule.required().error("Email is required"),
    }),
    defineField({
      name: "name",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "phone",
      type: "string",
      group: "details",
      description: "Primary phone number",
    }),
    defineField({
      name: "whatsappNumber",
      type: "string",
      group: "details",
      description: "WhatsApp number if different from phone",
    }),
    defineField({
      name: "birthday",
      type: "date",
      group: "details",
      options: { dateFormat: "YYYY-MM-DD" },
    }),
    defineField({
      name: "profileImage",
      type: "image",
      group: "details",
      options: { hotspot: true },
    }),
    defineField({
      name: "userId",
      type: "string",
      group: "details",
      description: "NextAuth user ID",
    }),
    defineField({
      name: "defaultDeliveryMethod",
      type: "string",
      group: "delivery",
      initialValue: "delivery",
      options: {
        list: [
          { title: "I usually pick up", value: "pickup" },
          { title: "I usually get delivery", value: "delivery" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "savedAddresses",
      type: "array",
      group: "delivery",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              description: 'e.g. "Home", "Office"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "deliveryArea",
              type: "reference",
              to: [{ type: "deliveryArea" }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "directions",
              type: "text",
              rows: 2,
              title: "Directions / How to find you",
              description: 'e.g. "Blue gate opposite Total station, near Sarit Centre"',
            }),
            defineField({
              name: "buildingApartment",
              type: "string",
              title: "Building / Apartment",
            }),
            defineField({
              name: "googleMapsLink",
              type: "url",
              title: "Google Maps Link",
            }),
            // Legacy fields
            defineField({ name: "streetAddress", type: "text", rows: 2, hidden: true }),
            defineField({ name: "apartmentBuilding", type: "string", hidden: true }),
            defineField({ name: "additionalDirections", type: "text", rows: 2, hidden: true }),
            defineField({
              name: "isDefault",
              type: "boolean",
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              label: "label",
              area: "deliveryArea.name",
              isDefault: "isDefault",
            },
            prepare({ label, area, isDefault }) {
              return {
                title: label,
                subtitle: `${area ?? "No area"}${isDefault ? " • Default" : ""}`,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "whatsappOptInTransactional",
      type: "boolean",
      group: "comms",
      initialValue: true,
      description: "Receive order updates via WhatsApp",
    }),
    defineField({
      name: "whatsappOptInMarketing",
      type: "boolean",
      group: "comms",
      initialValue: false,
      description: "Receive promotions and offers via WhatsApp",
    }),
    defineField({
      name: "emailOptIn",
      type: "boolean",
      group: "comms",
      initialValue: true,
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      email: "email",
      name: "name",
    },
    prepare({ email, name }) {
      return {
        title: name ?? email ?? "Unknown Customer",
        subtitle: name ? email : undefined,
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
      title: "Email A–Z",
      name: "emailAsc",
      by: [{ field: "email", direction: "asc" }],
    },
  ],
});
