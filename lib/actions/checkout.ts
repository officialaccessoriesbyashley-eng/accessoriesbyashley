"use server";

import { auth } from "@/auth";
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

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface DeliveryInfo {
  method: "pickup" | "delivery";
  zoneId?: string;
  areaId?: string;
  deliveryFee: number;
  directions?: string;
  buildingApartment?: string;
  googleMapsLink?: string;
  customerPhone: string;
  customerWhatsapp?: string;
  saveAddress?: boolean;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  orderId?: string;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  session?: {
    id: string;
    customerEmail?: string | null;
    customerName?: string | null;
    amountTotal?: number | null;
    paymentStatus: string;
    deliveryMethod?: string;
    deliveryFee?: number;
    areaName?: string;
    zoneName?: string;
    orderNumber?: string;
  };
  error?: string;
}

export async function createCheckoutSession(
  items: CartItem[],
  delivery: DeliveryInfo
): Promise<CheckoutResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email ?? "";
    const userName = session.user.name ?? userEmail;

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

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

    const sanityCustomerId = await getOrCreateSanityCustomer(
      userEmail,
      userName,
      userId
    );

    const subtotalKobo = validatedItems.reduce(
      (sum, { product, quantity }) =>
        sum + Math.round((product.price ?? 0) * 100) * quantity,
      0
    );
    const deliveryKobo = delivery.deliveryFee * 100;
    const totalKobo = subtotalKobo + deliveryKobo;

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
          userId,
          userEmail,
          sanityCustomerId,
          productIds: validatedItems.map((i) => i.product._id).join(","),
          quantities: validatedItems.map((i) => i.quantity).join(","),
          prices: validatedItems
            .map((i) => (i.product.price ?? 0).toFixed(2))
            .join(","),
          // Delivery metadata
          deliveryMethod: delivery.method,
          deliveryZoneId: delivery.zoneId ?? "",
          deliveryAreaId: delivery.areaId ?? "",
          deliveryFee: String(delivery.deliveryFee),
          deliveryDirections: delivery.directions ?? "",
          deliveryBuilding: delivery.buildingApartment ?? "",
          deliveryGoogleMapsLink: delivery.googleMapsLink ?? "",
          customerPhone: delivery.customerPhone,
          customerWhatsapp: delivery.customerWhatsapp ?? delivery.customerPhone,
          paymentMethod: "online",
        },
      }),
    });

    const data = await response.json();

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack initialization failed:", data);
      return {
        success: false,
        error: "Failed to initialize payment. Please try again.",
      };
    }

    return { success: true, url: data.data.authorization_url };
  } catch (error) {
    console.error("Checkout error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Creates a Pay-on-Delivery order directly in Sanity without a Paystack transaction.
 */
export async function createPayOnDeliveryOrder(
  items: CartItem[],
  delivery: DeliveryInfo
): Promise<CheckoutResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email ?? "";
    const userName = session.user.name ?? userEmail;

    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

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

    const sanityCustomerId = await getOrCreateSanityCustomer(
      userEmail,
      userName,
      userId
    );

    const subtotal = validatedItems.reduce(
      (sum, { product, quantity }) => sum + (product.price ?? 0) * quantity,
      0
    );
    const total = subtotal + delivery.deliveryFee;

    const orderItems = validatedItems.map(({ product, quantity }, index) => ({
      _key: `item-${index}`,
      product: { _type: "reference" as const, _ref: product._id },
      quantity,
      priceAtPurchase: product.price ?? 0,
    }));

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      customer: { _type: "reference", _ref: sanityCustomerId },
      userId,
      email: userEmail,
      customerPhone: delivery.customerPhone,
      customerWhatsapp:
        delivery.customerWhatsapp ?? delivery.customerPhone,
      items: orderItems,
      total,
      status: "pending",
      paymentMethod: "pay-on-delivery",
      deliveryMethod: delivery.method,
      deliveryFee: delivery.deliveryFee,
      ...(delivery.zoneId && {
        deliveryZone: { _type: "reference", _ref: delivery.zoneId },
      }),
      ...(delivery.areaId && {
        deliveryArea: { _type: "reference", _ref: delivery.areaId },
      }),
      deliveryAddress: {
        directions: delivery.directions ?? "",
        buildingApartment: delivery.buildingApartment ?? "",
        googleMapsLink: delivery.googleMapsLink ?? "",
      },
      deliveryStatus: "pending",
      pickupCollected: false,
      createdAt: new Date().toISOString(),
    });

    // Decrement stock
    await validatedItems
      .reduce(
        (trx, { product, quantity }) =>
          trx.patch(product._id, (p) => p.dec({ stock: quantity })),
        writeClient.transaction()
      )
      .commit();

    return { success: true, orderId: order._id };
  } catch (error) {
    console.error("POD order error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function verifyPaystackPayment(
  reference: string
): Promise<VerifyResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const response = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: paystackHeaders() }
    );

    const data = await response.json();

    if (!data.status || data.data?.status !== "success") {
      return { success: false, error: "Payment not successful" };
    }

    const tx = data.data;

    if (tx.metadata?.userId !== userId) {
      return { success: false, error: "Session not found" };
    }

    const orderNumber = await ensureOrderExists(tx);

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
        deliveryMethod: tx.metadata?.deliveryMethod,
        deliveryFee: tx.metadata?.deliveryFee
          ? Number(tx.metadata.deliveryFee)
          : undefined,
        orderNumber,
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
    userId: string;
    userEmail?: string;
    sanityCustomerId?: string;
    productIds?: string;
    quantities?: string;
    prices?: string;
    deliveryMethod?: string;
    deliveryZoneId?: string;
    deliveryAreaId?: string;
    deliveryFee?: string;
    deliveryDirections?: string;
    deliveryBuilding?: string;
    deliveryGoogleMapsLink?: string;
    customerPhone?: string;
    customerWhatsapp?: string;
    paymentMethod?: string;
  };
}): Promise<string | undefined> {
  const { reference, amount, customer, metadata } = tx;

  const existing = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
    stripePaymentId: reference,
  });

  if (existing) return undefined;

  const {
    userId,
    userEmail,
    sanityCustomerId,
    productIds: productIdsString,
    quantities: quantitiesString,
    prices: pricesString,
    deliveryMethod,
    deliveryZoneId,
    deliveryAreaId,
    deliveryFee,
    deliveryDirections,
    deliveryBuilding,
    deliveryGoogleMapsLink,
    customerPhone,
    customerWhatsapp,
  } = metadata;

  if (!userId || !productIdsString || !quantitiesString) {
    console.error("Missing metadata in Paystack transaction:", reference);
    return undefined;
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

  const fee = deliveryFee ? Number(deliveryFee) : 0;

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
    userId,
    email: userEmail ?? customer.email ?? "",
    customerPhone: customerPhone ?? "",
    customerWhatsapp: customerWhatsapp ?? customerPhone ?? "",
    items: orderItems,
    total: amount / 100,
    status: "paid",
    stripePaymentId: reference,
    paymentMethod: "online",
    deliveryMethod: deliveryMethod ?? "delivery",
    deliveryFee: fee,
    ...(deliveryZoneId && {
      deliveryZone: { _type: "reference", _ref: deliveryZoneId },
    }),
    ...(deliveryAreaId && {
      deliveryArea: { _type: "reference", _ref: deliveryAreaId },
    }),
    deliveryAddress: {
      directions: deliveryDirections ?? "",
      buildingApartment: deliveryBuilding ?? "",
      googleMapsLink: deliveryGoogleMapsLink ?? "",
    },
    deliveryStatus: "pending",
    pickupCollected: false,
    createdAt: new Date().toISOString(),
  });

  // Decrement stock
  await productIds
    .reduce(
      (trx, productId, i) =>
        trx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
      writeClient.transaction()
    )
    .commit();

  console.log(`Order created on success page: ${order._id} (${orderNumber})`);
  return orderNumber;
}
