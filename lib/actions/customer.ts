"use server";

import { client, writeClient } from "@/sanity/lib/client";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/lib/sanity/queries/customers";

/**
 * Gets or creates a Sanity customer record by email.
 * Paystack manages its own customer objects; we only need to persist
 * the record in Sanity for order association.
 */
export async function getOrCreateSanityCustomer(
  email: string,
  name: string,
  clerkUserId: string
): Promise<string> {
  const existing = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, { email });

  if (existing) {
    await writeClient
      .patch(existing._id)
      .set({ clerkUserId, name })
      .commit();
    return existing._id;
  }

  const created = await writeClient.create({
    _type: "customer",
    email,
    name,
    clerkUserId,
    createdAt: new Date().toISOString(),
  });

  return created._id;
}
