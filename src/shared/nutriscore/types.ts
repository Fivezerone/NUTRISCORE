// Shared types for the NutriScore extension UI.
// Used by all three templates: inline-widget, popup, and dashboard.

export type Grade = "A" | "B" | "C" | "D" | "E";
export type Level = 0 | 1 | 2;

export interface NutriColor {
  bg: string;
  text: string;
  light: string;
}

export interface NutrientEntry {
  value: string;
  level: Level;
  positive?: boolean;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  weight: string;
  price: string;
  score: Grade;
  /** Fully-qualified image URL. Placeholder imagery until Phase 2 wires in
   *  real product photos from Open Food Facts. */
  imageUrl: string;
  nutrients: Record<string, NutrientEntry>;
  alternatives: string[];
}
