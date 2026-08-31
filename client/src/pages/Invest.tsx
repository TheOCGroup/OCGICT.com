import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { GExperience } from '@/components/GExperience';

interface StrategyDetail {
  id: 'flip' | 'brrrr' | 'buy_hold';
  name: string;
  subtitle: string;
  timeline: string;
  primaryGoal: string;
  lifecycle: Array<{ stage: string; desc: string }>;
  idealInvestor: string[];
  capitalThinking: string;
  riskAndFinancing: string;
  example: {
    title: string;
    assumptions: Array<{ label: string; value: string }>;
    output: string;
    note: string;
  };
}

const STRATEGIES: StrategyDetail[] = [
  {
    id: 'flip',
    name: 'Fix & Flip',
    subtitle: 'Acquire, Renovate, Resell',
    timeline: 'Illustrative cycle: roughly 4–7 months',
    primaryGoal: 'Create equity through disciplined acquisition and renovation execution.',
    lifecycle: [
      { stage: '1. Acquire', desc: 'Screen purchase price against defensible ARV, repair scope, and full project economics.' },
      { stage: '2. Renovate', desc: 'Execute a scope designed for the specific house, neighborhood, buyer, budget, and schedule.' },
      { stage: '3. Resell', desc: 'Price and market against current competition and verified comparable sales.' },
      { stage: '4. Reconcile', desc: 'Measure actual net result after financing, carry, transaction, and selling costs.' },
    ],
    idealInvestor: [
      'Investors comfortable with construction, schedule, financing, and resale risk.',
      'Operators who can maintain adequate reserves after closing.',
      'Investors seeking shorter-horizon value creation rather than long-term rental income.',
    ],
    capitalThinking: 'OCG evaluates whether lender capital can support acquisition and renovation while preserving enough investor liquidity for contingency, carry, and lender requirements. The correct structure depends on actual terms—not a fixed leverage percentage.',
    riskAndFinancing: 'A real flip model should include loan amount, rate, points/fees, draw mechanics, interest carry, taxes, insurance, utilities, contingency, closing costs, selling costs, and expected holding period before any profit target is trusted.',
    example: {
      title: 'Illustrative Wichita flip screen',
      assumptions: [
        { label: 'Assumed ARV', value: '$240,000' },
        { label: '70% of ARV', value: '$168,000' },
        { label: 'Assumed rehab', value: '$48,500' },
      ],
      output: 'Heuristic MAO: $119,500',
      note: 'That $119,500 is only (ARV × 70%) − rehab. It is not projected profit and does not replace a full financing/carry/sale-cost model.',
    },
  },
  {
    id: 'brrrr',
    name: 'BRRRR',
    subtitle: 'Buy, Renovate, Rent, Refinance, Repeat',
    timeline: 'Illustrative stabilization/refinance cycle: roughly 6–12+ months',
    primaryGoal: 'Create durable rental equity while attempting to recycle part of the original cash investment.',
    lifecycle: [
      { stage: '1. Buy', desc: 'Acquire only when the post-renovation rent and refinance case are supportable before closing.' },
      { stage: '2. Renovate', desc: 'Prioritize durable rental scope, mechanical reliability, code compliance, and tenant demand.' },
      { stage: '3. Stabilize', desc: 'Verify achievable rent, operating expenses, reserves, and occupancy assumptions.' },
      { stage: '4. Refinance', desc: 'Test actual appraisal, lender LTV/LTC, seasoning, DSCR, rate, fees, and reserve requirements.' },
      { stage: '5. Repeat', desc: 'Recycle capital only after the first asset is financially stable and sufficiently reserved.' },
    ],
    idealInvestor: [
      'Investors building a long-term rental portfolio.',
      'Operators willing to manage both renovation risk and refinance risk.',
      'Investors who can tolerate capital remaining in a deal if the appraisal or refinance terms are weaker than expected.',
    ],
    capitalThinking: 'The refinance exit should be modeled before acquisition, but no cash-out amount should be assumed until appraisal, qualifying rent, lender leverage, fees, seasoning, and debt-service requirements are known.',
    riskAndFinancing: 'DSCR is lender-specific. OCG should calculate it only from stated or verified rent and actual debt-service inputs, then compare the result with the selected lender’s underwriting threshold.',
    example: {
      title: 'Illustrative BRRRR decision gate',
      assumptions: [
        { label: 'Verified/assumed rent', value: 'Required input' },
        { label: 'Monthly debt service / PITI', value: 'Required input' },
        { label: 'Refinance appraisal + lender leverage', value: 'Required inputs' },
      ],
      output: 'No DSCR or cash-out claim without the inputs',
      note: 'BRRRR works only if the stabilized property supports the actual lender’s refinance terms. G should ask for the missing inputs rather than inventing them.',
    },
  },
  {
    id: 'buy_hold',
    name: 'Buy & Hold',
    subtitle: 'Long-Term Cash Flow & Equity',
    timeline: 'Long-horizon ownership strategy',
    primaryGoal: 'Own durable assets whose rent, expenses, reserves, debt service, and long-term demand justify the capital committed.',
    lifecycle: [
      { stage: '1. Acquire', desc: 'Underwrite purchase price against realistic rent, operating costs, reserves, and financing.' },
      { stage: '2. Stabilize', desc: 'Complete deferred maintenance and establish reliable property-management systems.' },
      { stage: '3. Operate', desc: 'Track actual rent collection, vacancy, repairs, capex, taxes, insurance, and debt service.' },
      { stage: '4. Reassess', desc: 'Periodically compare hold, refinance, renovate, or sell decisions against current economics.' },
    ],
    idealInvestor: [
      'Investors focused on long-term ownership rather than immediate resale.',
      'Operators who value durable cash flow and reserve discipline.',
      'Investors prepared for vacancy, maintenance, capital expenditures, and changing financing or tax costs.',
    ],
    capitalThinking: 'A buy-and-hold decision should preserve enough reserves for vacancy, maintenance, capex, insurance/tax changes, and lender requirements. A fixed “cash reserve per door” should not be treated as universally sufficient.',
    riskAndFinancing: 'Conventional and DSCR structures can both be relevant. The correct choice depends on borrower/property profile, rate, leverage, reserves, fees, qualifying rent, and the lender’s actual program.',
    example: {
      title: 'Illustrative hold analysis',
      assumptions: [
        { label: 'Gross scheduled rent', value: 'Required input' },
        { label: 'Vacancy + operating expenses', value: 'Required inputs' },
        { label: 'Debt service + reserves', value: 'Required inputs' },
      ],
      output: 'No cash-on-cash return without a complete cash-flow model',
      note: 'A real hold analysis should show every major income, expense, financing, and reserve assumption so the investor can audit the result.',
    },
  },
];

export function Invest() {
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyDetail['id']>('flip');
  const currentStrategy = useMemo(
    () => STRATEGIES.find((strategy) => strategy.id === selectedStrategyId) || STRATEGIES[0],
    [selectedStrategyId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      <section className="relative border-b border-slate-800 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 shadow-lg">
              <DollarSign size={14} />
              <span>Disciplined Capital Allocation</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              The strategy should fit the investor —<br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-200 to-slate-300 bg-clip-text text-transparent">not the other way around.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-normal leading-relaxed text-slate-300 sm:text-lg">
              OCG helps investors compare renovation risk, liquidity, financing, cash flow, refinance exposure, and exit strategy before capital is committed.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {STRATEGIES.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategyId(strategy.id)}
                  className={`cursor-pointer rounded-xl border px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedStrategyId === strategy.id
                      ? 'border-blue-400 bg-blue-600 text-white shadow-xl shadow-blue-900/50'
                      : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-white'
                  }`}
                >
                  {strategy.name}
                </button>
              ))}
              <a href="#g-diagnostic" className="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-500/30 bg-slate-950 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300">
                <Bot size={14} />
                <span>Not Sure? Ask G</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-[#070A0F] py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl sm:p-10">
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-800 pb-8 md:flex-row md:items-center">
              <div>
                <div className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-blue-400">Strategy exploration</div>
                <h2 className="text-3xl font-extrabold text-white">{currentStrategy.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{currentStrategy.subtitle}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-300">
                <span className="text-slate-500">Timing:</span> <span className="font-bold text-white">{currentStrategy.timeline}</span>
              </div>
            </div>

            <div className="mb-8 rounded-2xl border border-blue-900/40 bg-blue-950/20 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300">Primary objective</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{currentStrategy.primaryGoal}</p>
            </div>

            <div className="mb-10">
              <div className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Execution sequence</div>
              <div className="grid gap-3 md:grid-cols-4">
                {currentStrategy.lifecycle.map((step) => (
                  <div key={step.stage} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-blue-400">{step.stage}</div>
                    <div className="text-xs leading-relaxed text-slate-300">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                    <CheckCircle2 size={16} className="text-blue-400" />
                    <span>When might this fit?</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {currentStrategy.idealInvestor.map((point) => (
                      <li key={point} className="flex items-start gap-2"><span className="font-bold text-blue-400">•</span><span>{point}</span></li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-6">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-300">
                    <ShieldCheck size={16} className="text-blue-400" />
                    <span>Capital & reserve discipline</span>
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-300">{currentStrategy.capitalThinking}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span>Financing & risk</span>
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400">{currentStrategy.riskAndFinancing}</p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl sm:p-8">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">Auditable example</div>
                  <h4 className="mb-2 text-xl font-bold text-white">{currentStrategy.example.title}</h4>
                  <p className="mb-6 text-xs leading-relaxed text-slate-500">Illustrative only. These are not live property, lender, rent, appraisal, or MLS figures.</p>

                  <div className="space-y-3 font-mono text-xs">
                    {currentStrategy.example.assumptions.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <span className="text-slate-400">{item.label.toUpperCase()}:</span>
                        <span className="text-right font-bold text-white">{item.value}</span>
                      </div>
                    ))}
                    <div className="rounded-xl border border-blue-500/40 bg-blue-950/60 p-3.5 text-blue-200">
                      <div className="font-bold text-emerald-400">{currentStrategy.example.output}</div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-400">{currentStrategy.example.note}</p>
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-800/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-400">Bring a real deal and we can model the actual inputs.</span>
                  <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-blue-500">
                    Strategy Review <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="g-diagnostic" className="border-b border-slate-800 bg-[#0B1220] py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
              <Bot size={13} />
              <span>Ask G</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Bring the real inputs. G should show the reasoning.</h2>
            <p className="mt-3 text-base text-slate-300">Tell G what you are trying to accomplish and any numbers you already know. G should identify missing inputs instead of filling them in for you.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
            <GExperience />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Invest;
