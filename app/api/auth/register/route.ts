import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and password (min 8 chars) are required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Check if there's an admin invite for this email
  const invite = await prisma.adminInvite.findUnique({
    where: { email, used: false },
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: invite ? "ADMIN" : "USER",
    },
  });

  // Mark invite as used
  if (invite) {
    await prisma.adminInvite.update({
      where: { id: invite.id },
      data: { used: true },
    });
  }

  return NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { status: 201 }
  );
}
