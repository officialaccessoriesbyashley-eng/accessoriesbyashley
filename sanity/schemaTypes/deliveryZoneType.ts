import { PackageIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const deliveryZoneType = defineType({
  name: "deliveryZone",
  title: "Delivery Zone",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details", title: "Zone Details", default: true },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      group: "details",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "name" },
    }),
    defineField({
      name: "description",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "zoneNumber",
      type: "number",
      group: "details",
      description: "0 = Pickup, 1–5 = Delivery zones",
      validation: (rule) => rule.required().min(0).max(5),
    }),
    defineField({
      name: "deliveryType",
      type: "string",
      group: "details",
      options: {
        list: [
          { title: "Pickup", value: "pickup" },
          { title: "Delivery", value: "delivery" },
          { title: "Courier", value: "courier" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "baseFee",
      type: "number",
      group: "details",
      description: "Starting fee for this zone (shown as 'from KSh X')",
      initialValue: 0,
    }),
    defineField({
      name: "estimatedDelivery",
      type: "string",
      group: "details",
      description: 'e.g. "Same day", "1–2 business days"',
    }),
    defineField({
      name: "allowPayOnDelivery",
      type: "boolean",
      group: "settings",
      initialValue: false,
      description: "Allow customers to pay cash/M-Pesa on delivery",
    }),
    defineField({
      name: "isActive",
      type: "boolean",
      group: "settings",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      group: "settings",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      name: "name",
      zoneNumber: "zoneNumber",
      deliveryType: "deliveryType",
      baseFee: "baseFee",
      isActive: "isActive",
    },
    prepare({ name, zoneNumber, deliveryType, baseFee, isActive }) {
      return {
        title: `Zone ${zoneNumber}: ${name}`,
        subtitle: `${deliveryType ?? "—"} • from KSh ${baseFee ?? 0}${isActive === false ? " • Inactive" : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Zone Number",
      name: "zoneNumberAsc",
      by: [{ field: "zoneNumber", direction: "asc" }],
    },
  ],
});
