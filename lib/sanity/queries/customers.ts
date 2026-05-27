import { defineQuery } from "next-sanity";

export const CUSTOMER_BY_EMAIL_QUERY = defineQuery(`*[
  _type == "customer"
  && email == $email
][0]{
  _id,
  email,
  name,
  userId,
  createdAt
}`);

export const CUSTOMER_BY_USER_ID_QUERY = defineQuery(`*[
  _type == "customer"
  && userId == $userId
][0]{
  _id,
  email,
  name,
  phone,
  whatsappNumber,
  birthday,
  "profileImageUrl": profileImage.asset->url,
  defaultDeliveryMethod,
  savedAddresses[]{
    _key,
    label,
    directions,
    buildingApartment,
    googleMapsLink,
    isDefault,
    deliveryArea->{
      _id,
      name,
      subZone,
      deliveryFee,
      "zoneId": zone._ref,
      "zoneName": zone->name,
      "zoneNumber": zone->zoneNumber
    }
  },
  whatsappOptInTransactional,
  whatsappOptInMarketing,
  emailOptIn,
  createdAt
}`);
