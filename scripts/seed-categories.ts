/**
 * Idempotent category & subcategory seed script.
 * Run with: npm run seed:categories
 *
 * Downloads images from Unsplash and uploads them to Sanity as assets.
 * IDs match Jewelrysampledata.ndjson so existing product references stay valid.
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

// ── Image upload helper ───────────────────────────────────────────────────────

type ImageRef = {
  _type: "image";
  asset: { _type: "reference"; _ref: string };
};

async function uploadImage(imageUrl: string, filename: string): Promise<ImageRef | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename,
      contentType: "image/jpeg",
    });
    return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
  } catch (err) {
    console.warn(`  ⚠ Could not upload ${filename}: ${err}`);
    return null;
  }
}

// ── Top-level categories ──────────────────────────────────────────────────────
// IDs and images match Jewelrysampledata.ndjson.

const CATEGORIES = [
  {
    _id: "category-necklaces",
    title: "Quality Necklaces",
    slug: "quality-necklaces",
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&fm=jpg",
    description: "Hypoallergenic, stainless steel, and everyday necklaces & chains.",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    _id: "category-earrings",
    title: "Quality Earrings",
    slug: "quality-earrings",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&fm=jpg",
    description: "Studs, hoops, statement drops, and hypoallergenic earrings.",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    _id: "category-hair-accessories",
    title: "Hair Accessories",
    slug: "hair-accessories",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&fm=jpg",
    description: "Clips, scrunchies, pins, headbands, and banana clips.",
    isFeatured: true,
    sortOrder: 3,
  },
  {
    _id: "category-gifts",
    title: "Gifts Galore",
    slug: "gifts-galore",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&fm=jpg",
    description: "Curated gift sets and jewellery bundles for every occasion.",
    isFeatured: true,
    sortOrder: 4,
  },
  {
    _id: "category-bags",
    title: "Bags & Bag Accessories",
    slug: "bags-and-bag-accessories",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&fm=jpg",
    description: "Mini crossbody bags, totes, bag charms, and straps.",
    isFeatured: true,
    sortOrder: 5,
  },
  {
    _id: "category-bridal",
    title: "Bridal Accessories",
    slug: "bridal-accessories",
    imageUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&fm=jpg",
    description: "Tiaras, veils, hair vines, and bridal jewellery sets.",
    isFeatured: true,
    sortOrder: 6,
  },
];

// ── Subcategories ─────────────────────────────────────────────────────────────

const SUBCATEGORIES = [
  // Necklaces — images from NDJSON subcategory entries
  {
    _id: "sub-necklaces-hypoallergenic",
    title: "Hypoallergenic & Non Tarnish Necklaces",
    slug: "hypoallergenic-necklaces",
    imageUrl: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&fm=jpg",
    parentId: "category-necklaces",
    sortOrder: 1,
  },
  {
    _id: "sub-necklaces-stainless",
    title: "Stainless Necklaces",
    slug: "stainless-necklaces",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&fm=jpg",
    parentId: "category-necklaces",
    sortOrder: 2,
  },

  // Earrings — images from NDJSON subcategory entries
  {
    _id: "sub-earrings-mini-stud",
    title: "Mini & Stud Earrings",
    slug: "mini-stud-earrings",
    imageUrl: "https://images.unsplash.com/photo-1651950519238-15835722f8bb?w=800&fm=jpg",
    parentId: "category-earrings",
    sortOrder: 1,
  },
  {
    _id: "sub-earrings-statement",
    title: "Statement Earrings",
    slug: "statement-earrings",
    imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&fm=jpg",
    parentId: "category-earrings",
    sortOrder: 2,
  },
  {
    _id: "sub-earrings-hypoallergenic",
    title: "Hypoallergenic Earrings",
    slug: "hypoallergenic-earrings",
    imageUrl: "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=800&fm=jpg",
    parentId: "category-earrings",
    sortOrder: 3,
  },

  // Hair Accessories — images from matching product photos
  {
    _id: "sub-hair-clips-claws",
    title: "Hair Clips & Claws",
    slug: "hair-clips-claws",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&fm=jpg",
    parentId: "category-hair-accessories",
    sortOrder: 1,
  },
  {
    _id: "sub-hair-scrunchies-pins",
    title: "Scrunchies & Pins",
    slug: "hair-scrunchies-pins",
    imageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&fm=jpg",
    parentId: "category-hair-accessories",
    sortOrder: 2,
  },
  {
    _id: "sub-hair-headbands",
    title: "Headbands",
    slug: "hair-headbands",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&fm=jpg",
    parentId: "category-hair-accessories",
    sortOrder: 3,
  },

  // Gifts
  {
    _id: "sub-gifts-jewellery-sets",
    title: "Jewellery Sets",
    slug: "gift-jewellery-sets",
    imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&fm=jpg",
    parentId: "category-gifts",
    sortOrder: 1,
  },
  {
    _id: "sub-gifts-necklaces",
    title: "Gift Necklaces",
    slug: "gift-necklaces",
    imageUrl: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&fm=jpg",
    parentId: "category-gifts",
    sortOrder: 2,
  },
  {
    _id: "sub-gifts-boxes",
    title: "Gift Boxes & Bundles",
    slug: "gift-boxes-bundles",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fm=jpg",
    parentId: "category-gifts",
    sortOrder: 3,
  },

  // Bags & Bag Accessories
  {
    _id: "sub-bags-mini-crossbody",
    title: "Mini Bags & Crossbody",
    slug: "mini-bags-crossbody",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&fm=jpg",
    parentId: "category-bags",
    sortOrder: 1,
  },
  {
    _id: "sub-bags-totes",
    title: "Totes & Shoppers",
    slug: "bags-totes-shoppers",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&fm=jpg",
    parentId: "category-bags",
    sortOrder: 2,
  },
  {
    _id: "sub-bags-charms-straps",
    title: "Bag Charms & Straps",
    slug: "bag-charms-straps",
    imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&fm=jpg",
    parentId: "category-bags",
    sortOrder: 3,
  },
  {
    _id: "sub-bags-pouches",
    title: "Pouches & Cases",
    slug: "bag-pouches-cases",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&fm=jpg",
    parentId: "category-bags",
    sortOrder: 4,
  },

  // Bridal
  {
    _id: "sub-bridal-headpieces",
    title: "Bridal Headpieces",
    slug: "bridal-headpieces",
    imageUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&fm=jpg",
    parentId: "category-bridal",
    sortOrder: 1,
  },
  {
    _id: "sub-bridal-earrings",
    title: "Bridal Earrings",
    slug: "bridal-earrings",
    imageUrl: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&fm=jpg",
    parentId: "category-bridal",
    sortOrder: 2,
  },
  {
    _id: "sub-bridal-bracelets",
    title: "Bridal Bracelets",
    slug: "bridal-bracelets",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&fm=jpg",
    parentId: "category-bridal",
    sortOrder: 3,
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const totalImages = CATEGORIES.length + SUBCATEGORIES.length;
  console.log(`Uploading ${totalImages} images to Sanity…\n`);

  const [catImages, subImages] = await Promise.all([
    Promise.all(
      CATEGORIES.map((c) => {
        process.stdout.write(`  ↑ ${c._id}… `);
        return uploadImage(c.imageUrl, `${c._id}.jpg`).then((ref) => {
          console.log(ref ? "✓" : "⚠ skipped");
          return ref;
        });
      })
    ),
    Promise.all(
      SUBCATEGORIES.map((s) => {
        process.stdout.write(`  ↑ ${s._id}… `);
        return uploadImage(s.imageUrl, `${s._id}.jpg`).then((ref) => {
          console.log(ref ? "✓" : "⚠ skipped");
          return ref;
        });
      })
    ),
  ]);

  console.log("\nWriting documents…");

  const tx = client.transaction();

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const image = catImages[i];
    tx.createOrReplace({
      _id: cat._id,
      _type: "category",
      title: cat.title,
      slug: { _type: "slug", current: cat.slug },
      ...(image && { image }),
      description: cat.description,
      isFeatured: cat.isFeatured,
      isActive: true,
      sortOrder: cat.sortOrder,
    });
  }

  for (let i = 0; i < SUBCATEGORIES.length; i++) {
    const sub = SUBCATEGORIES[i];
    const image = subImages[i];
    tx.createOrReplace({
      _id: sub._id,
      _type: "subcategory",
      title: sub.title,
      slug: { _type: "slug", current: sub.slug },
      parentCategory: { _type: "reference", _ref: sub.parentId },
      ...(image && { image }),
      isActive: true,
      sortOrder: sub.sortOrder,
    });
  }

  await tx.commit();

  console.log(`\n✓ ${CATEGORIES.length} categories upserted`);
  console.log(`✓ ${SUBCATEGORIES.length} subcategories upserted`);
  console.log("\nDone. Now run: npm run migrate:categories");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
