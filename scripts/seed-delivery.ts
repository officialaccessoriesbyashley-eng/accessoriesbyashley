/**
 * Idempotent delivery data seed script.
 * Run with: npm run seed:delivery
 *
 * Uses deterministic document IDs so re-running is safe.
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local so the script works outside Next.js
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
  // .env.local not found — rely on environment variables being set externally
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-12-05",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Pickup Station ──────────────────────────────────────────────────────────

const PICKUP_STATION_ID = "pickup-station-cbd";
const pickupStation = {
  _id: PICKUP_STATION_ID,
  _type: "pickupStation",
  name: "Nairobi CBD Pickup Station",
  address: "Nairobi CBD, Nairobi, Kenya",
  landmark: "Near Kencom Bus Stop",
  operatingHours: "Mon–Sat 9:00 AM – 6:00 PM",
  phone: "+254700000000",
  whatsappNumber: "+254700000000",
  isActive: true,
};

// ── Zones ───────────────────────────────────────────────────────────────────

interface ZoneSeed {
  id: string;
  zoneNumber: number;
  name: string;
  description: string;
  deliveryType: "pickup" | "delivery" | "courier";
  baseFee: number;
  allowPayOnDelivery: boolean;
  estimatedDelivery: string;
  sortOrder: number;
}

const zones: ZoneSeed[] = [
  {
    id: "zone-0-pickup",
    zoneNumber: 0,
    name: "Free Pickup – Nairobi CBD",
    description: "Collect your order from our Nairobi CBD station",
    deliveryType: "pickup",
    baseFee: 0,
    allowPayOnDelivery: true,
    estimatedDelivery: "Ready in 2 hours",
    sortOrder: 0,
  },
  {
    id: "zone-1-cbd",
    zoneNumber: 1,
    name: "Within CBD",
    description: "Delivery within Nairobi CBD",
    deliveryType: "delivery",
    baseFee: 99,
    allowPayOnDelivery: true,
    estimatedDelivery: "Same day",
    sortOrder: 1,
  },
  {
    id: "zone-2-near-cbd",
    zoneNumber: 2,
    name: "Areas Near CBD",
    description: "Areas close to Nairobi CBD",
    deliveryType: "delivery",
    baseFee: 199,
    allowPayOnDelivery: false,
    estimatedDelivery: "Same day / Next day",
    sortOrder: 2,
  },
  {
    id: "zone-3-greater-nairobi",
    zoneNumber: 3,
    name: "Greater Nairobi",
    description: "Greater Nairobi metropolitan area",
    deliveryType: "delivery",
    baseFee: 299,
    allowPayOnDelivery: false,
    estimatedDelivery: "1–2 business days",
    sortOrder: 3,
  },
  {
    id: "zone-4-outside-nairobi",
    zoneNumber: 4,
    name: "Outside Nairobi",
    description: "Towns outside Nairobi, shipped via courier",
    deliveryType: "courier",
    baseFee: 300,
    allowPayOnDelivery: false,
    estimatedDelivery: "3–5 business days",
    sortOrder: 4,
  },
  {
    id: "zone-5-east-africa",
    zoneNumber: 5,
    name: "East Africa",
    description: "Uganda, Tanzania and rest of East Africa",
    deliveryType: "courier",
    baseFee: 1100,
    allowPayOnDelivery: false,
    estimatedDelivery: "5–10 business days",
    sortOrder: 5,
  },
];

// ── Areas ───────────────────────────────────────────────────────────────────

interface AreaSeed {
  name: string;
  zoneId: string;
  subZone?: string;
  deliveryFee: number;
}

function areaId(zoneId: string, name: string): string {
  return `area-${zoneId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

const zone1Areas: AreaSeed[] = [
  { name: "Town", zoneId: "zone-1-cbd", deliveryFee: 99 },
  { name: "Kenyatta Avenue", zoneId: "zone-1-cbd", deliveryFee: 99 },
  { name: "Moi Avenue", zoneId: "zone-1-cbd", deliveryFee: 99 },
  { name: "Haile Selassie", zoneId: "zone-1-cbd", deliveryFee: 120 },
  { name: "Tom Mboya", zoneId: "zone-1-cbd", deliveryFee: 99 },
  { name: "Ronald Ngala", zoneId: "zone-1-cbd", deliveryFee: 120 },
  { name: "River Road", zoneId: "zone-1-cbd", deliveryFee: 120 },
  { name: "Khoja", zoneId: "zone-1-cbd", deliveryFee: 120 },
  { name: "Luthuli Avenue", zoneId: "zone-1-cbd", deliveryFee: 99 },
  { name: "Bus Station", zoneId: "zone-1-cbd", deliveryFee: 99 },
  { name: "Afya Centre", zoneId: "zone-1-cbd", deliveryFee: 120 },
  { name: "Jevanjee", zoneId: "zone-1-cbd", deliveryFee: 120 },
  { name: "University Way", zoneId: "zone-1-cbd", deliveryFee: 150 },
];

const zone2Areas: AreaSeed[] = [
  { name: "Highway Mall", zoneId: "zone-2-near-cbd", deliveryFee: 199 },
  { name: "Bunyala Road", zoneId: "zone-2-near-cbd", deliveryFee: 199 },
  { name: "Nyayo Stadium", zoneId: "zone-2-near-cbd", deliveryFee: 220 },
  { name: "Ngara", zoneId: "zone-2-near-cbd", deliveryFee: 199 },
  { name: "Pangani", zoneId: "zone-2-near-cbd", deliveryFee: 220 },
  { name: "South B", zoneId: "zone-2-near-cbd", deliveryFee: 230 },
  { name: "South C", zoneId: "zone-2-near-cbd", deliveryFee: 230 },
  { name: "Upper Hill", zoneId: "zone-2-near-cbd", deliveryFee: 220 },
  { name: "Makadara", zoneId: "zone-2-near-cbd", deliveryFee: 220 },
  { name: "Hurlingham", zoneId: "zone-2-near-cbd", deliveryFee: 250 },
  { name: "Nairobi West", zoneId: "zone-2-near-cbd", deliveryFee: 230 },
];

const SUB_A = "A – Thika Road";
const SUB_B = "B – Mombasa Road";
const SUB_C = "C – Waiyaki Way";
const SUB_D = "D – Ngong Road";
const SUB_E = "E – Kiambu Road";
const SUB_F = "F – Outering Road";
const SUB_G = "G – Kangundo Road";
const SUB_H = "H – Juja Road";
const SUB_I = "I – Industrial Area";

const zone3Areas: AreaSeed[] = [
  // Sub-zone A – Thika Road
  { name: "Muthaiga", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 350 },
  { name: "KCA", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 350 },
  { name: "Roasters", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 350 },
  { name: "Homeland", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Mountain Mall", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Garden City", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Safari Park", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "USIU", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 450 },
  { name: "TRM", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Roysambu", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Lumumba Drive", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Mirema", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 400 },
  { name: "Kasarani", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 450 },
  { name: "Githurai", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 500 },
  { name: "Zimmerman", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 450 },
  { name: "Kahawa West", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 500 },
  { name: "Kahawa Sukari", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 500 },
  { name: "Kahawa Wendani", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 500 },
  { name: "Ruiru Bypass", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 550 },
  { name: "Juja", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 600 },
  { name: "Witeithie", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 650 },
  { name: "Thika", zoneId: "zone-3-greater-nairobi", subZone: SUB_A, deliveryFee: 700 },

  // Sub-zone B – Mombasa Road
  { name: "Airport North Road", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 350 },
  { name: "Syokimau", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 400 },
  { name: "Mlolongo", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 450 },
  { name: "Athi River", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 500 },
  { name: "Imara Daima", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 350 },
  { name: "Gateway Mall", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 400 },
  { name: "Kitengela", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 550 },
  { name: "Kajiado", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 700 },
  { name: "Mwimuto", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 400 },
  { name: "Lunga Lunga", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 300 },
  { name: "Likoni", zoneId: "zone-3-greater-nairobi", subZone: SUB_B, deliveryFee: 700 },

  // Sub-zone C – Waiyaki Way
  { name: "Westlands", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 300 },
  { name: "ABC", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 350 },
  { name: "Westgate", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 350 },
  { name: "General Mathenge", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 350 },
  { name: "MP Shah", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 350 },
  { name: "Aga Khan", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 350 },
  { name: "Oshwal", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 350 },
  { name: "Wangige", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 500 },
  { name: "Kikuyu", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 550 },
  { name: "Kinoo", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 500 },
  { name: "Loresho", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 400 },
  { name: "Mountain View", zoneId: "zone-3-greater-nairobi", subZone: SUB_C, deliveryFee: 450 },

  // Sub-zone D – Ngong Road
  { name: "Kilimani", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 300 },
  { name: "Kileleshwa", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 300 },
  { name: "Adams Arcade", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 350 },
  { name: "Argwings Kodhek", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 300 },
  { name: "Lenana", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 350 },
  { name: "Kitanga", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 400 },
  { name: "Kawangware", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 450 },
  { name: "Dagoretti", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 450 },
  { name: "Karen", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 500 },
  { name: "Langata", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 400 },
  { name: "Magadi", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 650 },
  { name: "Rongai", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 550 },
  { name: "Junction Mall", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 400 },
  { name: "Lavington", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 350 },
  { name: "Yaya Centre", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 300 },
  { name: "Kibra", zoneId: "zone-3-greater-nairobi", subZone: SUB_D, deliveryFee: 400 },

  // Sub-zone E – Kiambu Road
  { name: "Ridgeways", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 350 },
  { name: "Thome", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 350 },
  { name: "Githogoro", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Runda", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Karura", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Gigiri", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Four Ways Junction", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Garden Estate", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 350 },
  { name: "Thindigua", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 450 },
  { name: "Banana", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 500 },
  { name: "Two Rivers", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Ruaka", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 450 },
  { name: "Kitusuru", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Rosslyn", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },
  { name: "Village Market", zoneId: "zone-3-greater-nairobi", subZone: SUB_E, deliveryFee: 400 },

  // Sub-zone F – Outering Road
  { name: "Jogoo Road", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 300 },
  { name: "Donholm", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 350 },
  { name: "Umoja", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 350 },
  { name: "Buruburu", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 350 },
  { name: "Embakasi", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Pipeline", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Fedha", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Tassia", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Kayole", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Komarock", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 450 },
  { name: "Manyanja", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Spine Road", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Bee Centre", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 400 },
  { name: "Mama Lucy", zoneId: "zone-3-greater-nairobi", subZone: SUB_F, deliveryFee: 450 },

  // Sub-zone G – Kangundo Road
  { name: "Kayole Junction", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 400 },
  { name: "Njiru", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 450 },
  { name: "Chokaa", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 500 },
  { name: "Saika", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 450 },
  { name: "Mihango", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 450 },
  { name: "Slaughter", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 500 },
  { name: "Ruai", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 550 },
  { name: "Kamulu", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 600 },
  { name: "Joska", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 650 },
  { name: "Malaa", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 600 },
  { name: "Tala", zoneId: "zone-3-greater-nairobi", subZone: SUB_G, deliveryFee: 650 },

  // Sub-zone H – Juja Road
  { name: "Huruma", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Shauri Moyo", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Starehe", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Majengo", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Mathare North", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Kariokor", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Mlango Kubwa", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },
  { name: "Kiamaiko", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 350 },
  { name: "Ngemi Estate", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 350 },
  { name: "Pumwani", zoneId: "zone-3-greater-nairobi", subZone: SUB_H, deliveryFee: 300 },

  // Sub-zone I – Industrial Area
  { name: "Enterprise Road", zoneId: "zone-3-greater-nairobi", subZone: SUB_I, deliveryFee: 300 },
  { name: "Lusaka Road", zoneId: "zone-3-greater-nairobi", subZone: SUB_I, deliveryFee: 300 },
  { name: "Road A", zoneId: "zone-3-greater-nairobi", subZone: SUB_I, deliveryFee: 300 },
  { name: "Road C", zoneId: "zone-3-greater-nairobi", subZone: SUB_I, deliveryFee: 300 },
  { name: "General Waruinge", zoneId: "zone-3-greater-nairobi", subZone: SUB_I, deliveryFee: 300 },
];

const zone4Areas: AreaSeed[] = [
  { name: "Mombasa Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 600 },
  { name: "Eldoret Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 500 },
  { name: "Nakuru Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 450 },
  { name: "Meru Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 500 },
  { name: "Kisumu Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 550 },
  { name: "Kisii Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 550 },
  { name: "Kitale Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 550 },
  { name: "Kakamega Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 550 },
  { name: "Migori Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 600 },
  { name: "Nyeri Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 450 },
  { name: "Machakos Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 350 },
  { name: "Bungoma Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 550 },
  { name: "Busia Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 600 },
  { name: "Malindi Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 650 },
  { name: "Namanga Town", zoneId: "zone-4-outside-nairobi", deliveryFee: 400 },
];

const zone5Areas: AreaSeed[] = [
  { name: "Uganda – Kampala", zoneId: "zone-5-east-africa", deliveryFee: 1100 },
  { name: "Tanzania – Dar es Salaam", zoneId: "zone-5-east-africa", deliveryFee: 1200 },
  { name: "Tanzania – Arusha", zoneId: "zone-5-east-africa", deliveryFee: 1100 },
];

const allAreas = [
  ...zone1Areas,
  ...zone2Areas,
  ...zone3Areas,
  ...zone4Areas,
  ...zone5Areas,
];

// ── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding delivery data...\n");

  // 1. Pickup Station
  console.log("📍 Upserting pickup station...");
  await client.createOrReplace(pickupStation);
  console.log("   ✓ Pickup station created");

  // 2. Zones
  console.log("\n🗺  Upserting delivery zones...");
  for (const zone of zones) {
    await client.createOrReplace({
      _id: zone.id,
      _type: "deliveryZone",
      name: zone.name,
      slug: { _type: "slug", current: zone.id },
      description: zone.description,
      zoneNumber: zone.zoneNumber,
      deliveryType: zone.deliveryType,
      baseFee: zone.baseFee,
      allowPayOnDelivery: zone.allowPayOnDelivery,
      isActive: true,
      estimatedDelivery: zone.estimatedDelivery,
      sortOrder: zone.sortOrder,
    });
    console.log(`   ✓ Zone ${zone.zoneNumber}: ${zone.name}`);
  }

  // 3. Areas
  console.log(`\n📌 Upserting ${allAreas.length} delivery areas...`);
  let created = 0;
  for (const area of allAreas) {
    const id = areaId(area.zoneId, area.name);
    await client.createOrReplace({
      _id: id,
      _type: "deliveryArea",
      name: area.name,
      zone: { _type: "reference", _ref: area.zoneId },
      ...(area.subZone ? { subZone: area.subZone } : {}),
      deliveryFee: area.deliveryFee,
      isActive: true,
      sortOrder: 0,
    });
    created++;
    if (created % 20 === 0) {
      console.log(`   … ${created}/${allAreas.length}`);
    }
  }
  console.log(`   ✓ ${allAreas.length} areas upserted`);

  // 4. Delivery Settings singleton
  console.log("\n⚙️  Upserting delivery settings...");
  await client.createOrReplace({
    _id: "deliverySettings",
    _type: "deliverySettings",
    payOnDeliveryDepositPercent: 0,
    defaultPickupStation: { _type: "reference", _ref: PICKUP_STATION_ID },
    deliveryNotice:
      "Orders placed after 4 PM will be processed the next business day.",
  });
  console.log("   ✓ Delivery settings created");

  console.log("\n✅ Done! All delivery data seeded successfully.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
