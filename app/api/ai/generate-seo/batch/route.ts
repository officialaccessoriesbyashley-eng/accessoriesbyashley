"use server";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";

const requestSchema = z.object({
  documentType: z.enum(["product", "category", "subcategory"]),
  documentIds: z.array(z.string()).optional(),
  all: z.boolean().optional().default(false),
  regenerate: z.boolean().optional().default(false),
  onlyMissing: z.boolean().optional().default(true),
});

const ALL_PRODUCTS_IDS_QUERY = `*[_type == "product"] { _id, "aiGenerated": seo.aiGenerated }`;
const ALL_CATEGORIES_IDS_QUERY = `*[_type == "category"] { _id, "aiGenerated": seo.aiGenerated }`;
const ALL_SUBCATEGORIES_IDS_QUERY = `*[_type == "subcategory"] { _id, "aiGenerated": seo.aiGenerated }`;

export async function POST(request: Request) {
  // Admin-only
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { documentType, documentIds, all, regenerate, onlyMissing } = parsed.data;

  // Resolve document IDs
  let ids: string[] = [];

  if (all) {
    const query =
      documentType === "product"
        ? ALL_PRODUCTS_IDS_QUERY
        : documentType === "category"
          ? ALL_CATEGORIES_IDS_QUERY
          : ALL_SUBCATEGORIES_IDS_QUERY;

    const docs: { _id: string; aiGenerated?: boolean }[] = await client.fetch(query);
    ids = onlyMissing && !regenerate
      ? docs.filter((d) => !d.aiGenerated).map((d) => d._id)
      : docs.map((d) => d._id);
  } else if (documentIds?.length) {
    ids = documentIds;
  } else {
    return NextResponse.json({ error: "Provide documentIds or set all: true" }, { status: 400 });
  }

  if (ids.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "No documents to process" });
  }

  // Cap to 50 per batch to stay within rate limits
  const batch = ids.slice(0, 50);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
  const singleEndpoint = `${baseUrl}/api/ai/generate-seo`;

  const results: { id: string; success: boolean; skipped?: boolean; error?: string }[] = [];
  const sessionCookie = request.headers.get("cookie") ?? "";

  for (const id of batch) {
    try {
      const res = await fetch(singleEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({ documentType, documentId: id, regenerate }),
      });
      const data = (await res.json()) as { success?: boolean; skipped?: boolean; error?: string };
      results.push({ id, success: data.success ?? false, skipped: data.skipped, error: data.error });
    } catch (err) {
      results.push({ id, success: false, error: String(err) });
    }

    // 1.5 second delay between calls to avoid rate limiting
    if (batch.indexOf(id) < batch.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.success && !r.skipped).length;

  return NextResponse.json({
    success: true,
    total: ids.length,
    processed: batch.length,
    succeeded,
    skipped,
    failed,
    results,
    truncated: ids.length > 50,
  });
}
