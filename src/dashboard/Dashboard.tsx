// Template 3: Trend Dashboard
//
// In the real extension this is its own standalone extension page
// (dashboard.html), reading aggregated history from IndexedDB.

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ShieldCheck, RefreshCw } from "lucide-react";

import type { Grade } from "../shared/nutriscore/types";
import { GRADE_COLORS } from "../shared/nutriscore/constants";
import { GradeChip, GradeScale, SectionLabel } from "../shared/nutriscore/primitives";
import { TREND_DATA, CATEGORY_DATA, POPUP_ITEMS } from "../shared/nutriscore/mock-data";

export default function Dashboard() {
  const avgScoreLetter: Grade = "B";

  function barColor(avg: number): string {
    if (avg <= 1.5) return "#1E8F4E";
    if (avg <= 2.5) return "#85BB2F";
    if (avg <= 3.5) return "#FBCA31";
    if (avg <= 4.5) return "#EE8100";
    return "#E63E11";
  }

  return (
    <section className="py-16 px-8 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        <SectionLabel
          index="03 / TREND DASHBOARD"
          title="Personal trend dashboard"
          desc="Standalone extension page reading from IndexedDB. Charts average score over time and breaks down sessions by food category."
        />

        {/* Dashboard frame */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Dashboard header */}
          <div className="px-6 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-foreground" />
              <span className="font-semibold text-sm text-foreground tracking-tight">
                NutriLens Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">Jan – Jun 2025</span>
              <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
            {[
              {
                label: "AVG NUTRI-SCORE",
                content: (
                  <div className="flex items-center gap-2.5 mt-1">
                    <div
                      className="w-10 h-10 rounded-lg font-black text-xl font-mono flex items-center justify-center"
                      style={{
                        backgroundColor: GRADE_COLORS[avgScoreLetter].bg,
                        color: GRADE_COLORS[avgScoreLetter].text,
                      }}
                    >
                      {avgScoreLetter}
                    </div>
                    <GradeScale active={avgScoreLetter} />
                  </div>
                ),
                sub: "This month",
              },
              {
                label: "PRODUCTS SCANNED",
                content: (
                  <p className="text-2xl font-bold font-mono text-foreground mt-1">48</p>
                ),
                sub: "Since January",
              },
              {
                label: "SCORE IMPROVEMENT",
                content: (
                  <p className="text-2xl font-bold font-mono mt-1" style={{ color: "#1E8F4E" }}>
                    +1.1
                  </p>
                ),
                sub: "Grade points vs. Jan",
              },
              {
                label: "BEST CATEGORY",
                content: (
                  <div className="flex items-center gap-2 mt-1">
                    <GradeChip grade="A" size="sm" />
                    <span className="text-sm font-medium text-foreground">Cereals</span>
                  </div>
                ),
                sub: "Avg. score 1.4",
              },
            ].map((stat, i) => (
              <div key={i} className="px-5 py-4">
                <p className="text-[9px] font-mono text-muted-foreground tracking-widest">{stat.label}</p>
                {stat.content}
                <p className="text-[10px] text-muted-foreground mt-1.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 divide-x divide-border">
            {/* Trend area chart */}
            <div className="px-6 py-5">
              <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-4">
                AVERAGE SCORE TREND (1=A · 5=E)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={TREND_DATA}
                  margin={{ top: 4, right: 8, bottom: 0, left: -22 }}
                >
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E8F4E" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#1E8F4E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(13,21,38,0.06)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fill: "#6C7A91",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fill: "#6C7A91",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid rgba(13,21,38,0.1)",
                      borderRadius: 10,
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 16px rgba(13,21,38,0.08)",
                    }}
                    formatter={(v: number) => [v.toFixed(1), "Avg. score"]}
                    labelStyle={{ color: "#6C7A91", marginBottom: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#1E8F4E"
                    strokeWidth={2}
                    fill="url(#trendGrad)"
                    dot={{ fill: "#1E8F4E", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#1E8F4E", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category bar chart */}
            <div className="px-6 py-5">
              <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-4">
                AVERAGE SCORE BY CATEGORY
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={CATEGORY_DATA}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 52 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(13,21,38,0.06)"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fill: "#6C7A91",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      fill: "#6C7A91",
                    }}
                    width={52}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      border: "1px solid rgba(13,21,38,0.1)",
                      borderRadius: 10,
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 16px rgba(13,21,38,0.08)",
                    }}
                    formatter={(v: number) => [v.toFixed(1), "Avg. score"]}
                    labelStyle={{ color: "#6C7A91" }}
                  />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {CATEGORY_DATA.map((entry) => (
                      <Cell key={entry.name} fill={barColor(entry.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent scans row */}
          <div className="border-t border-border px-6 py-4 bg-muted/10">
            <p className="text-[9px] font-mono text-muted-foreground tracking-widest mb-3">RECENT SCANS</p>
            <div className="flex gap-2">
              {POPUP_ITEMS.map((item, i) => {
                const c = GRADE_COLORS[item.score];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 flex-1 bg-card border border-border rounded-xl px-3 py-2"
                  >
                    <div
                      className="w-6 h-6 rounded text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: c.bg, color: c.text }}
                    >
                      {item.score}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-foreground leading-none mb-0.5 truncate">
                        {item.brand}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate font-mono">
                        {item.name.split(" ").slice(0, 2).join(" ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
