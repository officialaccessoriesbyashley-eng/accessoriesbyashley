import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST - Create admin invite
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check if user already exists as admin
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser?.role === "ADMIN") {
    return NextResponse.json(
      { error: "User is already an admin" },
      { status: 409 }
    );
  }

  // If user already exists, promote them directly
  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    return NextResponse.json({ message: "User promoted to admin" });
  }

  // Create invite for new user
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

  const invite = await prisma.adminInvite.upsert({
    where: { email },
    update: { expiresAt, used: false, invitedBy: session.user.id },
    create: {
      email,
      invitedBy: session.user.id,
      expiresAt,
    },
  });

  return NextResponse.json({
    message: "Admin invite created",
    invite: { email: invite.email, expiresAt: invite.expiresAt },
  });
}

// GET - List admin invites
export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await prisma.adminInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: { inviter: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ invites });
}
