import { PinIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const deliveryAreaType = defineType({
  name: "deliveryArea",
  title: "Delivery Area",
  type: "document",
  icon: PinIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "zone",
      type: "reference",
      to: [{ type: "deliveryZone" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subZone",
      type: "string",
      description: "For Zone 3 sub-zones: A - Thika Road, B - Mombasa Road, etc.",
    }),
    defineField({
      name: "deliveryFee",
      type: "number",
      validation: (rule) => rule.required().min(0),
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
    }),
  ],
  preview: {
    select: {
      name: "name",
      zoneName: "zone.name",
      subZone: "subZone",
      deliveryFee: "deliveryFee",
      isActive: "isActive",
    },
    prepare({ name, zoneName, subZone, deliveryFee, isActive }) {
      return {
        title: name,
        subtitle: `${zoneName ?? "—"}${subZone ? ` › ${subZone}` : ""} • KSh ${deliveryFee ?? 0}${isActive === false ? " • Inactive" : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Zone then Name",
      name: "zoneThenName",
      by: [
        { field: "zone.zoneNumber", direction: "asc" },
        { field: "subZone", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
    {
      title: "Name A–Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
});
