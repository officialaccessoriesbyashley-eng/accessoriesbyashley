import { PinIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

const METHOD_LABELS: Record<string, string> = {
  matatu: "Matatu Parcel",
  supermetro: "Supermetro",
  "pickup-mtaani": "Pick up Mtaani",
  bolt: "Bolt Delivery",
  "courier-company": "Courier Company",
  "bus-parcel": "Bus / SGR Parcel",
};

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
      description: "For Zone 3 sub-zones: A – Thika Road, B – Mombasa Road, etc.",
    }),
    defineField({
      name: "deliveryOptions",
      title: "Delivery Options",
      type: "array",
      description: "Add one row per delivery method available for this area with its fee.",
      of: [
        defineArrayMember({
          type: "object",
          name: "deliveryOption",
          fields: [
            defineField({
              name: "method",
              type: "string",
              options: {
                list: [
                  { title: "Matatu Parcel", value: "matatu" },
                  { title: "Supermetro", value: "supermetro" },
                  { title: "Pick up Mtaani", value: "pickup-mtaani" },
                  { title: "Bolt Delivery", value: "bolt" },
                  { title: "Courier Company", value: "courier-company" },
                  { title: "Bus / SGR Parcel", value: "bus-parcel" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "fee",
              title: "Fee (KSh)",
              type: "number",
              validation: (rule) => rule.required().min(0),
            }),
          ],
          preview: {
            select: { method: "method", fee: "fee" },
            prepare({ method, fee }: Record<string, unknown>) {
              return {
                title: METHOD_LABELS[method as string] ?? (method as string),
                subtitle: fee != null ? `KSh ${fee}` : "No fee set",
              };
            },
          },
        }),
      ],
    }),
    // Legacy field — kept so old data isn't lost; not used in checkout logic
    defineField({
      name: "deliveryFee",
      type: "number",
      hidden: true,
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
      deliveryOptions: "deliveryOptions",
      isActive: "isActive",
    },
    prepare({
      name,
      zoneName,
      subZone,
      deliveryOptions,
      isActive,
    }: {
      name: string;
      zoneName?: string;
      subZone?: string;
      deliveryOptions?: { method: string; fee: number }[];
      isActive?: boolean;
    }) {
      const optionsSummary =
        deliveryOptions && deliveryOptions.length > 0
          ? deliveryOptions.map((o) => `${METHOD_LABELS[o.method] ?? o.method} KSh${o.fee}`).join(", ")
          : "No options";
      return {
        title: name,
        subtitle: `${zoneName ?? "—"}${subZone ? ` › ${subZone}` : ""} · ${optionsSummary}${isActive === false ? " · Inactive" : ""}`,
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
