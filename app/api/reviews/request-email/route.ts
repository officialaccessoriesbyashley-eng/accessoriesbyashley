import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markReviewRequestSent } from "@/lib/actions/reviews";

export async function POST(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = typeof body === "object" && body !== null && "orderId" in body
    ? String((body as Record<string, unknown>).orderId)
    : null;

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const result = await markReviewRequestSent(orderId);
  return NextResponse.json(result);
}
