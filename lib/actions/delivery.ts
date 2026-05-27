"use server";

import { writeClient } from "@/sanity/lib/client";

export async function patchDeliveryZone(
  id: string,
  data: {
    name?: string;
    baseFee?: number;
    estimatedDelivery?: string;
    description?: string;
    allowPayOnDelivery?: boolean;
    isActive?: boolean;
  }
) {
  await writeClient.patch(id).set(data).commit();
}

export async function createDeliveryZone(data: {
  _id: string;
  name: string;
  zoneNumber: number;
  deliveryType: "pickup" | "delivery" | "courier";
  baseFee: number;
  estimatedDelivery?: string;
  description?: string;
  allowPayOnDelivery: boolean;
  isActive: boolean;
  sortOrder: number;
}) {
  await writeClient.createOrReplace({ ...data, _type: "deliveryZone" });
}

export async function patchDeliveryArea(
  id: string,
  data: {
    name?: string;
    subZone?: string | undefined;
    deliveryFee?: number;
    isActive?: boolean;
    zone?: { _type: "reference"; _ref: string };
  }
) {
  await writeClient.patch(id).set(data).commit();
}

export async function createDeliveryArea(data: {
  _id: string;
  name: string;
  zone: { _type: "reference"; _ref: string };
  subZone?: string;
  deliveryFee: number;
  isActive: boolean;
  sortOrder: number;
}) {
  await writeClient.createOrReplace({ ...data, _type: "deliveryArea" });
}

export async function patchDeliverySettings(
  id: string,
  data: {
    freeDeliveryThreshold?: number;
    payOnDeliveryDepositPercent?: number;
    deliveryNotice?: string;
  }
) {
  await writeClient.patch(id).set(data).commit();
}
