import { createHmac } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";

export async function POST(req: Request) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { error: "PAYSTACK_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }
  if (!process.env.PAYSTACK_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "PAYSTACK_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-paystack-signature header" },
      { status: 400 }
    );
  }

  const hash = createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: PaystackChargeData;
  };

  if (event.event === "charge.success") {
    await handleChargeSuccess(event.data);
  }

  return NextResponse.json({ received: true });
}

interface PaystackChargeData {
  reference: string;
  amount: number;
  currency: string;
  customer: { email: string };
  metadata: {
    userId: string;
    userEmail: string;
    sanityCustomerId?: string;
    productIds: string;
    quantities: string;
    prices: string;
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
}

async function handleChargeSuccess(data: PaystackChargeData) {
  const { reference, amount, customer, metadata } = data;

  try {
    const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
      stripePaymentId: reference,
    });

    if (existingOrder) {
      console.log(`Already processed reference ${reference}, skipping`);
      return;
    }

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
      console.error("Missing metadata in Paystack charge.success event");
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

    console.log(`Order created via webhook: ${order._id} (${orderNumber})`);

    await productIds
      .reduce(
        (tx, productId, i) =>
          tx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
        writeClient.transaction()
      )
      .commit();

    console.log(`Stock updated for ${productIds.length} products`);
  } catch (error) {
    console.error("Error handling charge.success:", error);
    throw error;
  }
}
