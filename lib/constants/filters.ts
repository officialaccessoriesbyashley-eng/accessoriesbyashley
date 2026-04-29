// ============================================
// Product Attribute Constants
// Shared between frontend filters and Sanity schema
// ============================================

export const COLORS = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "rose gold", label: "Rose Gold" },
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
  { value: "multi", label: "Multi" },
  { value: "pink", label: "Pink" },
  { value: "green", label: "Green" },
] as const;

export const MATERIALS = [
  { value: "stainless steel", label: "Stainless Steel" },
  { value: "sterling silver", label: "Sterling Silver" },
  { value: "gold-plated", label: "Gold-Plated" },
  { value: "gold-filled", label: "Gold-Filled" },
  { value: "surgical steel", label: "Surgical Steel" },
  { value: "crystal", label: "Crystal / CZ" },
  { value: "pearl", label: "Pearl" },
  { value: "titanium", label: "Titanium" },
  { value: "enamel", label: "Enamel" },
] as const;

export const SORT_OPTIONS = [
  { value: "name", label: "Name (A-Z)" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
] as const;

// Type exports
export type ColorValue = (typeof COLORS)[number]["value"];
export type MaterialValue = (typeof MATERIALS)[number]["value"];
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ============================================
// Sanity Schema Format Exports
// Format compatible with Sanity's options.list
// ============================================

/** Colors formatted for Sanity schema options.list */
export const COLORS_SANITY_LIST = COLORS.map(({ value, label }) => ({
  title: label,
  value,
}));

/** Materials formatted for Sanity schema options.list */
export const MATERIALS_SANITY_LIST = MATERIALS.map(({ value, label }) => ({
  title: label,
  value,
}));

/** Color values array for zod enums or validation */
export const COLOR_VALUES = COLORS.map((c) => c.value) as [
  ColorValue,
  ...ColorValue[],
];

/** Material values array for zod enums or validation */
export const MATERIAL_VALUES = MATERIALS.map((m) => m.value) as [
  MaterialValue,
  ...MaterialValue[],
];
