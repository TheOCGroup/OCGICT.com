import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OCGWordmark from "@/components/OCGWordmark";
import { ArrowRight, Palette, ShieldCheck, Building2, Cpu, CheckCircle2, User, Award, Calendar, Bot } from "lucide-react";
import { Link } from "wouter";

const disciplines = [
  {
    icon: Palette,
    title: "Interior Design & Spatial Thinking",
    body: "Evaluating layout flow, sightlines, high-ROI material selections, and buyer psychology to maximize perceived asset value without wasteful over-renovation.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance & Risk Management",
    body: "Sharpening underwriting with deep sensitivity to structural exposure, contingency reserves, insurable risks, and liability containment.",
  },
  {
    icon: Building2,
    title: "Real Estate Acquisition & Renovation",
    body: "Translating physical Wichita property conditions and off-market distress signals into viable, profitable investment projects.",
  },
  {
    icon: Cpu,
    title: "AI & Operational Workflow Systems",
    body: "Building internal systems out of necessity to compress tedious underwriting, comp clustering, and property intake without rushing human diligence.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-white selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 space-y-24 md:space-y-36">
        {/* Hero Section */}
        <section className="container">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              The OCG Convergence
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.98] text-white">
              Real estate experience shaped the company.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
                Necessity shaped the technology.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl">
              OCG is an operating real estate investment and acquisition company founded by Genaro Ocasio. We combine disciplined financial underwriting, architectural renovation, risk management, and purpose-built automation to execute with clarity in the Wichita market.
            </p>
          </div>
        </section>

        {/* The 4 Converging Disciplines */}
        <section className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Multidisciplinary Foundation
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
              Where Design, Risk, Real Estate, and AI Meet
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {disciplines.map((d, i) => (
              <div
                key={d.title}
                className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-6"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400">
                    <d.icon size={22} />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-white tracking-tight">{d.title}</h3>
                  <p className="mt-3 text-xs md:text-sm text-slate-400 leading-relaxed">{d.body}</p>
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Pillar 0{i + 1}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Founder Narrative */}
        <section className="container">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900/90 to-[#0B132B] p-8 md:p-14 shadow-2xl">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1 text-xs font-mono text-slate-300">
                  <User size={13} className="text-blue-400" /> Founder Perspective
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-white">
                  Genaro Ocasio
                </h3>
                <div className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
                  Founder & Principal · The OC Group / OCG
                </div>
                <p className="text-sm text-slate-300 leading-relaxed pt-2">
                  With a background spanning interior design, insurance risk management, real estate investment, renovation execution, and AI workflow architecture, Genaro built OCG around the convergence of these capabilities.
                </p>
              </div>

              <div className="space-y-4 text-sm md:text-base text-slate-300 leading-relaxed">
                <p>
                  "We discovered early on that off-market real estate in South-Central Kansas moves at a rapid pace. When a distressed or estate opportunity emerges, you may have only 24 to 48 hours to make a decision. The traditional method of waiting days for contractors or manually compiling radius comps created unnecessary bottlenecks."
                </p>
                <p>
                  "We didn't adopt AI because it was fashionable. We built automation because we needed to compress a 10-step underwriting sequence into minutes while keeping human judgment firmly at the wheel. The result is OCG: a modern investment company engineered for precision."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Corporate Architecture Notice */}
        <section className="container">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 md:p-12 space-y-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Corporate Structure & Brand Family
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-2">
                <div className="font-bold text-white text-base">Parent & Operating Entity</div>
                <div className="font-mono text-xs text-blue-400">Ocasio Collective, LLC d/b/a The OC Group</div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  OCG represents the real estate investment and property acquisition operating brand based in Wichita, Kansas.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-2">
                <div className="font-bold text-white text-base">The OCG Family</div>
                <div className="font-mono text-xs text-slate-400">OCG · OCG LAB · OCG HOMES</div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  OCG operates within a broader brand ecosystem, maintaining distinct visual identities and specialized operational focuses across investing, product engineering, and residential development.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conversion CTA */}
        <section className="container">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-950 to-blue-950/40 p-8 md:p-14 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 text-center lg:text-left">
            <div className="max-w-2xl space-y-2">
              <h3 className="text-2xl md:text-4xl font-bold text-white">
                Ready to explore real estate investing with OCG?
              </h3>
              <p className="text-sm text-slate-400">
                Book a direct strategy consultation to discuss capital allocation, Wichita opportunities, or preliminary property review.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-950"
              >
                <Calendar size={15} /> Book Strategy Session
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
