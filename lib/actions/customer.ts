"use server";

import { auth } from "@/auth";
import { client, writeClient } from "@/sanity/lib/client";
import {
  CUSTOMER_BY_EMAIL_QUERY,
  CUSTOMER_BY_USER_ID_QUERY,
} from "@/lib/sanity/queries/customers";

export async function getOrCreateSanityCustomer(
  email: string,
  name: string,
  userId: string
): Promise<string> {
  const existing = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, { email });

  if (existing) {
    await writeClient.patch(existing._id).set({ userId, name }).commit();
    return existing._id;
  }

  const created = await writeClient.create({
    _type: "customer",
    email,
    name,
    userId,
    createdAt: new Date().toISOString(),
  });

  return created._id;
}

export async function getCustomerProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return client.fetch(CUSTOMER_BY_USER_ID_QUERY, { userId: session.user.id });
}

export async function updateCustomerProfile(data: {
  name?: string;
  phone?: string;
  whatsappNumber?: string;
  birthday?: string;
  defaultDeliveryMethod?: "pickup" | "delivery";
  whatsappOptInTransactional?: boolean;
  whatsappOptInMarketing?: boolean;
  emailOptIn?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const customer = await client.fetch(CUSTOMER_BY_USER_ID_QUERY, {
    userId: session.user.id,
  });
  if (!customer) throw new Error("Customer profile not found");

  await writeClient.patch(customer._id).set(data).commit();
  return { success: true };
}

export async function addSavedAddress(address: {
  label: string;
  deliveryAreaId: string;
  directions?: string;
  buildingApartment?: string;
  googleMapsLink?: string;
  isDefault?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const customer = await client.fetch(CUSTOMER_BY_USER_ID_QUERY, {
    userId: session.user.id,
  });
  if (!customer) throw new Error("Customer profile not found");

  const key = `addr-${Date.now()}`;

  const patch = writeClient.patch(customer._id).append("savedAddresses", [
    {
      _key: key,
      label: address.label,
      deliveryArea: { _type: "reference", _ref: address.deliveryAreaId },
      directions: address.directions ?? "",
      buildingApartment: address.buildingApartment ?? "",
      googleMapsLink: address.googleMapsLink ?? "",
      isDefault: address.isDefault ?? false,
    },
  ]);

  if (address.isDefault) {
    // Unset isDefault on all other addresses first
    const existing = customer.savedAddresses ?? [];
    for (const addr of existing) {
      if (addr.isDefault) {
        await writeClient
          .patch(customer._id)
          .set({ [`savedAddresses[_key=="${addr._key}"].isDefault`]: false })
          .commit();
      }
    }
  }

  await patch.commit();
  return { success: true, key };
}

export async function updateSavedAddress(
  key: string,
  data: {
    label?: string;
    deliveryAreaId?: string;
    directions?: string;
    buildingApartment?: string;
    googleMapsLink?: string;
    isDefault?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const customer = await client.fetch(CUSTOMER_BY_USER_ID_QUERY, {
    userId: session.user.id,
  });
  if (!customer) throw new Error("Customer profile not found");

  const patch: Record<string, unknown> = {};
  if (data.label !== undefined)
    patch[`savedAddresses[_key=="${key}"].label`] = data.label;
  if (data.deliveryAreaId !== undefined)
    patch[`savedAddresses[_key=="${key}"].deliveryArea`] = {
      _type: "reference",
      _ref: data.deliveryAreaId,
    };
  if (data.directions !== undefined)
    patch[`savedAddresses[_key=="${key}"].directions`] = data.directions;
  if (data.buildingApartment !== undefined)
    patch[`savedAddresses[_key=="${key}"].buildingApartment`] = data.buildingApartment;
  if (data.googleMapsLink !== undefined)
    patch[`savedAddresses[_key=="${key}"].googleMapsLink`] = data.googleMapsLink;
  if (data.isDefault !== undefined) {
    patch[`savedAddresses[_key=="${key}"].isDefault`] = data.isDefault;
    if (data.isDefault) {
      for (const addr of customer.savedAddresses ?? []) {
        if (addr._key !== key && addr.isDefault) {
          patch[`savedAddresses[_key=="${addr._key}"].isDefault`] = false;
        }
      }
    }
  }

  await writeClient.patch(customer._id).set(patch).commit();
  return { success: true };
}

export async function deleteSavedAddress(key: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const customer = await client.fetch(CUSTOMER_BY_USER_ID_QUERY, {
    userId: session.user.id,
  });
  if (!customer) throw new Error("Customer profile not found");

  await writeClient
    .patch(customer._id)
    .unset([`savedAddresses[_key=="${key}"]`])
    .commit();

  return { success: true };
}
