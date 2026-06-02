/**
 * Idempotent category & subcategory seed script.
 * Run with: npm run seed:categories
 *
 * Categories match Jewelrysampledata.ndjson — IDs are preserved so existing
 * product references remain valid.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // rely on env being set externally
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-12-05",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Top-level categories ──────────────────────────────────────────────────────
// IDs match the NDJSON so existing product `category` references stay valid.

const CATEGORIES = [
  {
    _id: "category-necklaces",
    title: "Quality Necklaces",
    slug: "quality-necklaces",
    icon: "📿",
    description: "Hypoallergenic, stainless steel, and everyday necklaces & chains.",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    _id: "category-earrings",
    title: "Quality Earrings",
    slug: "quality-earrings",
    icon: "💎",
    description: "Studs, hoops, statement drops, and hypoallergenic earrings.",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    _id: "category-hair-accessories",
    title: "Hair Accessories",
    slug: "hair-accessories",
    icon: "🎀",
    description: "Clips, scrunchies, pins, headbands, and banana clips.",
    isFeatured: true,
    sortOrder: 3,
  },
  {
    _id: "category-gifts",
    title: "Gifts Galore",
    slug: "gifts-galore",
    icon: "🎁",
    description: "Curated gift sets and jewellery bundles for every occasion.",
    isFeatured: true,
    sortOrder: 4,
  },
  {
    _id: "category-bags",
    title: "Bags & Bag Accessories",
    slug: "bags-and-bag-accessories",
    icon: "👜",
    description: "Mini crossbody bags, totes, bag charms, and straps.",
    isFeatured: true,
    sortOrder: 5,
  },
  {
    _id: "category-bridal",
    title: "Bridal Accessories",
    slug: "bridal-accessories",
    icon: "💍",
    description: "Tiaras, veils, hair vines, and bridal jewellery sets.",
    isFeatured: true,
    sortOrder: 6,
  },
];

// ── Subcategories ─────────────────────────────────────────────────────────────

const SUBCATEGORIES = [
  // Necklaces
  {
    _id: "sub-necklaces-hypoallergenic",
    title: "Hypoallergenic & Non Tarnish Necklaces",
    slug: "hypoallergenic-necklaces",
    parentId: "category-necklaces",
    sortOrder: 1,
  },
  {
    _id: "sub-necklaces-stainless",
    title: "Stainless Necklaces",
    slug: "stainless-necklaces",
    parentId: "category-necklaces",
    sortOrder: 2,
  },
  // Earrings
  {
    _id: "sub-earrings-mini-stud",
    title: "Mini & Stud Earrings",
    slug: "mini-stud-earrings",
    parentId: "category-earrings",
    sortOrder: 1,
  },
  {
    _id: "sub-earrings-statement",
    title: "Statement Earrings",
    slug: "statement-earrings",
    parentId: "category-earrings",
    sortOrder: 2,
  },
  {
    _id: "sub-earrings-hypoallergenic",
    title: "Hypoallergenic Earrings",
    slug: "hypoallergenic-earrings",
    parentId: "category-earrings",
    sortOrder: 3,
  },
];

async function seed() {
  console.log("Seeding categories…");

  const tx = client.transaction();

  for (const cat of CATEGORIES) {
    tx.createOrReplace({
      _id: cat._id,
      _type: "category",
      title: cat.title,
      slug: { _type: "slug", current: cat.slug },
      icon: cat.icon,
      description: cat.description,
      isFeatured: cat.isFeatured,
      isActive: true,
      sortOrder: cat.sortOrder,
    });
  }

  for (const sub of SUBCATEGORIES) {
    tx.createOrReplace({
      _id: sub._id,
      _type: "subcategory",
      title: sub.title,
      slug: { _type: "slug", current: sub.slug },
      parentCategory: { _type: "reference", _ref: sub.parentId },
      isActive: true,
      sortOrder: sub.sortOrder,
    });
  }

  await tx.commit();

  console.log(`✓ ${CATEGORIES.length} categories upserted`);
  console.log(`✓ ${SUBCATEGORIES.length} subcategories upserted`);
  console.log("\nDone.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
