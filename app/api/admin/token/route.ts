import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
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
