import { defineQuery } from "next-sanity";

export const ACTIVE_DELIVERY_ZONES_QUERY = defineQuery(`*[
  _type == "deliveryZone"
  && isActive == true
] | order(sortOrder asc, zoneNumber asc) {
  _id,
  name,
  zoneNumber,
  deliveryType,
  baseFee,
  estimatedDelivery,
  allowPayOnDelivery,
  sortOrder
}`);

export const DELIVERY_AREAS_BY_ZONE_QUERY = defineQuery(`*[
  _type == "deliveryArea"
  && zone._ref == $zoneId
  && isActive == true
] | order(sortOrder asc, name asc) {
  _id,
  name,
  subZone,
  deliveryFee,
  sortOrder
}`);

/** All active areas across all zones — used for checkout combobox */
export const ALL_ACTIVE_DELIVERY_AREAS_QUERY = defineQuery(`*[
  _type == "deliveryArea"
  && isActive == true
  && zone->isActive == true
] | order(zone->zoneNumber asc, subZone asc, name asc) {
  _id,
  name,
  subZone,
  deliveryFee,
  "zoneId": zone._ref,
  "zoneName": zone->name,
  "zoneNumber": zone->zoneNumber,
  "allowPayOnDelivery": zone->allowPayOnDelivery,
  "estimatedDelivery": zone->estimatedDelivery
}`);

export const DELIVERY_SETTINGS_QUERY = defineQuery(`*[
  _type == "deliverySettings"
][0] {
  freeDeliveryThreshold,
  freeDeliveryZones[]->{ _id, zoneNumber },
  payOnDeliveryDepositPercent,
  deliveryNotice,
  defaultPickupStation->{
    _id,
    name,
    address,
    landmark,
    operatingHours,
    phone,
    whatsappNumber,
    googleMapsLink
  }
}`);

export const PICKUP_STATION_QUERY = defineQuery(`*[
  _type == "pickupStation"
  && isActive == true
][0] {
  _id,
  name,
  address,
  landmark,
  operatingHours,
  phone,
  whatsappNumber,
  googleMapsLink
}`);

/** Admin: all zones with area count */
export const ADMIN_DELIVERY_ZONES_QUERY = defineQuery(`*[
  _type == "deliveryZone"
] | order(zoneNumber asc) {
  _id,
  name,
  zoneNumber,
  deliveryType,
  baseFee,
  estimatedDelivery,
  allowPayOnDelivery,
  isActive,
  sortOrder,
  "areaCount": count(*[_type == "deliveryArea" && zone._ref == ^._id])
}`);

/** Admin: all areas with zone info */
export const ADMIN_DELIVERY_AREAS_QUERY = defineQuery(`*[
  _type == "deliveryArea"
] | order(zone->zoneNumber asc, subZone asc, name asc) {
  _id,
  name,
  subZone,
  deliveryFee,
  isActive,
  sortOrder,
  "zoneId": zone._ref,
  "zoneName": zone->name,
  "zoneNumber": zone->zoneNumber
}`);

export const DELIVERY_ZONE_BY_ID_QUERY = defineQuery(`*[
  _type == "deliveryZone"
  && _id == $id
][0] {
  _id,
  name,
  zoneNumber,
  deliveryType,
  baseFee,
  estimatedDelivery,
  allowPayOnDelivery,
  isActive,
  sortOrder
}`);

export const DELIVERY_AREA_BY_ID_QUERY = defineQuery(`*[
  _type == "deliveryArea"
  && _id == $id
][0] {
  _id,
  name,
  subZone,
  deliveryFee,
  isActive,
  "zoneId": zone._ref,
  "zoneName": zone->name,
  "zoneNumber": zone->zoneNumber
}`);
