import React, { useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, Zap, ArrowRight, Layers, FileSpreadsheet, Eye, Sparkles } from "lucide-react";

export default function OriginStorySequence() {
  const [viewMode, setViewMode] = useState<"pressure" | "compressed">("compressed");

  const tasks = [
    { name: "Inspect Condition", trad: "4-8 hours", ocg: "Rapid intake & visual tagging", icon: Eye },
    { name: "Document Property", trad: "Manual notes", ocg: "Structured visual media intake", icon: Layers },
    { name: "Scope Renovation", trad: "24-48 hours", ocg: "Systematized category scoping", icon: FileSpreadsheet },
    { name: "Estimate Rehab Costs", trad: "Days waiting on subs", ocg: "Wichita-adjusted unit rate tables", icon: Zap },
    { name: "Research Comps", trad: "3-5 hours on MLS", ocg: "Micro-neighborhood radius comps", icon: Sparkles },
    { name: "Develop Design Strategy", trad: "Ad-hoc guesswork", ocg: "Target buyer value-add profiles", icon: Layers },
    { name: "Underwrite Numbers (MAO)", trad: "Spreadsheet iterations", ocg: "Multi-scenario financial modeling", icon: CheckCircle2 },
    { name: "Structure Financing", trad: "Broker delays", ocg: "Pre-modeled lender parameters", icon: Zap },
    { name: "Make Informed Decision", trad: "Fatigued & rushed", ocg: "Clear decision dashboard", icon: CheckCircle2 },
    { name: "Submit Confident Offer", trad: "Often missed window", ocg: "Rapid high-conviction execution", icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0B0F17] p-6 lg:p-12 shadow-2xl">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] items-center">
        {/* Story Narrative */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
            The OCG AI Origin Story
          </div>

          <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
            We didn't set out to build AI.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              We needed a faster way to make good decisions.
            </span>
          </h3>

          <p className="text-sm md:text-base leading-relaxed text-slate-300">
            Attractive off-market real estate opportunities in Wichita operate on severely compressed timelines. Showing windows may be 24 to 48 hours. Access is limited.
          </p>

          <p className="text-sm md:text-base leading-relaxed text-slate-400">
            Before we could responsibly move forward, we still had to document the asset, estimate rehab, comp the radius, structure the debt, and run the numbers.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Core Operating Principle
            </div>
            <div className="text-lg font-bold text-white tracking-tight">
              "The process was right. The timing wasn't. So we built the systems we wished we'd had."
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setViewMode("pressure")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === "pressure"
                  ? "bg-red-500/20 border border-red-500/40 text-red-200"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              The Traditional Time Pressure
            </button>
            <button
              onClick={() => setViewMode("compressed")}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === "compressed"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              The OCG Reorganized System
            </button>
          </div>
        </div>

        {/* Visual Workflow Stack */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              {viewMode === "pressure" ? (
                <>
                  <AlertTriangle size={16} className="text-amber-400" />
                  <span>Compressed Decision Window (Traditional Friction)</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="text-blue-400" />
                  <span>OCG Intelligent Pipeline Compression</span>
                </>
              )}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {viewMode === "pressure" ? "10 Manual Steps" : "Unified Intelligence"}
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {tasks.map((t, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs transition-all ${
                  viewMode === "pressure"
                    ? "border-slate-800/80 bg-slate-900/40 text-slate-300"
                    : "border-blue-900/30 bg-blue-950/15 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-slate-500">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="font-semibold">{t.name}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-[11px] ${
                      viewMode === "pressure" ? "text-amber-400/90" : "text-blue-400 font-semibold"
                    }`}
                  >
                    {viewMode === "pressure" ? t.trad : t.ocg}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <p className="text-xs text-slate-400">
              {viewMode === "pressure"
                ? "Traditional outcome: Decisions get rushed or opportunities are lost to competitors."
                : "OCG outcome: 10 heavy operational steps compressed, giving our team the clarity to make thoughtful, high-conviction decisions."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
