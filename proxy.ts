import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/checkout", "/orders", "/checkout/success", "/account"];
const adminRoutes = ["/admin"];

export async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Protect admin routes — require ADMIN role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect authenticated routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};