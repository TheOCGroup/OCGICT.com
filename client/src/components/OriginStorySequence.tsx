import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Layers, ShieldCheck, Zap } from 'lucide-react';

const TRADITIONAL_TASKS = [
  { id: '1', name: 'Physical On-Site Inspection', hours: 4, icon: '🔍' },
  { id: '2', name: 'Manual Photo & Defect Cataloging', hours: 3, icon: '📸' },
  { id: '3', name: 'Contractor Scoping & Material Tally', hours: 8, icon: '🔨' },
  { id: '4', name: 'Local Sub-Contractor Bid Reconcile', hours: 12, icon: '📑' },
  { id: '5', name: 'Manual MLS & County Radius Comps', hours: 5, icon: '📊' },
  { id: '6', name: 'Floorplan Architectural Redesign', hours: 6, icon: '📐' },
  { id: '7', name: '70% Rule & Multi-Scenario Underwrite', hours: 4, icon: '🧮' },
  { id: '8', name: 'Lender Terms & Capital Call Prep', hours: 4, icon: '🏦' },
  { id: '9', name: 'Final Investment Committee Sign-off', hours: 2, icon: '✍️' }
];

export function OriginStorySequence() {
  const [activeMode, setActiveMode] = useState<'pressure' | 'reorganized'>('reorganized');
  const [taskCount, setTaskCount] = useState(TRADITIONAL_TASKS.length);
  const [hoursLeft, setHoursLeft] = useState(14);

  return (
    <section id="origin" className="relative py-24 bg-[#0B1220] text-white overflow-hidden border-t border-slate-800">
      
      {/* Subtle Radial Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          
          {/* Left Column: Origin Narrative */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
              <Sparkles size={13} />
              <span>The OCG AI Origin Story</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              We didn't set out to build AI.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-400">
                We needed a faster way to make good decisions.
              </span>
            </h2>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
              Attractive off-market real estate opportunities in Wichita operate on severely compressed timelines. Showing windows may be 24 to 48 hours. Access is limited.
            </p>

            <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
              Before we could responsibly move forward, we still had to document the asset, estimate rehab, comp the micro-radius, structure the debt, and run the numbers.
            </p>

            {/* Core Operating Principle Block */}
            <div className="mt-8 p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                Core Operating Principle
              </div>
              <blockquote className="text-lg font-bold text-white italic">
                "The process was right. The timing wasn't. So we built the systems we wished we'd had."
              </blockquote>
            </div>

            {/* Mode Switcher */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveMode('reorganized')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeMode === 'reorganized'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                The OCG Reorganized System
              </button>
              <button
                onClick={() => setActiveMode('pressure')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeMode === 'pressure'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 border border-amber-400'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                The Traditional 48-Hour Pressure
              </button>
            </div>

          </div>

          {/* Right Column: Dynamic Simulation of Time Pressure vs Reorganized Pipeline */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
            
            {activeMode === 'pressure' ? (
              <div>
                {/* Traditional 48-Hour Bottleneck Simulation */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Off-Market Showing Window
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    ⏱ 48h Deadline
                  </span>
                </div>

                <div className="text-xs text-slate-400 mb-4">
                  Traditional underwriting takes ~48 hours across 9 disjointed tasks. Opportunities are lost or acquired under unverified assumptions.
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {TRADITIONAL_TASKS.map((task, i) => (
                    <div 
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{task.icon}</span>
                        <span className="text-slate-300 font-medium">{task.name}</span>
                      </div>
                      <span className="text-slate-500 font-mono">+{task.hours}h</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 text-center text-xs text-amber-300/90">
                  Total Cumulative Time: <strong>48 Hours</strong> (Zero Margin for Error)
                </div>
              </div>
            ) : (
              <div>
                {/* OCG Reorganized Intelligent Compression */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      OCG Pipeline Compression
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    ⚡ Real-Time Synthesis
                  </span>
                </div>

                <div className="text-xs text-slate-400 mb-4">
                  HUNTER, VICTOR, and PIPER run data ingestion and financial underwriting in parallel, giving our team the clarity to make high-conviction decisions in minutes.
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      01
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Automated Public Data Pull</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Sedgwick County parcel, tax assessment, and zoning codes indexed instantly.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      02
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Verified Unit-Rate Scoping</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Renovation costs computed from trade-level Wichita contractor databases.</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      03
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Instant 70% & Debt Modeling</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">MAO, DSCR cash flow, and bridge loan parameters pre-calculated.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center justify-between text-xs text-blue-200">
                  <span className="font-semibold">Decision Clarity Velocity:</span>
                  <span className="font-bold font-mono text-emerald-400">10 Steps Compressed</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

export default OriginStorySequence;

