"use server";

import { NextResponse } from "next/server";
import { gateway, generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { client, writeClient } from "@/sanity/lib/client";
import {
  PRODUCT_FOR_AI_QUERY,
  CATEGORY_FOR_AI_QUERY,
  SUBCATEGORY_FOR_AI_QUERY,
} from "@/lib/sanity/queries/seo";

// ── Request validation ────────────────────────────────────────────────────────

const requestSchema = z.object({
  documentType: z.enum(["product", "category", "subcategory"]),
  documentId: z.string().min(1),
  regenerate: z.boolean().optional().default(false),
});

// ── SEO output schemas ────────────────────────────────────────────────────────

const productSeoSchema = z.object({
  metaTitle: z.string().describe("Max 60 chars. Format: [Product Name] - [Key Feature] | Accessories by Ashley"),
  metaDescription: z.string().describe("Max 160 chars. Compelling Google snippet including KES price and CTA"),
  ogTitle: z.string().describe("Max 60 chars. Casual, WhatsApp/Instagram friendly"),
  ogDescription: z.string().describe("Max 160 chars. Enticing social sharing description"),
  focusKeyword: z.string().describe("Primary keyword e.g. 'gold chain necklace Nairobi'"),
  secondaryKeywords: z.array(z.string()).describe("4–6 keyword variations covering material, location, intent"),
  seoDescription: z.string().describe("300–500 word product description. Rich, engaging, keyword-optimised. Cover appearance, materials, styling tips, who it's for, care. Natural Kenya/Nairobi references. Short paragraphs, no headings."),
  imageAltTexts: z.array(z.string()).describe("3 descriptive alt text variations, max 125 chars each. Include product name, material, colour."),
  socialCaption: z.string().describe("Instagram-ready caption with 2–3 emojis, 2–3 hashtags, CTA. Under 200 chars."),
  searchTags: z.array(z.string()).describe("8–12 search-relevant tags: product attributes, occasions, styles, location terms"),
  seoScore: z.number().min(0).max(100).describe("Estimated SEO quality score based on keyword relevance and content completeness"),
});

const categorySeoSchema = z.object({
  metaTitle: z.string().describe("Max 60 chars — e.g. 'Necklaces - Gold, Silver & Beaded | Accessories by Ashley'"),
  metaDescription: z.string().describe("Max 160 chars. Include category breadth and Kenya/Nairobi context"),
  ogTitle: z.string().describe("Max 60 chars"),
  ogDescription: z.string().describe("Max 160 chars"),
  focusKeyword: z.string().describe("e.g. 'buy necklaces Nairobi'"),
  secondaryKeywords: z.array(z.string()).describe("4–6 keywords covering variations, materials, location"),
  seoDescription: z.string().describe("150–300 words describing the category. What customers will find, materials, price ranges, why shop here. Kenya-focused."),
  seoScore: z.number().min(0).max(100),
});

const subcategorySeoSchema = z.object({
  metaTitle: z.string().describe("Max 60 chars, specific to this subcategory"),
  metaDescription: z.string().describe("Max 160 chars"),
  ogTitle: z.string().describe("Max 60 chars"),
  ogDescription: z.string().describe("Max 160 chars"),
  focusKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).describe("4–6 relevant keywords"),
  seoDescription: z.string().describe("100–200 words. More specific than the parent category. What makes this subcategory unique."),
  seoScore: z.number().min(0).max(100),
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an SEO content specialist for "Accessories by Ashley", a trendy jewellery and accessories shop based in Nairobi, Kenya.

Brand voice: Warm, trendy, confident, approachable. Ashley's customers are fashion-forward women (and some men) in Nairobi who discover her through Instagram. Write like a stylish friend recommending jewellery — not a corporate product listing.

Kenya SEO context: Include natural references to Nairobi, Kenya, and local context where appropriate. Target queries like "buy [product] in Nairobi", "[material] [product] Kenya". Keep it natural — never keyword-stuff.

Important:
- Write all descriptions in British English (colour, jewellery, favourite)
- Currency is KES (Kenyan Shillings)
- Keep meta titles under 60 characters and meta descriptions under 160 characters`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildProductPrompt(doc: Record<string, unknown>): string {
  return `Generate SEO content for this product:

Name: ${doc.name}
Price: KES ${doc.price}
Category: ${(doc.category as { title?: string } | null)?.title ?? "—"}${(doc.subcategory as { title?: string } | null)?.title ? ` > ${(doc.subcategory as { title: string }).title}` : ""}
Material: ${doc.material ?? "not specified"}
Colour: ${doc.color ?? "not specified"}
Gender: ${doc.gender ?? "unisex"}
Dimensions: ${doc.dimensions ?? "not specified"}
Stock: ${doc.stock ?? 0} units
Existing description: ${doc.description ?? "None provided"}
Tags: ${Array.isArray(doc.tags) ? doc.tags.join(", ") : "none"}
Number of images: ${doc.imageCount ?? 0}`;
}

function buildCategoryPrompt(doc: Record<string, unknown>): string {
  return `Generate SEO content for this product category:

Name: ${doc.title}
Number of products: ${doc.productCount ?? 0}
Existing description: ${doc.description ?? "None provided"}`;
}

function buildSubcategoryPrompt(doc: Record<string, unknown>): string {
  return `Generate SEO content for this product subcategory:

Name: ${doc.title}
Parent category: ${(doc.parentCategory as { title?: string } | null)?.title ?? "—"}
Number of products: ${doc.productCount ?? 0}
Existing description: ${doc.description ?? "None provided"}`;
}

function generateKey(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now()}`;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth check — admin only
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { documentType, documentId, regenerate } = parsed.data;

  // Fetch document data
  let docData: Record<string, unknown> | null = null;
  const fetchQuery =
    documentType === "product"
      ? PRODUCT_FOR_AI_QUERY
      : documentType === "category"
        ? CATEGORY_FOR_AI_QUERY
        : SUBCATEGORY_FOR_AI_QUERY;

  try {
    docData = await client.fetch(fetchQuery, { id: documentId });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch document from Sanity", details: String(err) }, { status: 500 });
  }

  if (!docData) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Skip if already AI-generated and regenerate flag not set
  if (!regenerate && (docData.seo as { aiGenerated?: boolean } | null)?.aiGenerated) {
    return NextResponse.json({
      skipped: true,
      message: "Document already has AI-generated SEO. Pass regenerate: true to overwrite.",
    });
  }

  // Build prompt and schema
  let userPrompt: string;
  let schema: z.ZodObject<z.ZodRawShape>;

  if (documentType === "product") {
    userPrompt = buildProductPrompt(docData);
    schema = productSeoSchema;
  } else if (documentType === "category") {
    userPrompt = buildCategoryPrompt(docData);
    schema = categorySeoSchema;
  } else {
    userPrompt = buildSubcategoryPrompt(docData);
    schema = subcategorySeoSchema;
  }

  // Generate SEO content with Claude
  let generated: Record<string, unknown>;
  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.5"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema,
    });
    generated = result.object as Record<string, unknown>;
  } catch (err) {
    return NextResponse.json({ error: "AI generation failed", details: String(err) }, { status: 500 });
  }

  // Build Sanity patch
  const now = new Date().toISOString();
  const seoPatch: Record<string, unknown> = {
    "seo.metaTitle": generated.metaTitle,
    "seo.metaDescription": generated.metaDescription,
    "seo.ogTitle": generated.ogTitle,
    "seo.ogDescription": generated.ogDescription,
    "seo.focusKeyword": generated.focusKeyword,
    "seo.secondaryKeywords": generated.secondaryKeywords,
    "seo.seoScore": generated.seoScore,
    "seo.lastSeoGeneration": now,
    "seo.aiGenerated": true,
    seoDescription: generated.seoDescription,
  };

  // Product-specific fields
  if (documentType === "product") {
    const altTexts = (generated.imageAltTexts as string[] | undefined) ?? [];
    seoPatch.imageAltTexts = altTexts.map((altText, i) => ({
      _key: generateKey("alt", i),
      altText,
    }));
    seoPatch.socialCaption = generated.socialCaption;
    seoPatch.searchTags = generated.searchTags;
  }

  // Write back to Sanity
  try {
    await writeClient.patch(documentId).set(seoPatch).commit();
  } catch (err) {
    return NextResponse.json({ error: "Failed to save SEO content to Sanity", details: String(err) }, { status: 500 });
  }

  return NextResponse.json({ success: true, documentId, documentType, seoContent: generated });
}
