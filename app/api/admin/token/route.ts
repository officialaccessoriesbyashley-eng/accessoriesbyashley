import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Sanity token not configured" },
      { status: 500 },
    );
  }

  return NextResponse.json({ token });
}
