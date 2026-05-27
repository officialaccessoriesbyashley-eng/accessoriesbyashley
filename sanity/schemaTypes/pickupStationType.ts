import { HomeIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const pickupStationType = defineType({
  name: "pickupStation",
  title: "Pickup Station",
  type: "document",
  icon: HomeIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "address",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "landmark",
      type: "string",
      description: "Nearby landmark to help customers find the station",
    }),
    defineField({
      name: "operatingHours",
      type: "string",
      description: 'e.g. "Mon–Sat 9:00 AM – 6:00 PM"',
    }),
    defineField({
      name: "phone",
      type: "string",
    }),
    defineField({
      name: "whatsappNumber",
      type: "string",
      description: "WhatsApp number for pickup coordination",
    }),
    defineField({
      name: "googleMapsLink",
      type: "url",
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      name: "name",
      address: "address",
      isActive: "isActive",
    },
    prepare({ name, address, isActive }) {
      return {
        title: name,
        subtitle: `${address ?? ""}${isActive === false ? " • Inactive" : ""}`,
      };
    },
  },
});
