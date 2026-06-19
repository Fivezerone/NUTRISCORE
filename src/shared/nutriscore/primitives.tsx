// Shared visual primitives reused across all three templates.

import type { Grade, Level } from "./types";
import { GRADE_COLORS, ALL_GRADES } from "./constants";

export function GradeChip({
  grade,
  size = "md",
}: {
  grade: Grade;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const c = GRADE_COLORS[grade];
  const cls = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  }[size];
  return (
    <div
      className={`${cls} rounded font-bold font-mono flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {grade}
    </div>
  );
}

export function GradeScale({ active }: { active: Grade }) {
  return (
    <div className="flex items-end gap-[3px]">
      {ALL_GRADES.map((g) => {
        const c = GRADE_COLORS[g];
        const isActive = g === active;
        return (
          <div
            key={g}
            className={`flex items-center justify-center font-bold font-mono transition-all rounded-sm ${
              isActive ? "w-[22px] h-[18px] text-[10px]" : "w-[16px] h-[14px] text-[8px] opacity-55"
            }`}
            style={{ backgroundColor: c.bg, color: c.text }}
          >
            {g}
          </div>
        );
      })}
    </div>
  );
}

export function NutrientBar({ level, positive }: { level: Level; positive?: boolean }) {
  const colors = positive
    ? ["#E63E11", "#FBCA31", "#1E8F4E"]
    : ["#1E8F4E", "#FBCA31", "#E63E11"];
  const widths = ["33%", "66%", "100%"];
  return (
    <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
      <div
        className="h-full rounded-full"
        style={{ width: widths[level], backgroundColor: colors[level] }}
      />
    </div>
  );
}

export function SectionLabel({ index, title, desc }: { index: string; title: string; desc: string }) {
  return (
    <div className="mb-10">
      <p className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] mb-2">{index}</p>
      <h2 className="text-2xl font-semibold text-foreground mb-2 leading-tight">{title}</h2>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">{desc}</p>
    </div>
  );
}
