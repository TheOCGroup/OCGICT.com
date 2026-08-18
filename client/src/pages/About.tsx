import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Building2, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  Palette, 
  FileCheck, 
  Hammer, 
  Briefcase, 
  Bot,
  ExternalLink,
  Layers,
  MapPin
} from 'lucide-react';
import OCGWordmark from '@/components/OCGWordmark';

const FOUNDER_CONVERGENCE = [
  {
    phase: '01',
    title: 'Interior Design & Spatial Architecture',
    desc: 'Understanding how layout, natural light, materials, and historic character command emotional appeal and price ceilings in Wichita neighborhoods.',
    icon: Palette,
    tag: 'Aesthetic Authority'
  },
  {
    phase: '02',
    title: 'Insurance & Risk Underwriting',
    desc: 'Deep grounding in catastrophic loss mitigation, building envelope vulnerabilities, title risks, and downside capital protection.',
    icon: Shield,
    tag: 'Risk Management'
  },
  {
    phase: '03',
    title: 'Licensed Real Estate Brokerage',
    desc: 'Transactional precision, local zoning nuances, off-market contracts, and direct seller representation without intermediation noise.',
    icon: Briefcase,
    tag: 'Market Fluency'
  },
  {
    phase: '04',
    title: 'General Renovation Execution',
    desc: 'Physical site management, contractor trade scoping, materials pricing tables, and strict milestone schedule discipline.',
    icon: Hammer,
    tag: 'Physical Execution'
  },
  {
    phase: '05',
    title: 'Acquisition & Capital Strategy',
    desc: 'Structuring senior debt, private investor capital allocations, liquidity reserves, and multi-year wealth accumulation.',
    icon: Building2,
    tag: 'Capital Strategy'
  },
  {
    phase: '06',
    title: 'AI Systems & OCG LAB',
    desc: 'Engineering HUNTER, VICTOR, PIPER, and G to automate repetitive data synthesis so humans focus exclusively on high-conviction judgment.',
    icon: Cpu,
    tag: 'Intelligent Systems'
  }
];

export function About() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* 1. ABOUT HERO */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 mb-6 shadow-lg">
            <Sparkles size={14} />
            <span>The OCG Convergence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Real estate experience shaped the company.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-300">
              Necessity shaped the technology.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            OCG is an operating real estate investment and acquisition company founded by Genaro Ocasio. We combine disciplined financial underwriting, architectural renovation design, risk management, and purpose-built automation to execute with precision in the Wichita market.
          </p>

        </div>
      </section>

      {/* 2. FOUNDER NARRATIVE & MULTIDISCIPLINARY CONVERGENCE */}
      <section className="py-24 bg-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <div className="max-w-3xl mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Multidisciplinary Foundation</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Where Design, Risk, Real Estate, and AI Meet.
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              Most real estate investment firms approach deals purely as numbers on a spreadsheet. Most tech platforms have never swung a hammer. OCG is built on the convergence of six foundational disciplines.
            </p>
          </div>

          {/* Convergence Flow Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {FOUNDER_CONVERGENCE.map((disc) => {
              const Icon = disc.icon;
              return (
                <div 
                  key={disc.phase}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Icon size={22} />
                      </div>
                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        PHASE {disc.phase}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-1">{disc.tag}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{disc.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{disc.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Founder Identity Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-2xl">
            <div className="grid md:grid-cols-[1fr_2fr] gap-8 items-center">
              
              {/* Founder Monogram / Authentic Identity Block */}
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-xl mb-4">
                  GO
                </div>
                <div className="font-extrabold text-white text-lg">Genaro Ocasio</div>
                <div className="text-xs font-mono text-blue-400 mt-0.5">Founder & Principal · OCG</div>
                <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <MapPin size={12} className="text-blue-400" />
                  <span>Wichita, Kansas</span>
                </div>
              </div>

              {/* Founder Statement */}
              <div className="space-y-4">
                <blockquote className="text-lg sm:text-xl font-medium text-slate-200 italic leading-relaxed">
                  "We built OCG because we wanted a company that treats real estate with architectural respect, protects capital with strict underwriting discipline, and uses artificial intelligence not as a gimmick, but as an operational engine."
                </blockquote>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Genaro brings years of hands-on experience in Wichita housing stock, from historic College Hill Craftsman renovations to East Wichita mid-century stabilization, backed by rigorous risk analysis and proprietary software systems.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. OCG LAB SHOWROOM & INVENTIVE ENGINE */}
      <section id="lab" className="py-24 bg-[#0B1220] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-2xl text-center">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
              <Bot size={14} />
              <span>Proprietary Technology Engine</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Powered by technology developed by <span className="text-blue-400">OCG LAB</span>.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              OCG LAB is the technology and AI research unit of OCG. We build custom agentic workflows, multi-agent underwriting pipelines, spatial property visualizations, and conversational interfaces tailored to real-world real estate operations.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">HUNTER System</div>
                <div className="text-xs text-slate-400">Autonomous public data ingestion, probate scraping, and opportunity signal identification.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">VICTOR Engine</div>
                <div className="text-xs text-slate-400">Quantitative MAO modeling, contractor unit rate scoping, and multi-scenario underwriting.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">G Intelligence</div>
                <div className="text-xs text-slate-400">Context-aware conversational advisory, property retrieval, and Strategy Brief synthesis.</div>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-all shadow-xl shadow-blue-950 cursor-pointer"
              >
                Schedule an OCG Strategy Session
              </Link>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

export default About;

