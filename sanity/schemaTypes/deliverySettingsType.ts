import { CogIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

export const deliverySettingsType = defineType({
  name: "deliverySettings",
  title: "Delivery Settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "freeDeliveryThreshold",
      type: "number",
      description: "Order subtotal above which delivery is free (KSh). Leave blank to disable.",
    }),
    defineField({
      name: "freeDeliveryZones",
      type: "array",
      description: "Zones eligible for free delivery when threshold is met",
      of: [
        {
          type: "reference",
          to: [{ type: "deliveryZone" }],
        },
      ],
    }),
    defineField({
      name: "payOnDeliveryDepositPercent",
      type: "number",
      initialValue: 0,
      description: "% deposit required upfront for pay-on-delivery orders (0 = no deposit required)",
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: "defaultPickupStation",
      type: "reference",
      to: [{ type: "pickupStation" }],
    }),
    defineField({
      name: "deliveryNotice",
      type: "text",
      rows: 3,
      description: "Notice shown at checkout, e.g. 'Orders placed after 4pm ship next business day'",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Delivery Settings" };
    },
  },
});
