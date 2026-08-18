import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Shield, Calculator, Info, CheckCircle2, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

export function Calculators() {
  const [arv, setArv] = useState<number>(250000);
  const [rehab, setRehab] = useState<number>(45000);

  // Synchronize with G Actions
  useEffect(() => {
    const handleGAction = (e: CustomEvent<any>) => {
      const action = e.detail;
      if (action.actionId === 'SET_CALCULATOR_VALUES' && action.payload) {
        if (typeof action.payload.arv === 'number') setArv(action.payload.arv);
        if (typeof action.payload.rehab === 'number') setRehab(action.payload.rehab);
      }
    };

    window.addEventListener('ocg:g-action', handleGAction as EventListener);
    return () => window.removeEventListener('ocg:g-action', handleGAction as EventListener);
  }, []);

  // Calculated Metrics
  const seventyPercentBase = arv * 0.7;
  const mao = Math.max(0, seventyPercentBase - rehab);
  const grossMarginBuffer = arv * 0.3;
  const reserveRecommendation = Math.round(rehab * 0.15 + 10000);

  // Property visual reaction scale
  const valueScale = 1 + (arv - 150000) / 700000;
  const rehabIntensity = Math.min(1, Math.max(0.2, (rehab - 10000) / 120000));

  return (
    <section id="calculator" className="relative py-24 bg-[#0B1220] text-white overflow-hidden border-t border-slate-800">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
            <Calculator size={13} />
            <span>Strategic Underwriting Heuristic</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            The 70% Rule & MAO Explorer.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            In disciplined acquisition underwriting, the 70% framework establishes a strict purchase ceiling so that market shifts and holding costs do not compress investor equity.
          </p>
        </div>

        {/* Central Animated Equation Banner (The Hero Equation) */}
        <div className="max-w-5xl mx-auto mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-blue-950/50 to-slate-900/90 border border-blue-500/30 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center items-center">
            
            {/* Term 1: ARV */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">After Repair Value</div>
              <div className="text-xl sm:text-3xl font-extrabold text-blue-400 font-mono mt-1">${arv.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Projected Market Value</div>
            </div>

            {/* Term 2: 70% Rule Multiplier */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discipline Cap</div>
              <div className="text-xl sm:text-3xl font-extrabold text-white font-mono mt-1">× 70%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">${Math.round(seventyPercentBase).toLocaleString()} Base</div>
            </div>

            {/* Term 3: Rehab Scope */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rehab Scope</div>
              <div className="text-xl sm:text-3xl font-extrabold text-amber-400 font-mono mt-1">− ${rehab.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Verified Contractor Estimate</div>
            </div>

            {/* Term 4: MAO Result */}
            <div className="p-3 rounded-2xl bg-blue-900/40 border border-blue-400/60 shadow-lg shadow-blue-950">
              <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Max Allowable Offer</div>
              <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">${mao.toLocaleString()}</div>
              <div className="text-[10px] text-blue-200/80 mt-0.5">Strict Purchase Ceiling</div>
            </div>

          </div>
        </div>

        {/* Dynamic Sliders & Property Reaction Grid */}
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          
          {/* Left Column: Interactive Controls */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
            
            <div className="space-y-8">
              {/* Slider 1: ARV */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Projected ARV (Resale Value)
                  </label>
                  <span className="text-xl font-extrabold text-blue-400 font-mono">${arv.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min={80000} 
                  max={500000} 
                  step={5000}
                  value={arv} 
                  onChange={(e) => setArv(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>$80k (Starter Infill)</span>
                  <span>$250k (Wichita Median)</span>
                  <span>$500k+ (Executive)</span>
                </div>
              </div>

              {/* Slider 2: Rehab */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Estimated Renovation Scope
                  </label>
                  <span className="text-xl font-extrabold text-amber-400 font-mono">${rehab.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min={10000} 
                  max={150000} 
                  step={2500}
                  value={rehab} 
                  onChange={(e) => setRehab(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>$10k (Cosmetic Paint/Floors)</span>
                  <span>$45k (Full Kitchen/Bath/HVAC)</span>
                  <span>$150k (Gut / Addition)</span>
                </div>
              </div>
            </div>

            {/* Financing Doctrine Note */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                <Shield size={14} className="text-blue-400" />
                <span>OCG Financing Philosophy</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For renovation projects, OCG aims to explore senior lender capital for acquisition and construction. Your personal liquidity is better held as <strong className="text-slate-200">contingency reserves</strong> and <strong className="text-slate-200">financial flexibility</strong> against unexpected project delays rather than tied up in illiquid dirt.
              </p>
            </div>

          </div>

          {/* Right Column: Dynamic Value & Risk Breakdown */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
            
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Underwriting Metrics</div>
              <h3 className="text-lg font-bold text-white mb-6">Capital Allocation Architecture</h3>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-300">Gross Margin Buffer (30%)</div>
                    <div className="text-[11px] text-slate-500">Holding interest, selling fees & investor return</div>
                  </div>
                  <div className="text-lg font-bold text-slate-200 font-mono">${grossMarginBuffer.toLocaleString()}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-300">Recommended Contingency Reserves</div>
                    <div className="text-[11px] text-slate-500">15% scope buffer + 6-mo PITI carry cushion</div>
                  </div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">${reserveRecommendation.toLocaleString()}</div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-1">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    <span>Decision Rule</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If asking price exceeds <span className="font-bold text-emerald-400 font-mono">${mao.toLocaleString()}</span>, the deal fails OCG quantitative screening unless scope is reduced or ARV is proven higher with documented comps.
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt G Callout */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <a 
                href="#g" 
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Ask G to underwrite a specific Wichita address</span>
                <ArrowRight size={13} />
              </a>
            </div>

          </div>

        </div>

        {/* Transparent Heuristic Disclaimer */}
        <div className="mt-8 max-w-3xl mx-auto text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Disclaimer: The 70% rule is an underwriting heuristic and risk-management benchmark, not a financing guarantee. Actual loan-to-cost (LTC), interest carry, and loan-to-value (LTV) depend on lender guidelines, market conditions, verified appraisals, and contractor scopes.
          </p>
        </div>

      </div>
    </section>
  );
}

export const Rule70Calculator = Calculators;

export function StrategyComparisonMatrix() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
      <h4 className="text-sm font-bold uppercase tracking-wider text-blue-400 mb-3">Strategy Trade-Off Matrix</h4>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="font-bold text-white mb-1">Fix & Flip</div>
          <p className="text-slate-400">High velocity capital creation. Requires active project management.</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="font-bold text-white mb-1">BRRRR</div>
          <p className="text-slate-400">Recycled equity growth. Requires disciplined refinance execution.</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="font-bold text-white mb-1">Buy & Hold</div>
          <p className="text-slate-400">Predictable passive income & tax benefits. Long-term compounding.</p>
        </div>
      </div>
    </div>
  );
}

