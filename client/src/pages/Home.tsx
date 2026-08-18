import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OCGWordmark from "@/components/OCGWordmark";
import InteractiveTransformSlider from "@/components/InteractiveTransformSlider";
import OriginStorySequence from "@/components/OriginStorySequence";
import TechnologyEcosystem from "@/components/TechnologyEcosystem";
import GExperience from "@/components/GExperience";
import { Rule70Calculator, StrategyComparisonMatrix } from "@/components/Calculators";
import { ArrowRight, CheckCircle2, Bot, Calendar, Building2, Home as HomeIcon, Layers, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-white selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="space-y-24 md:space-y-36">
        {/* ============================================================
            SECTION 01: CINEMATIC HERO
            ============================================================ */}
        <section className="relative min-h-[92vh] pt-32 pb-20 flex items-center overflow-hidden border-b border-slate-800/80">
          {/* Ambient Lighting & Grid */}
          <div className="absolute inset-0 hero-grid opacity-60 pointer-events-none" />
          <div className="absolute top-1/4 right-[10%] h-[480px] w-[480px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-10 left-[5%] h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

          <div className="container relative z-10">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-300 mb-6"
                >
                  <Sparkles size={13} className="shrink-0" />
                  <span>Wichita, Kansas · Real Estate Investment + Acquisition</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="mb-6"
                >
                  <OCGWordmark size="hero" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.12 }}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] text-white"
                >
                  REAL ESTATE INVESTING.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-400">
                    BUILT SMARTER.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.18 }}
                  className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-2xl"
                >
                  Acquire Intelligently. Transform Strategically. Build Lasting Value.
                  OCG combines disciplined acquisition underwriting, architectural renovation design, strategic financing structures, and internal AI systems to execute with precision in the Wichita market.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.24 }}
                  className="mt-8 flex flex-wrap gap-3.5"
                >
                  <Link
                    href="/invest"
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-950"
                  >
                    Start Investing <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/sell"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-slate-500 hover:text-white transition-all"
                  >
                    Sell a Property
                  </Link>
                  <a
                    href="#g"
                    className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/40 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-900/40 transition-all"
                  >
                    <Bot size={15} /> Talk to G
                  </a>
                </motion.div>

                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-400" /> Strategy Before Deployment
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-400" /> Wichita Micro-Market Intel
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-400" /> Human Judgment & Execution
                  </span>
                </div>
              </div>

              {/* Hero Right Visual: System Architecture Model (Clearly Labeled Representative Architecture) */}
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    SYSTEM ARCHITECTURE MODEL
                  </div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Representative Framework
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Target Market:</span>
                    <span className="font-semibold text-white">Sedgwick County / Wichita, KS</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Underwriting Baseline:</span>
                    <span className="font-mono text-blue-400">MAO = (ARV × 0.70) − Rehab</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Operating Sequence:</span>
                    <span className="font-semibold text-slate-200">HUNTER → VICTOR → PIPER → OCG</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Flips & Renovation</div>
                    <div className="font-semibold text-slate-200 mt-1">Lender Debt + Preserved Reserves</div>
                  </div>
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">BRRRR & Rentals</div>
                    <div className="font-semibold text-slate-200 mt-1">DSCR Long-Term Refinance</div>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-950/20 border border-blue-800/30 p-3 text-[11px] text-blue-200/80">
                  <strong>Operating Model:</strong> Internal systems automate repetitive scoping and comparable clustering so human principals focus on deal strategy and execution.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 02: INTENT PATHWAYS
            ============================================================ */}
        <section className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-2">
              Tailored Entry Points
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Where do you want to begin?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/invest"
              className="group rounded-3xl border border-slate-800 bg-slate-950 p-8 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <TrendingUp size={22} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">I Want to Invest</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Explore Fix & Flip, BRRRR, or Buy & Hold pathways. Discover how OCG preserves your capital reserves and structures deals for optimal execution.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300">
                Explore Investment Paths <ArrowRight size={14} />
              </div>
            </Link>

            <Link
              href="/sell"
              className="group rounded-3xl border border-slate-800 bg-slate-950 p-8 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <HomeIcon size={22} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">I Want to Sell a Property</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Have an inherited home, deferred-maintenance property, or estate in Wichita? Get a respectful, preliminary review without high-pressure wholesaler tactics.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300">
                Start Property Intake <ArrowRight size={14} />
              </div>
            </Link>

            <Link
              href="/how-ocg-works"
              className="group rounded-3xl border border-slate-800 bg-slate-950 p-8 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Layers size={22} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Show Me How OCG Works</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  See how our acquisition, design, renovation, and AI intelligence systems (HUNTER, VICTOR, PIPER) integrate into a disciplined real estate company.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300">
                See Our Methodology <ArrowRight size={14} />
              </div>
            </Link>
          </div>
        </section>

        {/* ============================================================
            SECTION 03: STRATEGY COMPARISON & OBJECTIVE FIT
            ============================================================ */}
        <section className="container">
          <StrategyComparisonMatrix />
        </section>

        {/* ============================================================
            SECTION 04: THE OCG AI ORIGIN STORY SEQUENCE
            ============================================================ */}
        <section className="container">
          <OriginStorySequence />
        </section>

        {/* ============================================================
            SECTION 05: TECHNOLOGY ECOSYSTEM (HUNTER -> VICTOR -> PIPER -> OCG)
            ============================================================ */}
        <section className="container">
          <TechnologyEcosystem />
        </section>

        {/* ============================================================
            SECTION 06: WICHITA PROPERTY TRANSFORMATION
            ============================================================ */}
        <section className="container">
          <InteractiveTransformSlider />
        </section>

        {/* ============================================================
            SECTION 07: INTERACTIVE 70% UNDERWRITING CALCULATOR
            ============================================================ */}
        <section className="container">
          <Rule70Calculator />
        </section>

        {/* ============================================================
            SECTION 08: G — OCG INVESTMENT INTELLIGENCE
            ============================================================ */}
        <GExperience />

        {/* ============================================================
            SECTION 09: HIGH-CONVERSION STRATEGY SESSION CTA
            ============================================================ */}
        <section className="container pb-16">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0B132B] to-slate-950 p-8 md:p-16 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Your Next Strategic Move
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
                Start with a high-impact strategy conversation.
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                Whether you have liquid capital, an off-market property to evaluate, or want to understand what makes sense for your personal timeline, our team is ready to connect.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-950"
              >
                <Calendar size={16} /> Book Strategy Session
              </Link>
              <a
                href="#g"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-200 hover:border-slate-500 hover:text-white transition-all"
              >
                <Bot size={16} className="text-blue-400" /> Consult G First
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
