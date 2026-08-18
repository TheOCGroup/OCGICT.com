import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight,
  Calculator,
  Compass,
  Layers
} from 'lucide-react';
import OCGWordmark from '@/components/OCGWordmark';
import { InteractiveTransformSlider } from '@/components/InteractiveTransformSlider';
import { Calculators } from '@/components/Calculators';
import { GExperience } from '@/components/GExperience';
import { TechnologyPipelineSequence } from '@/components/TechnologyPipelineSequence';
import { OriginStorySequence } from '@/components/OriginStorySequence';

export function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. REBUILT FULL-BLEED PHOTOGRAPHIC WICHITA RESIDENTIAL HERO               */}
      {/* ========================================================================= */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-slate-800">
        
        {/* Cinematic Wichita Residential Background (Photographic / Light Balanced) */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero/wichita_hero_street.jpg" 
            alt="Wichita Kansas Residential Neighborhood" 
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Subtle Balanced Vignette & Overlay for 60-70% light / 30-40% dark contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F]/95 via-[#070A0F]/75 to-[#070A0F]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-28">
          <div className="max-w-3xl">
            
            {/* Architectural Sub-Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-950/70 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300 mb-6 shadow-lg shadow-black/40">
              <Sparkles size={13} className="text-blue-400" />
              <span>Wichita, Kansas · Real Estate Investment + Acquisition</span>
            </div>

            {/* Wordmark */}
            <div className="mb-6">
              <OCGWordmark size="hero" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] text-white drop-shadow-md">
              REAL ESTATE INVESTING.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-200">
                BUILT SMARTER.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-200 leading-relaxed max-w-2xl font-normal drop-shadow">
              Acquire Intelligently. Transform Strategically. Build Lasting Value.
              OCG combines disciplined acquisition underwriting, architectural renovation design, strategic financing structures, and internal AI systems to execute with precision in the Wichita market.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3.5 items-center">
              <Link
                href="/invest"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-950/80 cursor-pointer"
              >
                <span>Start Investing</span>
                <ArrowRight size={15} />
              </Link>
              
              <Link
                href="/sell"
                className="flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 px-7 py-4 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-xl cursor-pointer"
              >
                <span>Sell a Property</span>
              </Link>

              <a
                href="#g"
                className="flex items-center gap-2 rounded-xl bg-blue-950/60 backdrop-blur-md border border-blue-500/40 px-5 py-4 text-xs font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-900/80 transition-all cursor-pointer"
              >
                <Bot size={15} />
                <span>Talk to G</span>
              </a>
            </div>

            {/* Real Estate Proof Bullets */}
            <div className="mt-10 flex flex-wrap gap-y-2 gap-x-6 text-xs text-slate-300 drop-shadow">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={15} className="text-blue-400" />
                <span>Strategy Before Deployment</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={15} className="text-blue-400" />
                <span>Wichita Micro-Market Intel</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={15} className="text-blue-400" />
                <span>Human Judgment & Execution</span>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. STRATEGIC ENTRY PATHWAYS (Investor vs Seller)                          */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#0B1220] border-b border-slate-800 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Two Distinct Pathways</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Whether you are deploying capital or evaluating an asset.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Investor Card */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign size={24} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">Path 01 · Capital Deployment</div>
                <h3 className="text-2xl font-bold text-white mb-3">For Real Estate Investors</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Navigate the trade-offs between building liquid capital, expanding cash flow, preserving contingency reserves, financing renovation, and creating a disciplined multi-year plan.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Fix & Flip (Capital Creation & Senior Debt Leverage)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>BRRRR (Equity Recycling & Long-Term Refinance)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Passive Capital & Private Lending</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link
                  href="/invest"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 group-hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span>Explore Investor Strategies</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Seller Card */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all shadow-xl flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Path 02 · Property Review</div>
                <h3 className="text-2xl font-bold text-white mb-3">For Property Sellers</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  A straightforward property review. Clear options. No pressure. We don't just see your house as it sits today—we understand what it can become and provide transparent acquisition solutions.
                </p>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Inherited Estate & Probate Guidance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>As-Is Direct Purchase (Zero Cleaning or Repairs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Flexible Closing Timelines (7 to 60 Days)</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800">
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <span>Begin Seller Review</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WICHITA ARCHITECTURAL TRANSFORMATIONS (Expanded with Hotspots)         */}
      {/* ========================================================================= */}
      <InteractiveTransformSlider />

      {/* ========================================================================= */}
      {/* 4. 70% RULE UNDERWRITING & CALCULATOR (Central Equation Hero)             */}
      {/* ========================================================================= */}
      <Calculators />

      {/* ========================================================================= */}
      {/* 5. AI ORIGIN STORY SEQUENCE (48-Hour Pressure vs Reorganized System)      */}
      {/* ========================================================================= */}
      <OriginStorySequence />

      {/* ========================================================================= */}
      {/* 6. TECHNOLOGY PIPELINE SEQUENCE (HUNTER → VICTOR → PIPER → OCG LAB)       */}
      {/* ========================================================================= */}
      <TechnologyPipelineSequence />

      {/* ========================================================================= */}
      {/* 7. G INTELLIGENCE COMMAND LAYER (With OCG LAB Badge & Brief Panel)        */}
      {/* ========================================================================= */}
      <section id="g" className="py-24 bg-[#070A0F] border-t border-slate-800 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
              <Bot size={13} />
              <span>OCG Investment Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Not a chatbot.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-400">
                An intelligent gateway into OCG.
              </span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              G is trained across OCG's financing philosophy, Wichita housing stock, 70% rule underwriting, and investor diagnostics. Ask a question, explore a scenario, or build your custom Strategy Brief.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <GExperience />
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOUNDER CLOSING CTA (Direct Strategy Session)                          */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-b from-[#0B1220] to-[#070A0F] border-t border-slate-800 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Begin a Conversation</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Let's start a high-conviction conversation.
          </h2>
          <p className="text-base text-slate-300 mb-8 leading-relaxed">
            Whether you are an investor deploying capital, a seller seeking an objective property review, or a capital partner—our team is ready to evaluate the numbers with you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="px-8 py-4 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-all shadow-xl shadow-blue-950 cursor-pointer"
            >
              Book Strategy Session
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              About OCG & Founder
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;

