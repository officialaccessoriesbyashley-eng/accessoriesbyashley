import { auth } from "@/auth";
import { adminClient } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";
import { NextResponse } from "next/server";

const QUERY = defineQuery(`*[_type == "category" && isActive != false] | order(sortOrder asc, title asc) {
  _id,
  title,
  icon,
  "subcategories": *[_type == "subcategory" && parentCategory._ref == ^._id && isActive != false] | order(sortOrder asc, title asc) {
    _id,
    title
  }
}`);

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const categories = await adminClient.fetch(QUERY);
  return NextResponse.json(categories);
}
