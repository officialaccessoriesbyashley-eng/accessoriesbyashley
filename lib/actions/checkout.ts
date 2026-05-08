"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { client, writeClient } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";
import { getOrCreateSanityCustomer } from "@/lib/actions/customer";

const PAYSTACK_API = "https://api.paystack.co";

function paystackHeaders() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not defined");
  }
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface PaystackSession {
  id: string;
  customerEmail?: string | null;
  customerName?: string | null;
  amountTotal?: number | null;
  paymentStatus: string;
  lineItems?: {
    name?: string | null;
    quantity?: number | null;
    amount: number;
  }[];
}

interface VerifyResult {
  success: boolean;
  session?: PaystackSession;
  error?: string;
}

/**
 * Initializes a Paystack transaction from cart items.
 * Validates stock and prices against Sanity before creating the session.
 */
export async function createCheckoutSession(
  items: CartItem[]
): Promise<CheckoutResult> {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // Validate stock and prices against Sanity
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    const validationErrors: string[] = [];
    const validatedItems: {
      product: (typeof products)[number];
      quantity: number;
    }[] = [];

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId
      );
      if (!product) {
        validationErrors.push(`"${item.name}" is no longer available`);
        continue;
      }
      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }
      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`
        );
        continue;
      }
      validatedItems.push({ product, quantity: item.quantity });
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    const sanityCustomerId = await getOrCreateSanityCustomer(
      userEmail,
      userName,
      userId
    );

    // Paystack amounts are in the lowest denomination (KES kobo = KES × 100)
    const totalKobo = validatedItems.reduce(
      (sum, { product, quantity }) =>
        sum + Math.round((product.price ?? 0) * 100) * quantity,
      0
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3001";

    const reference = `order_${userId}_${Date.now()}`;

    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: paystackHeaders(),
      body: JSON.stringify({
        email: userEmail,
        amount: totalKobo,
        currency: "KES",
        reference,
        callback_url: `${baseUrl}/checkout/success`,
        metadata: {
          clerkUserId: userId,
          userEmail,
          sanityCustomerId,
          productIds: validatedItems.map((i) => i.product._id).join(","),
          quantities: validatedItems.map((i) => i.quantity).join(","),
          // per-unit prices in KES, used by webhook for priceAtPurchase
          prices: validatedItems
            .map((i) => (i.product.price ?? 0).toFixed(2))
            .join(","),
        },
      }),
    });

    const data = await response.json();

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack initialization failed:", data);
      return { success: false, error: "Failed to initialize payment. Please try again." };
    }

    return { success: true, url: data.data.authorization_url };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Verifies a Paystack payment and creates the Sanity order if it doesn't exist yet.
 * This is the primary order creation path — the webhook is a reliability backup.
 */
export async function verifyPaystackPayment(
  reference: string
): Promise<VerifyResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: paystackHeaders() }
    );

    const data = await response.json();

    if (!data.status || data.data?.status !== "success") {
      return { success: false, error: "Payment not successful" };
    }

    const tx = data.data;

    if (tx.metadata?.clerkUserId !== userId) {
      return { success: false, error: "Session not found" };
    }

    // Create the order if it doesn't already exist (idempotent — webhook may also create it)
    await ensureOrderExists(tx);

    const customerName =
      [tx.customer?.first_name, tx.customer?.last_name]
        .filter(Boolean)
        .join(" ") || tx.customer?.email;

    return {
      success: true,
      session: {
        id: tx.reference,
        customerEmail: tx.customer?.email,
        customerName,
        amountTotal: tx.amount,
        paymentStatus: tx.status,
        lineItems: [],
      },
    };
  } catch (error) {
    console.error("Verify payment error:", error);
    return { success: false, error: "Could not verify payment" };
  }
}

async function ensureOrderExists(tx: {
  reference: string;
  amount: number;
  customer: { email: string };
  metadata: {
    clerkUserId: string;
    userEmail?: string;
    sanityCustomerId?: string;
    productIds?: string;
    quantities?: string;
    prices?: string;
  };
}) {
  const { reference, amount, customer, metadata } = tx;

  const existing = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
    stripePaymentId: reference,
  });

  if (existing) return; // already created by webhook or previous visit

  const {
    clerkUserId,
    userEmail,
    sanityCustomerId,
    productIds: productIdsString,
    quantities: quantitiesString,
    prices: pricesString,
  } = metadata;

  if (!clerkUserId || !productIdsString || !quantitiesString) {
    console.error("Missing metadata in Paystack transaction:", reference);
    return;
  }

  const productIds = productIdsString.split(",");
  const quantities = quantitiesString.split(",").map(Number);
  const prices = pricesString
    ? pricesString.split(",").map(Number)
    : productIds.map(() => amount / 100 / productIds.length);

  const orderItems = productIds.map((productId, index) => ({
    _key: `item-${index}`,
    product: { _type: "reference" as const, _ref: productId },
    quantity: quantities[index],
    priceAtPurchase: prices[index] ?? 0,
  }));

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  const order = await writeClient.create({
    _type: "order",
    orderNumber,
    ...(sanityCustomerId && {
      customer: { _type: "reference", _ref: sanityCustomerId },
    }),
    clerkUserId,
    email: userEmail ?? customer.email ?? "",
    items: orderItems,
    total: amount / 100,
    status: "paid",
    stripePaymentId: reference,
    createdAt: new Date().toISOString(),
  });

  console.log(`Order created on success page: ${order._id} (${orderNumber})`);

  // Decrement stock
  await productIds
    .reduce(
      (trx, productId, i) =>
        trx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
      writeClient.transaction()
    )
    .commit();
}
