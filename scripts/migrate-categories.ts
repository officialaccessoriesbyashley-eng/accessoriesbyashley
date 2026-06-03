/**
 * Category migration script.
 * Maps existing products from the old flat category to the new subcategory system.
 *
 * Run with: npx tsx scripts/migrate-categories.ts
 *
 * What it does:
 *  1. Reads all products that have a category but no subcategory
 *  2. Looks up the new category/subcategory IDs based on title matching
 *  3. Patches each product with the correct category + subcategory reference
 *
 * Safe to re-run — skips products that already have a subcategory.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
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

// ── Category → subcategory mapping ───────────────────────────────────────────
// Keys are lowercase category title patterns (checked with .includes())
// Values are [categorySlug, subcategorySlug] pairs that must exist in Sanity

const CATEGORY_MAP: Record<string, [string, string]> = {
  earring: ["earrings", "stud-earrings"],
  necklace: ["necklaces", "pendant-necklaces"],
  chain: ["necklaces", "chain-necklaces"],
  bracelet: ["bracelets", "chain-bracelets"],
  bangle: ["bracelets", "bangles"],
  ring: ["rings", "statement-rings"],
  anklet: ["anklets", "chain-anklets"],
  brooch: ["brooches", "floral-brooches"],
  pin: ["brooches", "enamel-pins"],
  hair: ["hair-accessories", "hair-clips-barrettes"],
  headband: ["hair-accessories", "headbands"],
  scrunchie: ["hair-accessories", "scrunchies"],
  bag: ["bags", "tote-bags"],
  purse: ["bags", "clutches-evening-bags"],
  clutch: ["bags", "clutches-evening-bags"],
  crossbody: ["bags", "crossbody-bags"],
  sunglass: ["sunglasses", "oversized-sunglasses"],
  scarf: ["scarves", "silk-scarves"],
  watch: ["watches", "minimalist-watches"],
  set: ["sets", "jewellery-sets"],
  bundle: ["sets", "gift-sets"],
};

interface Product {
  _id: string;
  name: string;
  categoryTitle: string;
  categoryId: string;
  hasSubcategory: boolean;
}

interface SanityCategory {
  _id: string;
  title: string;
  slug: string;
}

interface SanitySubcategory {
  _id: string;
  title: string;
  slug: string;
  parentCategoryId: string;
}

async function migrate() {
  console.log("Fetching categories and subcategories…");

  const [categories, subcategories, products]: [
    SanityCategory[],
    SanitySubcategory[],
    Product[],
  ] = await Promise.all([
    client.fetch(`*[_type == "category"] { _id, title, "slug": slug.current }`),
    client.fetch(
      `*[_type == "subcategory"] { _id, title, "slug": slug.current, "parentCategoryId": parentCategory._ref }`
    ),
    client.fetch(
      `*[_type == "product" && defined(category)] {
        _id,
        name,
        "categoryTitle": category->title,
        "categoryId": category._ref,
        "hasSubcategory": defined(subcategory)
      }`
    ),
  ]);

  console.log(
    `Found ${products.length} products, ${categories.length} categories, ${subcategories.length} subcategories.\n`
  );

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const subBySlug = Object.fromEntries(subcategories.map((s) => [s.slug, s]));

  const needsMigration = products.filter((p) => !p.hasSubcategory);
  console.log(`${needsMigration.length} products without subcategory — migrating…\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of needsMigration) {
    const titleLower = (product.name + " " + (product.categoryTitle ?? "")).toLowerCase();

    let catSlug: string | null = null;
    let subSlug: string | null = null;

    for (const [keyword, [cs, ss]] of Object.entries(CATEGORY_MAP)) {
      if (titleLower.includes(keyword)) {
        catSlug = cs;
        subSlug = ss;
        break;
      }
    }

    if (!catSlug || !subSlug) {
      console.log(`  SKIP  ${product.name} — no keyword match (category: ${product.categoryTitle})`);
      skipped++;
      continue;
    }

    const newCat = catBySlug[catSlug];
    const newSub = subBySlug[subSlug];

    if (!newCat || !newSub) {
      console.log(
        `  SKIP  ${product.name} — category "${catSlug}" or subcategory "${subSlug}" not found in Sanity. Run seed:categories first.`
      );
      skipped++;
      continue;
    }

    await client
      .patch(product._id)
      .set({
        category: { _type: "reference", _ref: newCat._id },
        subcategory: { _type: "reference", _ref: newSub._id },
      })
      .commit();

    console.log(`  OK    ${product.name} → ${catSlug} / ${subSlug}`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped.`);
  if (skipped > 0) {
    console.log(
      "\nTip: products marked SKIP need to be categorised manually in Sanity Studio."
    );
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
