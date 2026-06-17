import { NextResponse } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { gateway } from "ai";
import { auth } from "@/auth";
import { client, writeClient } from "@/sanity/lib/client";
import { canReviewProduct } from "@/lib/actions/reviews";

const requestSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(10).max(1000),
});

const moderationSchema = z.object({
  shouldFlag: z.boolean().describe("True only if the review has a genuine problem needing human review"),
  flagReason: z.string().optional().describe("Brief reason if flagged"),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  summary: z.string().describe("One-line summary of the review, max 100 chars"),
});

function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, orderId, rating, title, body: reviewBody } = parsed.data;

  // Look up the Sanity customer document from the NextAuth user
  const customer = await client.fetch<{ _id: string } | null>(
    `*[_type == "customer" && userId == $userId][0]{ _id }`,
    { userId: (session.user as { id?: string }).id ?? session.user.email },
  );

  if (!customer) {
    return NextResponse.json({ error: "Customer record not found" }, { status: 403 });
  }

  const customerId = customer._id;
  const authUserId = (session.user as { id?: string }).id ?? session.user.email;

  // Verified purchase check
  const eligibility = await canReviewProduct(customerId, productId, authUserId);
  if (!eligibility.canReview) {
    const messages: Record<string, string> = {
      not_purchased: "You have not purchased this product.",
      not_delivered: "You can review once your order has been delivered.",
      already_reviewed: "You have already submitted a review for this product.",
    };
    return NextResponse.json(
      { error: messages[eligibility.reason] ?? "Cannot review" },
      { status: 403 },
    );
  }

  // Sanitize inputs
  const cleanTitle = title ? sanitize(title) : undefined;
  const cleanBody = sanitize(reviewBody);

  // Fetch product name for AI prompt
  const product = await client.fetch<{ name: string } | null>(
    `*[_type == "product" && _id == $id][0]{ name }`,
    { id: productId },
  );

  // Create review document (initially pending)
  const now = new Date().toISOString();
  const reviewDoc = await writeClient.create({
    _type: "review",
    product: { _type: "reference", _ref: productId },
    customer: { _type: "reference", _ref: customerId },
    order: { _type: "reference", _ref: orderId },
    rating,
    title: cleanTitle ?? null,
    body: cleanBody,
    status: "pending",
    isVerifiedPurchase: true,
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  // AI moderation — run in the background and update the doc
  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.5"),
      system: `You are a review moderator for "Accessories by Ashley", an online jewellery and accessories shop in Nairobi, Kenya. Analyse the review for issues. Be lenient — most reviews are genuine. Only flag if there's a real problem.`,
      prompt: `Analyse this product review:

Product: ${product?.name ?? "Unknown product"}
Rating: ${rating}/5
Title: ${cleanTitle ?? "None"}
Body: ${cleanBody}

Check for: spam or promotional content, offensive language, fake/suspicious patterns, PII (phone numbers, addresses), competitor mentions or defamation.

Determine the sentiment and generate a one-line summary (max 100 chars).`,
      schema: moderationSchema,
    });

    const moderation = result.object;

    await writeClient.patch(reviewDoc._id).set({
      status: moderation.shouldFlag ? "flagged" : "pending",
      aiSentiment: moderation.sentiment,
      aiSummary: moderation.summary,
      aiFlagReason: moderation.flagReason ?? null,
    }).commit();
  } catch {
    // AI moderation failure is non-fatal — review stays pending for manual review
  }

  return NextResponse.json({
    success: true,
    reviewId: reviewDoc._id,
    message: "Thank you for your review! It will appear on the product page after approval.",
  });
}
