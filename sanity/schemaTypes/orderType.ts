import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import { ORDER_STATUS_SANITY_LIST } from "@/lib/constants/orderStatus";

const DELIVERY_STATUS_LIST = [
  { title: "Pending", value: "pending" },
  { title: "Preparing", value: "preparing" },
  { title: "Ready for Pickup", value: "ready-for-pickup" },
  { title: "Dispatched", value: "dispatched" },
  { title: "Delivered", value: "delivered" },
  { title: "Collected", value: "collected" },
];

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  groups: [
    { name: "details", title: "Order Details", default: true },
    { name: "customer", title: "Customer" },
    { name: "delivery", title: "Delivery" },
    { name: "payment", title: "Payment" },
  ],
  fields: [
    defineField({
      name: "orderNumber",
      type: "string",
      group: "details",
      readOnly: true,
      validation: (rule) => rule.required().error("Order number is required"),
    }),
    defineField({
      name: "items",
      type: "array",
      group: "details",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              type: "reference",
              to: [{ type: "product" }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "quantity",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.required().min(1),
            }),
            defineField({
              name: "priceAtPurchase",
              type: "number",
              description: "Price at time of purchase",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "product.name",
              quantity: "quantity",
              price: "priceAtPurchase",
              media: "product.images.0",
            },
            prepare({ title, quantity, price, media }) {
              return {
                title: title ?? "Product",
                subtitle: `Qty: ${quantity} • KSh ${price}`,
                media,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "total",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Total amount in KES (items + delivery fee)",
    }),
    defineField({
      name: "status",
      type: "string",
      group: "details",
      options: {
        list: ORDER_STATUS_SANITY_LIST,
        layout: "radio",
      },
    }),

    // ── Customer ─────────────────────────────────────────────
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      group: "customer",
    }),
    defineField({
      name: "userId",
      type: "string",
      group: "customer",
      readOnly: true,
    }),
    defineField({
      name: "email",
      type: "string",
      group: "customer",
      readOnly: true,
    }),
    defineField({
      name: "customerPhone",
      type: "string",
      group: "customer",
    }),
    defineField({
      name: "customerWhatsapp",
      type: "string",
      group: "customer",
    }),

    // ── Delivery ─────────────────────────────────────────────
    defineField({
      name: "deliveryMethod",
      type: "string",
      group: "delivery",
      options: {
        list: [
          { title: "Pickup", value: "pickup" },
          { title: "Delivery", value: "delivery" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "deliveryZone",
      type: "reference",
      to: [{ type: "deliveryZone" }],
      group: "delivery",
    }),
    defineField({
      name: "deliveryArea",
      type: "reference",
      to: [{ type: "deliveryArea" }],
      group: "delivery",
      description: "Not required for pickup orders",
    }),
    defineField({
      name: "deliveryFee",
      type: "number",
      group: "delivery",
      description: "Fee at time of order — preserved even if zone prices change later",
    }),
    defineField({
      name: "deliveryAddress",
      type: "object",
      group: "delivery",
      fields: [
        defineField({ name: "directions", type: "text", rows: 2, title: "Directions / How to find you" }),
        defineField({ name: "buildingApartment", type: "string", title: "Building / Apartment" }),
        defineField({ name: "googleMapsLink", type: "url", title: "Google Maps Link" }),
        // Legacy fields — kept for orders created before the redesign
        defineField({ name: "streetAddress", type: "text", rows: 2, hidden: true }),
        defineField({ name: "apartmentBuilding", type: "string", hidden: true }),
        defineField({ name: "additionalDirections", type: "text", rows: 2, hidden: true }),
      ],
    }),
    defineField({
      name: "deliveryStatus",
      type: "string",
      group: "delivery",
      initialValue: "pending",
      options: {
        list: DELIVERY_STATUS_LIST,
        layout: "radio",
      },
    }),
    defineField({
      name: "pickupCollected",
      type: "boolean",
      group: "delivery",
      initialValue: false,
      description: "Mark when customer has collected a pickup order",
    }),

    // ── Payment ──────────────────────────────────────────────
    defineField({
      name: "paymentMethod",
      type: "string",
      group: "payment",
      options: {
        list: [
          { title: "Online (Paystack)", value: "online" },
          { title: "Pay on Delivery", value: "pay-on-delivery" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "stripePaymentId",
      type: "string",
      group: "payment",
      readOnly: true,
      description: "Paystack transaction reference",
    }),
    defineField({
      name: "depositAmount",
      type: "number",
      group: "payment",
      description: "Deposit paid upfront for pay-on-delivery orders",
    }),
    defineField({
      name: "depositPaid",
      type: "boolean",
      group: "payment",
    }),

    // Legacy address field — kept for older orders
    defineField({
      name: "address",
      type: "object",
      group: "delivery",
      hidden: true,
      fields: [
        defineField({ name: "name", type: "string", title: "Full Name" }),
        defineField({ name: "line1", type: "string", title: "Address Line 1" }),
        defineField({ name: "line2", type: "string", title: "Address Line 2" }),
        defineField({ name: "city", type: "string" }),
        defineField({ name: "postcode", type: "string", title: "Postcode" }),
        defineField({ name: "country", type: "string" }),
      ],
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
      orderNumber: "orderNumber",
      email: "email",
      total: "total",
      status: "status",
      deliveryMethod: "deliveryMethod",
    },
    prepare({ orderNumber, email, total, status, deliveryMethod }) {
      return {
        title: `Order ${orderNumber ?? "N/A"}`,
        subtitle: `${email ?? "No email"} • KSh ${total ?? 0} • ${status ?? "paid"}${deliveryMethod ? ` • ${deliveryMethod}` : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
