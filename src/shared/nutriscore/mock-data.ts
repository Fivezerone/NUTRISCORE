// Kenyan-market sample data shared across all three UI surfaces.
//
// These are illustrative nutrition figures (typical-for-category, not lab
// values) standing in until Phase 2 wires up real per-product data from
// Open Food Facts + the curated Kenyan-product fallback dataset. Treat the
// numbers as "plausible enough to design and test against", not as ground
// truth — they get replaced wholesale once the score engine lands.
//
// In the real extension these get replaced by:
//  - PRODUCTS        -> live DOM-scraped + scored products (content script)
//  - POPUP_ITEMS     -> products scanned on the current page (popup)
//  - SCORE_COUNT     -> derived from POPUP_ITEMS at runtime (popup)
//  - TREND_DATA       -> aggregated history read from IndexedDB (dashboard)
//  - CATEGORY_DATA    -> aggregated history read from IndexedDB (dashboard)

import type { Grade, Product } from "./types";

// Generic placeholder photography (Lorem Picsum, seeded for stability) —
// deliberately NOT real product packshots, since we don't have licensed
// imagery for these brands yet. Swap for real Open Food Facts images in
// Phase 2.
const placeholderImage = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Fresh Milk (Pasteurized)",
    brand: "Brookside",
    weight: "500ml",
    price: "KES 65",
    score: "B",
    imageUrl: placeholderImage("brookside-milk"),
    nutrients: {
      Energy: { value: "64 kcal", level: 1 },
      Fat: { value: "3.3g", level: 1 },
      Saturates: { value: "2.0g", level: 1 },
      Sugars: { value: "4.8g", level: 1 },
      Salt: { value: "0.10g", level: 0 },
      Protein: { value: "3.2g", level: 2, positive: true },
      Fibre: { value: "0.0g", level: 0, positive: true },
    },
    alternatives: ["Brookside Low Fat Milk — A", "Daima UHT Skimmed Milk — A"],
  },
  {
    id: 2,
    name: "Beef Sausages",
    brand: "Tropical Heat",
    weight: "400g",
    price: "KES 380",
    score: "E",
    imageUrl: placeholderImage("tropical-heat-sausages"),
    nutrients: {
      Energy: { value: "280 kcal", level: 2 },
      Fat: { value: "22.0g", level: 2 },
      Saturates: { value: "8.5g", level: 2 },
      Sugars: { value: "1.2g", level: 0 },
      Salt: { value: "1.90g", level: 2 },
      Protein: { value: "13.0g", level: 1, positive: true },
      Fibre: { value: "0.5g", level: 0, positive: true },
    },
    alternatives: ["Kenchic Plain Chicken Breast — B", "Farmer's Choice Lean Back Bacon — C"],
  },
  {
    id: 3,
    name: "Wholegrain Weetabix",
    brand: "Weetabix",
    weight: "430g",
    price: "KES 695",
    score: "A",
    imageUrl: placeholderImage("weetabix"),
    nutrients: {
      Energy: { value: "362 kcal", level: 1 },
      Fat: { value: "2.0g", level: 0 },
      Saturates: { value: "0.5g", level: 0 },
      Sugars: { value: "4.4g", level: 0 },
      Salt: { value: "0.30g", level: 0 },
      Protein: { value: "11.0g", level: 2, positive: true },
      Fibre: { value: "9.7g", level: 2, positive: true },
    },
    alternatives: [],
  },
  {
    id: 4,
    name: "100% Pineapple Juice",
    brand: "Del Monte",
    weight: "1L",
    price: "KES 250",
    score: "C",
    imageUrl: placeholderImage("delmonte-pineapple-juice"),
    nutrients: {
      Energy: { value: "54 kcal", level: 1 },
      Fat: { value: "0.1g", level: 0 },
      Saturates: { value: "0.0g", level: 0 },
      Sugars: { value: "12.5g", level: 2 },
      Salt: { value: "0.01g", level: 0 },
      Protein: { value: "0.4g", level: 0, positive: true },
      Fibre: { value: "0.1g", level: 0, positive: true },
    },
    alternatives: ["Del Monte No Added Sugar Pineapple Juice — B", "Pick n Peel Fresh Pineapple — A"],
  },
  {
    id: 5,
    name: "Sunflower Cooking Oil",
    brand: "Fresh Fri",
    weight: "2L",
    price: "KES 580",
    score: "B",
    imageUrl: placeholderImage("fresh-fri-sunflower-oil"),
    nutrients: {
      Energy: { value: "824 kcal", level: 2 },
      Fat: { value: "91.6g", level: 2 },
      Saturates: { value: "11.9g", level: 1 },
      Sugars: { value: "0.0g", level: 0 },
      Salt: { value: "0.0g", level: 0 },
      Protein: { value: "0.0g", level: 0, positive: true },
      Fibre: { value: "0.0g", level: 0, positive: true },
    },
    alternatives: ["Olive Gold Extra Virgin Olive Oil — A", "Rina Sunflower Oil — B"],
  },
  {
    id: 6,
    name: "Chicken Flavour Instant Noodles",
    brand: "Indomie",
    weight: "70g",
    price: "KES 50",
    score: "D",
    imageUrl: placeholderImage("indomie-chicken-noodles"),
    nutrients: {
      Energy: { value: "436 kcal", level: 2 },
      Fat: { value: "14.0g", level: 2 },
      Saturates: { value: "6.5g", level: 2 },
      Sugars: { value: "3.0g", level: 0 },
      Salt: { value: "2.40g", level: 2 },
      Protein: { value: "9.0g", level: 1, positive: true },
      Fibre: { value: "2.0g", level: 0, positive: true },
    },
    alternatives: ["Whole Wheat Spaghetti — B", "Soko Millet Porridge Flour — A"],
  },
];

export const POPUP_ITEMS = PRODUCTS.map((p) => ({
  name: p.name,
  brand: p.brand,
  score: p.score as Grade,
}));

export const SCORE_COUNT: Record<Grade, number> = PRODUCTS.reduce(
  (acc, p) => {
    acc[p.score] += 1;
    return acc;
  },
  { A: 0, B: 0, C: 0, D: 0, E: 0 } as Record<Grade, number>,
);

export const TREND_DATA = [
  { month: "Jan", score: 2.8 },
  { month: "Feb", score: 2.6 },
  { month: "Mar", score: 2.3 },
  { month: "Apr", score: 2.0 },
  { month: "May", score: 1.9 },
  { month: "Jun", score: 1.7 },
];

export const CATEGORY_DATA = [
  { name: "Cereals", avg: 1.4, count: 6 },
  { name: "Dairy", avg: 1.8, count: 9 },
  { name: "Cooking Oils", avg: 2.1, count: 5 },
  { name: "Beverages", avg: 2.9, count: 11 },
  { name: "Processed Meat", avg: 3.6, count: 7 },
];
