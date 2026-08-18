import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Bot, 
  ChevronRight,
  Layers,
  Clock,
  Briefcase
} from 'lucide-react';
import { GExperience } from '@/components/GExperience';

interface StrategyDetail {
  id: string;
  name: string;
  subtitle: string;
  timeline: string;
  primaryGoal: string;
  lifecycle: Array<{ stage: string; desc: string }>;
  idealInvestor: string[];
  capitalThinking: string;
  riskAndFinancing: string;
  sampleProperty: {
    address: string;
    neighborhood: string;
    arv: number;
    rehab: number;
    purchase: number;
    exitTarget: string;
  };
}

const STRATEGIES: StrategyDetail[] = [
  {
    id: 'flip',
    name: 'Fix & Flip',
    subtitle: 'Renovation, Resale & Liquid Capital Creation',
    timeline: '4 – 7 Months per cycle',
    primaryGoal: 'Build liquid capital reserves and master physical execution.',
    lifecycle: [
      { stage: '1. Acquire', desc: 'Acquire at strict 70% MAO ceiling from off-market sources.' },
      { stage: '2. Renovate', desc: 'Execute value-add architectural scope with licensed Wichita trades.' },
      { stage: '3. Resale', desc: 'Stage and market to design-conscious owner-occupant buyers.' },
      { stage: '4. Capital Created', desc: 'Realize liquid net gain to replenish reserves and fund next deal.' }
    ],
    idealInvestor: [
      'Active capital builders expanding their liquid investment reserves.',
      'Investors seeking to learn construction management and market dynamics.',
      'High-income earners wanting to accelerate equity accumulation.'
    ],
    capitalThinking: 'OCG explores senior lender bridge debt for acquisition and construction draws first. Your personal cash is better preserved as contingency reserves and financial flexibility against unexpected delays.',
    riskAndFinancing: 'Senior debt facility typically funds 85–90% of purchase price and 100% of renovation budget. Investor equity contributes 10–15% down payment plus 6 months of interest carry cushion.',
    sampleProperty: {
      address: '248 S Rutan Ave',
      neighborhood: 'College Hill',
      arv: 240000,
      rehab: 48500,
      purchase: 119500,
      exitTarget: '$42,000 Net Projected Margin'
    }
  },
  {
    id: 'brrrr',
    name: 'BRRRR Strategy',
    subtitle: 'Buy, Renovate, Rent, Refinance, Repeat',
    timeline: '6 – 12 Months to full equity recycle',
    primaryGoal: 'Build a long-term rental portfolio while recycling initial cash capital.',
    lifecycle: [
      { stage: '1. Buy', desc: 'Target properties with significant cosmetic and mechanical upside.' },
      { stage: '2. Renovate', desc: 'Modernize kitchens, baths, and mechanicals for durable rental durability.' },
      { stage: '3. Rent', desc: 'Place verified high-quality tenants at top-of-market Wichita rental rates.' },
      { stage: '4. Refinance', desc: 'Obtain 30-year long-term DSCR mortgage to cash out initial capital.' },
      { stage: '5. Repeat', desc: 'Deploy the recycled equity into the next acquisition.' }
    ],
    idealInvestor: [
      'Investors focused on scaling rental doors without continually injecting fresh cash.',
      'Wealth builders prioritizing generational cash flow and tax depreciation.',
      'Disciplined operators comfortable with short-term refinancing execution.'
    ],
    capitalThinking: 'The refinance exit must be stress-tested BEFORE purchase. If the post-renovation appraisal does not support a 75% LTV cash-out covering all initial capital and debt service (DSCR > 1.25x), the deal is rejected.',
    riskAndFinancing: 'Initial bridge loan transitions to a 30-year fixed DSCR rental mortgage. Rental income must cover PITI by at least 1.20x to 1.25x.',
    sampleProperty: {
      address: '1420 N Holyoke Ave',
      neighborhood: 'Fairmount / WSU Tech Corridor',
      arv: 185000,
      rehab: 34000,
      purchase: 95000,
      exitTarget: '$1,550/mo Rent · $450/mo Net Cash Flow'
    }
  },
  {
    id: 'buy_hold',
    name: 'Turnkey Buy & Hold',
    subtitle: 'Immediate Cash Flow & Long-Term Wealth',
    timeline: '5 – 10+ Year Long-Term Hold',
    primaryGoal: 'Stable monthly passive cash flow, loan paydown, and inflation hedge.',
    lifecycle: [
      { stage: '1. Acquire', desc: 'Purchase stabilized or newly-renovated single-family asset.' },
      { stage: '2. Stabilize', desc: 'Verify professional property management and maintenance reserves.' },
      { stage: '3. Operate', desc: 'Collect predictable monthly rental distributions with minimal friction.' },
      { stage: '4. Compound', desc: 'Benefit from principal amortization, appreciation, and tax write-offs.' }
    ],
    idealInvestor: [
      'Busy professionals seeking passive real estate exposure with zero day-to-day hassles.',
      'Capital allocators diversifying out of volatile equity markets into hard assets.',
      'Retirement investors seeking reliable monthly cash yields.'
    ],
    capitalThinking: 'Prioritizes immediate stability and downside protection over high-intensity renovation margins. 20–25% equity down payment with low-leverage fixed debt.',
    riskAndFinancing: 'Conventional or DSCR 30-year fixed debt. Conservative cash reserve allocation (minimum $5,000 per door) to weather tenant turns.',
    sampleProperty: {
      address: '834 S Green St',
      neighborhood: 'South City / Linwood Park',
      arv: 145000,
      rehab: 0,
      purchase: 142000,
      exitTarget: '8.4% Net Cash-on-Cash Return'
    }
  }
];

export function Invest() {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('flip');
  const [expandedSection, setExpandedSection] = useState<string | null>('lifecycle');

  const currentStrategy = STRATEGIES.find(s => s.id === selectedStrategyId) || STRATEGIES[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* 1. INVESTOR HERO — STRATEGY BEFORE DEPLOYMENT */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 mb-6 shadow-lg">
              <DollarSign size={14} />
              <span>Disciplined Capital Allocation</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              The strategy should fit the investor —<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-300">
                not the other way around.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              OCG helps you navigate the trade-offs between building liquid capital, expanding cash flow, preserving contingency reserves, financing renovation, and creating a disciplined multi-year investment plan.
            </p>

            {/* Strategy Selectors */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {STRATEGIES.map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => setSelectedStrategyId(strat.id)}
                  className={`px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedStrategyId === strat.id
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50 border border-blue-400'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {strat.name}
                </button>
              ))}
              
              <a
                href="#g-diagnostic"
                className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-950 text-blue-400 hover:text-blue-300 border border-blue-500/30 flex items-center gap-2 cursor-pointer"
              >
                <Bot size={14} />
                <span>Not Sure? Ask G</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE STRATEGY ENVIRONMENT */}
      <section className="py-24 bg-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            
            {/* Header / Strategy Identity */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 mb-8 border-b border-slate-800 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-blue-400 font-mono mb-1">
                  Active Framework Exploration
                </div>
                <h2 className="text-3xl font-extrabold text-white">{currentStrategy.name} Strategy</h2>
                <p className="text-sm text-slate-400 mt-1">{currentStrategy.subtitle}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  ⏱ Cycle: <span className="font-bold text-white">{currentStrategy.timeline}</span>
                </div>
              </div>
            </div>

            {/* Visual Lifecycle Flow (The 4-5 Step Visual Assembly) */}
            <div className="mb-10">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Lifecycle Execution Sequence
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {currentStrategy.lifecycle.map((step, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 font-mono">
                      {step.stage}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deep Progressive Breakdown Grid */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Box: Ideal Profile & Capital Thinking */}
              <div className="space-y-6">
                
                {/* Level 1: When might this fit? */}
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-400" />
                    <span>When Does This Strategy Make Sense?</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {currentStrategy.idealInvestor.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Level 2: OCG Capital Thinking */}
                <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-900/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300 mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-400" />
                    <span>OCG Capital & Reserve Doctrine</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentStrategy.capitalThinking}
                  </p>
                </div>

                {/* Level 3: Debt & Risk Structure */}
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span>Lending & Debt Structure</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentStrategy.riskAndFinancing}
                  </p>
                </div>

              </div>

              {/* Right Box: Representative Wichita Case Example */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Representative Case Model</span>
                    <span className="text-xs font-mono text-slate-400">{currentStrategy.sampleProperty.neighborhood}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-6">{currentStrategy.sampleProperty.address}</h4>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">PURCHASE BASIS (MAO):</span>
                      <span className="text-white font-bold">${currentStrategy.sampleProperty.purchase.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">REHABILITATION BUDGET:</span>
                      <span className="text-amber-400 font-bold">${currentStrategy.sampleProperty.rehab.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400">PROJECTED RESALE (ARV):</span>
                      <span className="text-blue-400 font-bold">${currentStrategy.sampleProperty.arv.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-200">
                      <span className="font-bold">TARGET FINANCIAL OUTPUT:</span>
                      <span className="font-bold text-emerald-400">{currentStrategy.sampleProperty.exitTarget}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Ready to discuss your capital allocation?</span>
                  <Link
                    href="/contact"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    Schedule Strategy Review
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. G DIAGNOSTIC & STRATEGY BRIEF SYNTHESIS */}
      <section id="g-diagnostic" className="py-24 bg-[#0B1220] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
              <Bot size={13} />
              <span>G Diagnostic Intake</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Unsure which strategy fits your capital and timeline?
            </h2>
            <p className="mt-3 text-base text-slate-300">
              Tell G how much capital you are considering, your risk tolerance, and your multi-year goals. G will synthesize your personalized OCG Strategy Brief.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-6 sm:p-8">
            <GExperience />
          </div>

        </div>
      </section>

    </div>
  );
}

export default Invest;

