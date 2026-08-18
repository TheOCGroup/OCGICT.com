import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Rule70Calculator, StrategyComparisonMatrix } from "@/components/Calculators";
import { ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Layers, Landmark, Calendar, Bot } from "lucide-react";
import { Link } from "wouter";

const paths = [
  {
    title: "Fix & Flip",
    subtitle: "Acquire · Renovate · Resale · Build Liquid Capital",
    body: "For many investors, a disciplined renovation-and-resale project is the optimal way to build capital, learn transaction execution, and expand investable reserves. OCG explores lender-funded acquisition and rehab first so your cash remains intact as an emergency buffer.",
    capitalRole: "Preserved as emergency safety reserves & lender strength",
    timeline: "4 – 8 Months",
  },
  {
    title: "BRRRR",
    subtitle: "Acquire · Renovate · Rent · Refinance · Repeat",
    body: "A portfolio growth method when purchase basis, rehab scope, rental income, refinance seasoning, and lender debt service coverage (DSCR) align. OCG stress-tests the refinance exit before acquisition to ensure the numbers hold up.",
    capitalRole: "Short-term bridge capital recycled into long-term equity",
    timeline: "6 – 12 Months per cycle",
  },
  {
    title: "Buy & Hold",
    subtitle: "Acquire · Stabilize · Operate · Build Long-Term Wealth",
    body: "For investors prioritizing steady cash flow, appreciation potential, and equity growth. Down payment requirements (typically 20-25%), closing costs, and ongoing operating reserves place different demands on available liquidity.",
    capitalRole: "Down payment equity basis + operating safety reserves",
    timeline: "Long-term (5 – 30+ Years)",
  },
  {
    title: "Creative & Structured Financing",
    subtitle: "Seller Financing · Private Capital · Bridge Debt",
    body: "Seller financing, private equity partnerships, and bridge notes provide legitimate structural flexibility when bank lending is ill-suited. G and OCG model these structures strictly within legal and verified underwriting boundaries.",
    capitalRole: "Tailored to specific partnership or seller agreement",
    timeline: "Deal-specific",
  },
];

export default function Services() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-white selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 space-y-24 md:space-y-36">
        {/* Page Hero */}
        <section className="container">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              <TrendingUp size={14} /> Investment Pathways & Financing Strategy
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.98] text-white">
              The strategy should fit the investor —<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
                not the other way around.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">
              OCG helps you navigate the trade-offs between building liquid capital, expanding cash flow, preserving safety reserves, financing renovation, and creating a disciplined multi-year investment plan.
            </p>
          </div>
        </section>

        {/* Strategy Grid */}
        <section className="container">
          <div className="grid lg:grid-cols-2 gap-6">
            {paths.map((p, i) => (
              <div
                key={p.title}
                className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400 uppercase tracking-widest">
                      Pathway 0{i + 1}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{p.timeline}</span>
                  </div>
                  <h2 className="mt-4 text-3xl font-bold text-white tracking-tight">{p.title}</h2>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {p.subtitle}
                  </div>
                  <p className="mt-4 text-sm text-slate-300 leading-relaxed">{p.body}</p>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 text-xs">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    Strategic Capital Role:
                  </span>
                  <div className="text-slate-200 font-semibold mt-1">{p.capitalRole}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Comparison Matrix */}
        <section className="container">
          <StrategyComparisonMatrix />
        </section>

        {/* Interactive 70% Calculator */}
        <section className="container">
          <Rule70Calculator />
        </section>

        {/* Financing Philosophy Feature */}
        <section className="container">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 to-[#0B132B] p-8 md:p-14 shadow-2xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
              <ShieldCheck size={16} /> OCG Capital Allocation Philosophy
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              Why We Treat Investor Liquidity As Strategic Armor
            </h3>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl">
              If an investor has $50,000 in liquid capital, our immediate instinct is NOT to spend $50,000 on purchase equity. For fix-and-flips, we seek lender capital to finance the acquisition and renovation when the asset and borrower qualify. That $50,000 serves a far more critical role as proof of execution capacity, holding cost buffers, and protection against supply chain or municipal permitting delays.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
              >
                <Calendar size={14} /> Schedule Strategy Discussion
              </Link>
              <a
                href="#g"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all"
              >
                <Bot size={14} className="text-blue-400" /> Diagnose with G
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
