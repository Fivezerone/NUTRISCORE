// Shared Nutri-Score grade colour system.
// Used by all three templates: inline-widget, popup, and dashboard.

import type { Grade, NutriColor } from "./types";

export const GRADE_COLORS: Record<Grade, NutriColor> = {
  A: { bg: "#1E8F4E", text: "#ffffff", light: "#E6F4ED" },
  B: { bg: "#85BB2F", text: "#ffffff", light: "#EFF7E4" },
  C: { bg: "#FBCA31", text: "#0D1526", light: "#FEF9E7" },
  D: { bg: "#EE8100", text: "#ffffff", light: "#FEF3E3" },
  E: { bg: "#E63E11", text: "#ffffff", light: "#FDECE8" },
};

export const ALL_GRADES: Grade[] = ["A", "B", "C", "D", "E"];
