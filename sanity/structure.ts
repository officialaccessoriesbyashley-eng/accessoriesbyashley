import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // Storefront content
      S.documentTypeListItem("product").title("Products"),
      S.documentTypeListItem("category").title("Categories"),

      S.divider(),

      // Orders & Customers
      S.documentTypeListItem("order").title("Orders"),
      S.documentTypeListItem("customer").title("Customers"),

      S.divider(),

      // Delivery
      S.documentTypeListItem("deliveryZone").title("Delivery Zones"),
      S.documentTypeListItem("deliveryArea").title("Delivery Areas"),
      S.documentTypeListItem("pickupStation").title("Pickup Stations"),

      // Delivery Settings singleton
      S.listItem()
        .title("Delivery Settings")
        .id("deliverySettings")
        .child(
          S.document()
            .schemaType("deliverySettings")
            .documentId("deliverySettings")
        ),
    ]);
