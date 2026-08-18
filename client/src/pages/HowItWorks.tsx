import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TechnologyEcosystem from "@/components/TechnologyEcosystem";
import OriginStorySequence from "@/components/OriginStorySequence";
import { Search, Calculator, Workflow, Hammer, ArrowRight, ShieldCheck, CheckCircle2, Calendar, Bot } from "lucide-react";
import { Link } from "wouter";

const steps = [
  {
    num: "01",
    title: "Define Objectives & Capital Profile",
    body: "We start with what you are trying to accomplish: available liquid reserves, timeline constraints, risk tolerance, and desired involvement level. Determining the strategy comes before capital deployment.",
  },
  {
    num: "02",
    title: "Opportunity Discovery & Screening (HUNTER)",
    body: "HUNTER monitors off-market distress signals, municipal filings, tax discrepancies, and estate dispositions across Wichita micro-neighborhoods to surface high-signal prospects.",
  },
  {
    num: "03",
    title: "Rigorous Underwriting & Scoping (VICTOR)",
    body: "VICTOR deep-dives into physical condition, photographic evidence, 0.5-mile radius MLS comp clustering, Wichita contractor rate tables, and 70% rule MAO thresholds.",
  },
  {
    num: "04",
    title: "Strategic Financing & Capital Architecture",
    body: "OCG configures the financing package. For flips, lender debt is leveraged for acquisition and rehab to preserve your liquidity. For DSCR holds, long-term takeout debt is structured.",
  },
  {
    num: "05",
    title: "Architectural Renovation & Value Creation",
    body: "Renovation is treated as investment strategy. Interior layout optimization, material selection, curb appeal enhancement, and cost sensitivity are executed to maximize resale equity.",
  },
  {
    num: "06",
    title: "Pipeline Operations & Execution (PIPER + OCG)",
    body: "PIPER tracks inspection contingencies, title clearances, and lender underwriting packets while OCG coordinates contractors, walkthroughs, and ultimate asset monetization.",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-white selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 space-y-24 md:space-y-36">
        {/* Header */}
        <section className="container">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              The OCG Methodology
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.98] text-white">
              Property → Evidence → Possibility → Numbers → Capital → Decision.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">
              Technology compresses and organizes the work. The investment decision remains grounded in empirical evidence, professional verification, and human judgment.
            </p>
          </div>
        </section>

        {/* 6-Step Methodology Progression */}
        <section className="container">
          <div className="grid gap-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className="grid md:grid-cols-[100px_1fr_1.5fr] gap-6 items-center rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 hover:border-slate-700 transition-all shadow-xl"
              >
                <div className="font-mono text-3xl md:text-4xl font-extrabold text-blue-400">
                  {s.num}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {s.title}
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-slate-400">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Origin Story Component */}
        <section className="container">
          <OriginStorySequence />
        </section>

        {/* Technology Ecosystem Component */}
        <section className="container">
          <TechnologyEcosystem />
        </section>

        {/* Next Step CTA */}
        <section className="container">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 to-[#0B132B] p-8 md:p-14 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Experience OCG Firsthand
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                See how our systems apply to your personal investment goals.
              </h3>
              <p className="text-sm text-slate-300">
                Connect with our team for a comprehensive strategic consultation and Wichita market briefing.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
              >
                <Calendar size={14} /> Book Strategy Session
              </Link>
              <a
                href="#g"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all"
              >
                <Bot size={14} className="text-blue-400" /> Talk with G
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
