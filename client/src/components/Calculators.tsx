import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calculator, CheckCircle2, ArrowRight } from 'lucide-react';

export function Calculators() {
  const [arv, setArv] = useState<number>(250000);
  const [rehab, setRehab] = useState<number>(45000);

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

  const seventyPercentBase = arv * 0.7;
  const mao = Math.max(0, seventyPercentBase - rehab);
  const heuristicSpreadBeforeRehab = arv * 0.3;
  const rehabContingency = Math.round(rehab * 0.15);

  return (
    <section id="calculator" className="relative overflow-hidden border-t border-slate-800 bg-[#0B1220] py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/30 via-transparent to-transparent" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
            <Calculator size={13} />
            <span>Screening Heuristic</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            The 70% Rule & MAO Explorer.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Use the 70% rule as a fast first-pass screen for a renovation deal. It is not a complete profit model, appraisal, or guaranteed purchase price.
          </p>
        </div>

        <div className="mx-auto mb-10 max-w-5xl rounded-3xl border border-blue-500/30 bg-gradient-to-r from-slate-900/90 via-blue-950/50 to-slate-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div className="grid grid-cols-2 items-center gap-4 text-center sm:grid-cols-4 sm:gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assumed ARV</div>
              <div className="mt-1 font-mono text-xl font-extrabold text-blue-400 sm:text-3xl">${arv.toLocaleString()}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">User-adjustable assumption</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">70% Heuristic</div>
              <div className="mt-1 font-mono text-xl font-extrabold text-white sm:text-3xl">× 70%</div>
              <div className="mt-0.5 text-[10px] text-slate-500">${Math.round(seventyPercentBase).toLocaleString()} before rehab</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assumed Rehab</div>
              <div className="mt-1 font-mono text-xl font-extrabold text-amber-400 sm:text-3xl">− ${rehab.toLocaleString()}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">Not a contractor bid</div>
            </div>

            <div className="rounded-2xl border border-blue-400/60 bg-blue-900/40 p-3 shadow-lg shadow-blue-950">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Heuristic MAO</div>
              <div className="mt-1 font-mono text-xl font-black text-emerald-400 sm:text-3xl">${mao.toLocaleString()}</div>
              <div className="mt-0.5 text-[10px] text-blue-200/80">First-pass screen only</div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:p-8">
            <div className="space-y-8">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Projected ARV assumption</label>
                  <span className="font-mono text-xl font-extrabold text-blue-400">${arv.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={80000}
                  max={500000}
                  step={5000}
                  value={arv}
                  onChange={(e) => setArv(Number(e.target.value))}
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
                  <span>$80k</span>
                  <span>$250k example</span>
                  <span>$500k+</span>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Estimated rehab assumption</label>
                  <span className="font-mono text-xl font-extrabold text-amber-400">${rehab.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={150000}
                  step={2500}
                  value={rehab}
                  onChange={(e) => setRehab(Number(e.target.value))}
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
                  <span>$10k</span>
                  <span>$45k example</span>
                  <span>$150k</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Shield size={14} className="text-blue-400" />
                <span>OCG Financing Philosophy</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                For suitable renovation projects, OCG evaluates senior lender capital for acquisition and construction while preserving enough liquidity for contingency, carry, and lender reserves. The right structure depends on actual loan terms and the specific deal.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:p-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">What the heuristic does—and does not—show</div>
              <h3 className="mb-6 text-lg font-bold text-white">Underwriting Context</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <div className="text-xs font-bold text-slate-300">30% ARV spread before rehab</div>
                    <div className="text-[11px] text-slate-500">A heuristic allowance—not projected profit</div>
                  </div>
                  <div className="font-mono text-lg font-bold text-slate-200">${heuristicSpreadBeforeRehab.toLocaleString()}</div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <div className="text-xs font-bold text-slate-300">15% rehab contingency example</div>
                    <div className="text-[11px] text-slate-500">Does not include debt service, taxes, insurance, utilities, or selling costs</div>
                  </div>
                  <div className="font-mono text-lg font-bold text-emerald-400">${rehabContingency.toLocaleString()}</div>
                </div>

                <div className="rounded-2xl border border-blue-900/60 bg-blue-950/40 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-bold text-blue-300">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    <span>Screening Signal</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    An asking price above <span className="font-mono font-bold text-emerald-400">${mao.toLocaleString()}</span> fails this particular 70% screen. That does not automatically make the deal bad; it means the deal needs a full model and a defensible reason to depart from the heuristic.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 text-center">
              <a href="#g" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 transition-colors hover:text-blue-300">
                <span>Ask G to model your stated assumptions</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-[11px] leading-relaxed text-slate-500">
            The 70% rule is an acquisition-screening heuristic. A real investment decision should model verified or explicitly assumed ARV, rehab, financing, holding period, taxes, insurance, utilities, transaction costs, selling costs, contingency, and exit strategy. Lender LTC/LTV and DSCR requirements vary by lender and product.
          </p>
        </div>
      </div>
    </section>
  );
}

export const Rule70Calculator = Calculators;

export function StrategyComparisonMatrix() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-xs">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">Strategy Trade-Off Matrix</h4>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-1 font-bold text-white">Fix & Flip</div>
          <p className="text-slate-400">Shorter-horizon value creation with active construction, financing, holding-cost, and resale risk.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-1 font-bold text-white">BRRRR</div>
          <p className="text-slate-400">Renovate, stabilize, and refinance. Success depends on rent, appraisal, seasoning, leverage, and refinance terms.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="mb-1 font-bold text-white">Buy & Hold</div>
          <p className="text-slate-400">Long-term ownership where cash flow, reserves, maintenance, debt service, and durable tenant demand matter.</p>
        </div>
      </div>
    </div>
  );
}
