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

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    categoryType,
    subcategoryType,
    customerType,
    productType,
    orderType,
    deliveryZoneType,
    deliveryAreaType,
    pickupStationType,
    deliverySettingsType,
  ],
};
