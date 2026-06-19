// Template 2: Toolbar Popup
//
// In the real extension this is its own small HTML page (popup.html),
// loaded by the browser when the user clicks the extension's toolbar icon.

import { useState } from "react";
import { ShieldCheck, ExternalLink, BarChart2 } from "lucide-react";

import { ALL_GRADES, GRADE_COLORS } from "../shared/nutriscore/constants";
import { SectionLabel } from "../shared/nutriscore/primitives";
import { POPUP_ITEMS, SCORE_COUNT } from "../shared/nutriscore/mock-data";

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
        style={{ backgroundColor: value ? "#1E8F4E" : "#c5ccd8" }}
      >
        <div
          className="absolute top-[3px] w-[14px] h-[14px] bg-white rounded-full shadow transition-all"
          style={{ left: value ? "19px" : "3px" }}
        />
      </button>
    </div>
  );
}

export default function Popup() {
  const [activeTab, setActiveTab] = useState<"products" | "settings">("products");
  const [privacy, setPrivacy] = useState(true);
  const [autoScan, setAutoScan] = useState(true);
  const [retailer, setRetailer] = useState("Ocado");

  const total = POPUP_ITEMS.length;

  return (
    <section className="py-16 px-8 bg-secondary/40 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-16 items-start">
          <SectionLabel
            index="02 / TOOLBAR POPUP"
            title="Extension icon popup"
            desc="Lightweight page summary — all detected product scores, quick settings, and a link out to the trend dashboard."
          />

          {/* Popup mockup */}
          <div className="flex flex-col items-center">
            {/* Extension icon + arrow */}
            <div className="flex justify-end w-[320px] pr-3 mb-0">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-[#0D1526] rounded-lg flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div
                  className="w-0 h-0 mt-0.5"
                  style={{
                    borderLeft: "7px solid transparent",
                    borderRight: "7px solid transparent",
                    borderTop: "7px solid #0D1526",
                  }}
                />
              </div>
            </div>

            {/* Popup window */}
            <div className="w-[320px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Header */}
              <div className="bg-[#0D1526] px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-sm font-semibold tracking-tight">NutriLens</span>
                  </div>
                  <span className="text-white/40 text-[10px] font-mono">{retailer}</span>
                </div>
                <p className="text-white/50 text-[11px] mb-3">
                  {total} products scanned on this page
                </p>

                {/* Score distribution bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                  {ALL_GRADES.map((g) => {
                    const count = SCORE_COUNT[g];
                    if (count === 0) return null;
                    return (
                      <div
                        key={g}
                        style={{ flex: count, backgroundColor: GRADE_COLORS[g].bg }}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-1.5">
                  {ALL_GRADES.map((g) => {
                    const count = SCORE_COUNT[g];
                    if (count === 0) return null;
                    return (
                      <span
                        key={g}
                        className="text-[10px] font-mono font-medium"
                        style={{ color: GRADE_COLORS[g].bg }}
                      >
                        {count}×{g}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {(["products", "settings"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-[11px] font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "text-foreground border-b-2 border-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab: Products */}
              {activeTab === "products" ? (
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {POPUP_ITEMS.map((item, i) => {
                    const c = GRADE_COLORS[item.score];
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <div
                          className="w-7 h-7 rounded-md text-[11px] font-bold font-mono flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: c.bg, color: c.text }}
                        >
                          {item.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate leading-none mb-0.5">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{item.brand}</p>
                        </div>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.bg }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Tab: Settings */
                <div className="px-4 py-3.5 space-y-4">
                  <div>
                    <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-2">
                      ACTIVE RETAILER
                    </p>
                    <div className="flex gap-1.5">
                      {["Ocado", "Tesco", "Waitrose"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRetailer(r)}
                          className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                            retailer === r
                              ? "bg-foreground text-white"
                              : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <ToggleRow
                      label="Privacy mode"
                      desc="Don't log product history to IndexedDB"
                      value={privacy}
                      onChange={setPrivacy}
                    />
                    <ToggleRow
                      label="Auto-scan"
                      desc="Scan products automatically on page load"
                      value={autoScan}
                      onChange={setAutoScan}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border flex items-center justify-between bg-muted/20">
                <span className="text-[9px] text-muted-foreground font-mono">v2.1.0</span>
                <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Full Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
