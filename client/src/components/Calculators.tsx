import React, { useState, useId } from "react";
import { Calculator, HelpCircle, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Layers, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export function Rule70Calculator() {
  const [arv, setArv] = useState<number>(240000);
  const [rehab, setRehab] = useState<number>(45000);
  const arvInputId = useId();
  const rehabInputId = useId();

  const seventyPercent = Math.round(arv * 0.70);
  const mao = Math.max(seventyPercent - rehab, 0);
  const spread = arv - (mao + rehab);
  const recommendedReserves = Math.round(rehab * 0.20 + 7500);

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0B0F17] p-6 lg:p-10 shadow-2xl">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          <Calculator size={15} /> Strategic Underwriting Framework
        </div>
        <h3 className="mt-2 text-3xl md:text-4xl font-bold text-white tracking-tight">
          The 70% Rule & MAO Explorer
        </h3>
        <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-400">
          In acquisition underwriting, the 70% framework establishes an entry ceiling so that unexpected holding periods, material price adjustments, or market shifts do not compress your equity to zero.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
        {/* Sliders and Inputs */}
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
              <label htmlFor={arvInputId}>After Repair Value (ARV)</label>
              <span className="text-lg font-bold text-blue-400">${arv.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Projected market value of the property once fully renovated.</p>
            <input
              id={arvInputId}
              type="range"
              min="80000"
              max="500000"
              step="5000"
              value={arv}
              onChange={(e) => setArv(Number(e.target.value))}
              aria-label="After Repair Value (ARV)"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>$80k</span>
              <span>$250k</span>
              <span>$500k</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
              <label htmlFor={rehabInputId}>Estimated Renovation Scope (Rehab)</label>
              <span className="text-lg font-bold text-amber-400">${rehab.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Materials, labor, contractor margins, and permitting costs.</p>
            <input
              id={rehabInputId}
              type="range"
              min="10000"
              max="150000"
              step="2500"
              value={rehab}
              onChange={(e) => setRehab(Number(e.target.value))}
              aria-label="Estimated Renovation Scope (Rehab)"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>$10k</span>
              <span>$75k</span>
              <span>$150k</span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-1">
              Formula Breakdown
            </div>
            <div className="font-mono text-xs text-slate-300">
              MAO = (${arv.toLocaleString()} × 70%) − ${rehab.toLocaleString()}
            </div>
            <div className="font-mono text-xs text-blue-400 mt-1">
              MAO = ${seventyPercent.toLocaleString()} − ${rehab.toLocaleString()} = <strong className="text-white">${mao.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Output Metrics & OCG Philosophy */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-[#0c1322] p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Maximum Allowable Offer (MAO)
            </span>
            <div className="mt-1 text-4xl font-extrabold text-white tracking-tight">
              ${mao.toLocaleString()}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              The highest purchase price you should offer to protect margin, holding costs, and lender debt service.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-xs">
              <div>
                <span className="text-slate-500">Gross Margin Buffer:</span>
                <div className="font-semibold text-slate-200">${spread.toLocaleString()} (30%)</div>
              </div>
              <div>
                <span className="text-slate-500">Strategic Reserve Rec:</span>
                <div className="font-semibold text-emerald-400">${recommendedReserves.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <ShieldCheck size={16} className="text-blue-400" />
              OCG Financing Philosophy
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              For fix-and-flips, OCG aims to structure lender capital for purchase and rehab where possible. Your personal liquidity is better held as financial strength, reserves, and contingency armor against unforeseen delays rather than being tied up in illiquid dirt.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 leading-normal">
            <strong>Disclaimer:</strong> The 70% rule is an underwriting heuristic, not a financing guarantee. Actual lender loan-to-cost (LTC), interest rates, and loan-to-value (LTV) depend on market conditions, borrower track record, and verified appraisals.
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrategyComparisonMatrix() {
  const [selectedStrategy, setSelectedStrategy] = useState<"flip" | "brrrr" | "hold" | "unsure">("flip");

  const strategiesData = {
    flip: {
      name: "Fix & Flip",
      headline: "Acquire → Renovate → Sell → Build Capital",
      capital: "Lender-backed acquisition + rehab; client liquidity preserved as safety reserves",
      timeline: "4 – 8 Months",
      involvement: "Managed through OCG construction & design execution",
      financing: "Hard money / Bridge / Private Capital",
      exit: "Retail resale to owner-occupant or end investor",
      bestFor: "Building liquid capital, learning transaction cycles, and growing personal equity"
    },
    brrrr: {
      name: "BRRRR",
      headline: "Acquire → Renovate → Rent → Refinance → Repeat",
      capital: "Initial acquisition bridge capital followed by long-term DSCR refinance takeout",
      timeline: "6 – 12 Months per cycle",
      involvement: "Renovation coordination + tenant placement + refinance underwriting",
      financing: "Short-term bridge $\\rightarrow$ Long-term DSCR (30-year fixed)",
      exit: "Refinance out capital basis and hold cash-flowing asset long term",
      bestFor: "Investors seeking to recycle the same capital into multiple rental properties"
    },
    hold: {
      name: "Buy & Hold",
      headline: "Acquire → Stabilize → Operate → Build Equity",
      capital: "20% – 25% down payment + closing costs + operating reserves",
      timeline: "Long-term (5 – 30+ Years)",
      involvement: "Asset stabilization and property management oversight",
      financing: "Conventional Investment or DSCR Long-Term Debt",
      exit: "Ongoing cash distribution, loan paydown, and long-term tax advantages",
      bestFor: "High-income earners or established investors seeking passive wealth and tax shielding"
    },
    unsure: {
      name: "Not Sure Yet",
      headline: "Goals → Capital → Risk Profile → Optimal Fit",
      capital: "Flexible diagnostics based on available liquid reserves ($25k to $250k+)",
      timeline: "Determined after personal strategy diagnostic",
      involvement: "Tailored to your schedule and desired learning curve",
      financing: "Evaluated across all available lending structures",
      exit: "Configured to match your 1-year and 5-year financial objectives",
      bestFor: "Investors who want objective guidance before committing to a rigid path"
    }
  };

  const current = strategiesData[selectedStrategy];

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0B0F17] p-6 lg:p-10 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            <Layers size={15} /> Objective-Driven Alignment
          </div>
          <h3 className="mt-1 text-3xl font-bold text-white tracking-tight">
            Compare Investment Pathways
          </h3>
        </div>

        {/* Strategy Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {(["flip", "brrrr", "hold", "unsure"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedStrategy(key)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedStrategy === key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {strategiesData[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr] items-start">
        {/* Selected Card Deep Dive */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
              Strategy Focus
            </span>
            <h4 className="text-2xl font-bold text-white mt-1">{current.name}</h4>
            <p className="text-xs font-mono text-slate-400 mt-1">{current.headline}</p>
          </div>

          <div className="rounded-xl bg-blue-950/30 border border-blue-800/30 p-4">
            <span className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold">
              Optimal Investor Fit
            </span>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">
              {current.bestFor}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={selectedStrategy === "unsure" ? "#g" : "/contact"}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
            >
              {selectedStrategy === "unsure" ? "Consult with G" : `Explore ${current.name} with OCG`}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Detailed Breakdown Dimensions */}
        <div className="grid gap-3">
          {[
            { label: "Capital Allocation", val: current.capital },
            { label: "Execution Timeline", val: current.timeline },
            { label: "Operational Involvement", val: current.involvement },
            { label: "Financing Structure", val: current.financing },
            { label: "Target Exit", val: current.exit },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                {item.label}
              </div>
              <div className="mt-1 text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
