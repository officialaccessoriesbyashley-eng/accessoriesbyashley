import { type SchemaTypeDefinition } from "sanity";

import { categoryType } from "./categoryType";
import { subcategoryType } from "./subcategoryType";
import { customerType } from "./customerType";
import { deliveryAreaType } from "./deliveryAreaType";
import { deliverySettingsType } from "./deliverySettingsType";
import { deliveryZoneType } from "./deliveryZoneType";
import { orderType } from "./orderType";
import { pickupStationType } from "./pickupStationType";
import { productType } from "./productType";
import { seoFieldsType } from "./seoFieldsType";
import { siteSettingsType } from "./siteSettingsType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Reusable object types (must come before document types that reference them)
    seoFieldsType,

    // Document types
    categoryType,
    subcategoryType,
    customerType,
    productType,
    orderType,
    deliveryZoneType,
    deliveryAreaType,
    pickupStationType,
    deliverySettingsType,
    siteSettingsType,
  ],
};
