// NutriScoreBadge — the actual production widget injected next to a real
// product element on a retailer page.
//
// This is the part of the old "inline-widget" showcase template that
// matters in production: the score badge + expandable nutrient panel.
// Everything else from the showcase (the simulated Ocado chrome bar, the
// fake product image/name/price row, "Add to basket" buttons) was scaffold
// for the design preview only — on a real page those already exist, since
// they belong to the retailer, not to us. We only ever inject this badge.
//
// Mounted into a Shadow DOM root by the content script (see
// src/content-script/index.tsx), so it carries no assumptions about
// being inside a React tree owned by the host page.

import { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, X, Loader2, HelpCircle, AlertTriangle } from "lucide-react";

import type { Grade, Product } from "../types";
import { GRADE_COLORS } from "../constants";
import { GradeChip, GradeScale, NutrientBar } from "../primitives";

// The badge has to represent more states than the showcase ever needed,
// because scoring now happens asynchronously (scrape -> message background
// worker -> score engine / local lookup -> respond). Phase 3 explicitly
// calls for graceful loading/error handling, so this is that.
export type BadgeState =
  | { status: "loading" }
  | { status: "scored"; product: Product }
  | { status: "unscored" } // scraped fine, but no score data available yet
  | { status: "error"; message?: string };

function stop(e: React.SyntheticEvent) {
  // The host page's product card is almost always wrapped in its own <a>
  // (Jumia's listing cards are `a.core`). Without this, clicking the badge
  // would navigate away from the page instead of toggling the panel.
  e.preventDefault();
  e.stopPropagation();
}

function NeutralBadge({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "loading" | "muted" | "error";
}) {
  const bg = tone === "error" ? "#FDECE8" : "#F4F6FA";
  const fg = tone === "error" ? "#E63E11" : "#6C7A91";
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium"
      style={{ backgroundColor: bg, color: fg, borderColor: "rgba(13,21,38,0.1)" }}
    >
      {icon}
      {label}
    </div>
  );
}

function ScoredBadge({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);
  const c = GRADE_COLORS[product.score];

  return (
    <div className="relative inline-block" style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          stop(e);
          setExpanded((v) => !v);
        }}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all hover:shadow-md"
        style={{
          backgroundColor: expanded ? c.light : "#F4F6FA",
          borderColor: expanded ? c.bg + "50" : "rgba(13,21,38,0.1)",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg font-bold text-sm font-mono flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: c.bg, color: c.text }}
        >
          {product.score}
        </div>
        <div className="hidden sm:flex flex-col items-start gap-0.5">
          <p className="text-[7px] text-muted-foreground font-mono tracking-widest leading-none">NUTRI-SCORE</p>
          <GradeScale active={product.score} />
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div
          className="absolute right-0 top-full mt-2 w-[272px] rounded-2xl border shadow-2xl z-50 overflow-hidden"
          style={{ borderColor: c.bg + "30" }}
        >
          <div className="px-4 pt-4 pb-3.5" style={{ backgroundColor: c.bg }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: c.text + "AA" }}>
                  NUTRI-SCORE
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black font-mono leading-none" style={{ color: c.text }}>
                    {product.score}
                  </span>
                  <GradeScale active={product.score} />
                </div>
              </div>
              <button
                onClick={(e) => {
                  stop(e);
                  setExpanded(false);
                }}
                className="opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                style={{ color: c.text }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-card px-4 py-3">
            <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-3">PER 100G</p>
            <div className="space-y-2.5">
              {Object.entries(product.nutrients).map(([name, n]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-16 flex-shrink-0">{name}</span>
                  <NutrientBar level={n.level} positive={n.positive} />
                  <span className="text-[11px] font-mono text-foreground ml-auto">{n.value}</span>
                </div>
              ))}
            </div>
          </div>

          {product.alternatives.length > 0 && (
            <div style={{ backgroundColor: "#E6F4ED" }} className="px-4 py-3">
              <p className="text-[9px] font-mono tracking-widest mb-2.5" style={{ color: "#1E8F4E" }}>
                HEALTHIER ALTERNATIVES
              </p>
              <div className="space-y-2">
                {product.alternatives.map((alt) => {
                  const parts = alt.split(" — ");
                  const altName = parts[0];
                  const altGrade = parts[1] as Grade;
                  return (
                    <div key={alt} className="flex items-center gap-2">
                      <GradeChip grade={altGrade} size="xs" />
                      <span className="text-[11px] font-medium" style={{ color: "#1E8F4E" }}>
                        {altName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-card px-4 py-2 border-t border-border flex items-center justify-between">
            <span className="text-[9px] font-mono text-muted-foreground">NutriScore · Checkout Tool</span>
            <ShieldCheck className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

export function NutriScoreBadge({ state }: { state: BadgeState }) {
  switch (state.status) {
    case "loading":
      return (
        <NeutralBadge
          tone="loading"
          icon={<Loader2 className="w-3 h-3 animate-spin" />}
          label="Scoring…"
        />
      );
    case "scored":
      return <ScoredBadge product={state.product} />;
    case "unscored":
      return (
        <NeutralBadge
          tone="muted"
          icon={<HelpCircle className="w-3 h-3" />}
          label="Not scored yet"
        />
      );
    case "error":
      return (
        <NeutralBadge
          tone="error"
          icon={<AlertTriangle className="w-3 h-3" />}
          label="Score unavailable"
        />
      );
  }
}
