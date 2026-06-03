/**
 * Category migration script.
 * Maps existing products to the new category → subcategory hierarchy.
 *
 * Run with: npm run migrate:categories
 * (Always run npm run seed:categories first)
 *
 * Two scenarios handled:
 *  A) Products whose category._ref is an old "sub-as-category" ID
 *     (e.g. category-necklaces-hypoallergenic) — mapped directly to the
 *     correct top-level category + new subcategory document.
 *
 *  B) Products whose category._ref is already a top-level ID
 *     (e.g. category-hair-accessories) — subcategory is assigned by
 *     matching keywords in the product name.
 *
 * Safe to re-run — skips products that already have a subcategory.
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

// ── Scenario A: direct mapping from old "sub-as-category" ID ─────────────────
// Products referencing these old IDs get both category + subcategory updated.

const DIRECT_MAP: Record<string, { categoryId: string; subcategoryId: string }> = {
  "category-necklaces-hypoallergenic": {
    categoryId: "category-necklaces",
    subcategoryId: "sub-necklaces-hypoallergenic",
  },
  "category-necklaces-stainless": {
    categoryId: "category-necklaces",
    subcategoryId: "sub-necklaces-stainless",
  },
  "category-earrings-mini-stud": {
    categoryId: "category-earrings",
    subcategoryId: "sub-earrings-mini-stud",
  },
  "category-earrings-statement": {
    categoryId: "category-earrings",
    subcategoryId: "sub-earrings-statement",
  },
  "category-earrings-hypoallergenic": {
    categoryId: "category-earrings",
    subcategoryId: "sub-earrings-hypoallergenic",
  },
};

// ── Scenario B: keyword mapping for products on top-level categories ──────────
// Each entry: [keyword (lowercase), subcategoryId]
// First match wins; "default" is used when no keyword matches.

type KeywordEntry = [string, string];

const TOP_LEVEL_MAP: Record<string, { keywords: KeywordEntry[]; defaultSubId: string }> = {
  "category-hair-accessories": {
    defaultSubId: "sub-hair-clips-claws",
    keywords: [
      ["scrunchie", "sub-hair-scrunchies-pins"],
      ["pin", "sub-hair-scrunchies-pins"],
      ["headband", "sub-hair-headbands"],
    ],
  },
  "category-gifts": {
    defaultSubId: "sub-gifts-jewellery-sets",
    keywords: [
      ["box", "sub-gifts-boxes"],
      ["birthstone", "sub-gifts-necklaces"],
      ["necklace", "sub-gifts-necklaces"],
      ["pendant", "sub-gifts-necklaces"],
      ["initial", "sub-gifts-necklaces"],
    ],
  },
  "category-bags": {
    defaultSubId: "sub-bags-mini-crossbody",
    keywords: [
      ["tote", "sub-bags-totes"],
      ["canvas", "sub-bags-totes"],
      ["charm", "sub-bags-charms-straps"],
      ["strap", "sub-bags-charms-straps"],
      ["pouch", "sub-bags-pouches"],
      ["makeup", "sub-bags-pouches"],
    ],
  },
  "category-bridal": {
    defaultSubId: "sub-bridal-headpieces",
    keywords: [
      ["earring", "sub-bridal-earrings"],
      ["bracelet", "sub-bridal-bracelets"],
    ],
  },
};

interface Product {
  _id: string;
  name: string;
  categoryRef: string;
  hasSubcategory: boolean;
}

async function migrate() {
  console.log("Fetching products…\n");

  const products: Product[] = await client.fetch(
    `*[_type == "product" && defined(category)] {
      _id,
      name,
      "categoryRef": category._ref,
      "hasSubcategory": defined(subcategory)
    }`
  );

  const needsMigration = products.filter((p) => !p.hasSubcategory);
  console.log(`${products.length} total products, ${needsMigration.length} need migration.\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of needsMigration) {
    const ref = product.categoryRef;
    const nameLower = product.name.toLowerCase();

    // Scenario A — old sub-as-category reference
    if (DIRECT_MAP[ref]) {
      const { categoryId, subcategoryId } = DIRECT_MAP[ref];
      await client
        .patch(product._id)
        .set({
          category: { _type: "reference", _ref: categoryId },
          subcategory: { _type: "reference", _ref: subcategoryId },
        })
        .commit();
      console.log(`  ✓  ${product.name}`);
      console.log(`     category:    ${categoryId}`);
      console.log(`     subcategory: ${subcategoryId}\n`);
      updated++;
      continue;
    }

    // Scenario B — top-level category, pick subcategory by keyword
    const mapping = TOP_LEVEL_MAP[ref];
    if (mapping) {
      let subcategoryId = mapping.defaultSubId;
      for (const [keyword, subId] of mapping.keywords) {
        if (nameLower.includes(keyword)) {
          subcategoryId = subId;
          break;
        }
      }
      await client
        .patch(product._id)
        .set({
          subcategory: { _type: "reference", _ref: subcategoryId },
        })
        .commit();
      console.log(`  ✓  ${product.name}`);
      console.log(`     subcategory: ${subcategoryId}\n`);
      updated++;
      continue;
    }

    console.log(`  —  SKIP ${product.name} (unknown category ref: ${ref})\n`);
    skipped++;
  }

  console.log(`Done. ${updated} updated, ${skipped} skipped.`);
  if (skipped > 0) {
    console.log("Tip: skipped products need to be categorised manually in Sanity Studio.");
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
