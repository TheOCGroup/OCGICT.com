import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, 
  Cpu, 
  Workflow, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  Building2,
  Search,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    id: 'hunter',
    number: '01',
    name: 'HUNTER',
    subtitle: 'Deal Finder & Discovery Signal',
    icon: Radar,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Scans Sedgwick County public tax rolls, probate filings, code enforcement notices, and off-market distress signals to isolate viable properties before MLS syndication.',
    propertyOverlay: 'OPPORTUNITY SIGNAL DETECTED',
    dataPoints: [
      { label: 'Signal Vector', value: 'Tax Assessed vs Comps Delta (>28%)' },
      { label: 'Public Filing', value: 'Sedgwick County Estate Record' },
      { label: 'Micro-Market', value: 'College Hill Historic Periphery' },
      { label: 'Initial Screening', value: 'Passed 70% Initial Feasibility' }
    ]
  },
  {
    id: 'victor',
    number: '02',
    name: 'VICTOR',
    subtitle: 'Deal Scout & Quantitative Underwriter',
    icon: Cpu,
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    description: 'Assembles architectural condition models, Sedgwick County comps, trade-level renovation cost tables, and DSCR/flip scenarios to calculate precision MAO and debt coverage.',
    propertyOverlay: 'UNDERWRITING DOSSIER ASSEMBLED',
    dataPoints: [
      { label: 'Target ARV', value: '$240,000 (Verified Comps)' },
      { label: 'Scope Matrix', value: '$45,000 (Trade Verified)' },
      { label: 'Max Allowable Offer', value: '$123,000 (70% Discipline)' },
      { label: 'Data Certainty', value: 'KNOWN & ESTIMATED Bounds' }
    ]
  },
  {
    id: 'piper',
    number: '03',
    name: 'PIPER',
    subtitle: 'Acquisition Pipeline & Logistics Engine',
    icon: Workflow,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    description: 'Coordinates seller communication, title and closing logistics, contractor walkthrough scheduling, and senior lender capital draw timelines with structured outbox tracking.',
    propertyOverlay: 'ACQUISITION PIPELINE ACTIVE',
    dataPoints: [
      { label: 'Lead Stage', value: 'Qualified Direct Seller Intake' },
      { label: 'Title Review', value: 'Clear Title / Zero Liens Verified' },
      { label: 'Lender Packaging', value: '85% LTC Bridge Facility Prepped' },
      { label: 'Closing Target', value: '14-Day Expedited As-Is Close' }
    ]
  },
  {
    id: 'ocg',
    number: '04',
    name: 'OCG',
    subtitle: 'Human Judgment & Capital Execution',
    icon: UserCheck,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: 'Technology handles repetitive data aggregation and financial simulation. Genaro Ocasio and OCG principals apply localized human judgment, relationship trust, and physical project execution.',
    propertyOverlay: 'CAPITAL DEPLOYMENT APPROVED',
    dataPoints: [
      { label: 'Final Review', value: 'Founder & Principal Sign-Off' },
      { label: 'Renovation Lead', value: 'Dedicated OCG Site Supervision' },
      { label: 'Contingency Allocation', value: '$16,500 Reserves Segregated' },
      { label: 'Community Impact', value: 'Wichita Housing Stock Restored' }
    ]
  }
];

export function TechnologyPipelineSequence() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeStep = PIPELINE_STEPS[activeStepIndex];

  // Auto-advance step smoothly unless paused
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % PIPELINE_STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <section id="technology" className="relative py-24 bg-[#070A0F] text-white overflow-hidden border-t border-slate-800">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
            <Sparkles size={13} />
            <span>The Operating Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Technology doesn't make the decision.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-400">
              It helps us make a better one.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            HUNTER, VICTOR, and PIPER are purposeful operating engines engineered to handle data ingestion, financial underwriting, and acquisition logistics so our team can focus on judgment and execution.
          </p>
        </div>

        {/* Continuous Step Navigation Bar */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PIPELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'bg-slate-900 border-blue-500/80 shadow-xl shadow-blue-950 ring-1 ring-blue-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      STEP {step.number}
                    </span>
                    <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                  </div>
                  <div className="font-extrabold text-sm text-white tracking-wide">{step.name}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{step.subtitle}</div>

                  {/* Progress Indicator Bar */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeGlow"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* The One Continuous Animated Stage (Property Stays on Screen) */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-md">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
            
            {/* Left Box: The Property with Real-Time Pipeline Intelligence Overlay */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-950 aspect-[4/3]">
              <img 
                src="/images/transformations/bungalow-concept-after.jpg" 
                alt="Wichita Property Under Analysis"
                className="w-full h-full object-cover opacity-85 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              {/* Dynamic Status Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border backdrop-blur-md ${activeStep.badgeColor}`}>
                  <span className="w-2 h-2 rounded-full bg-current inline-block animate-pulse" />
                  {activeStep.propertyOverlay}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
                  {activeStep.id === 'ocg' ? 'OCG PRINCIPAL JUDGMENT' : `${activeStep.name} // SYSTEM SPECIFICATION`}
                </span>
              </div>

              {/* Bottom Live Data Feed on Property */}
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Live Assembly Matrix</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {activeStep.dataPoints.map((dp, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-900/80 border border-slate-800/60">
                      <div className="text-[10px] text-slate-500">{dp.label}</div>
                      <div className="font-semibold text-slate-200 truncate">{dp.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Box: Narrative & Operational Function */}
            <div className="flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400 font-mono">
                    PHASE {activeStep.number} OF 04
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-xs font-medium text-slate-400">{activeStep.subtitle}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeStep.name} Engine
                </h3>

                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                  {activeStep.description}
                </p>
              </div>

              {/* Pipeline Flow Indicator */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Operating Lifecycle Handoff
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span className={activeStepIndex >= 0 ? 'text-blue-400 font-bold' : 'text-slate-600'}>HUNTER</span>
                  <ChevronRight size={14} className="text-slate-600" />
                  <span className={activeStepIndex >= 1 ? 'text-blue-400 font-bold' : 'text-slate-600'}>VICTOR</span>
                  <ChevronRight size={14} className="text-slate-600" />
                  <span className={activeStepIndex >= 2 ? 'text-blue-400 font-bold' : 'text-slate-600'}>PIPER</span>
                  <ChevronRight size={14} className="text-slate-600" />
                  <span className={activeStepIndex >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>OCG EXECUTION</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setActiveStepIndex((prev) => (prev === 0 ? PIPELINE_STEPS.length - 1 : prev - 1));
                    setIsPlaying(false);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => {
                    setActiveStepIndex((prev) => (prev + 1) % PIPELINE_STEPS.length);
                    setIsPlaying(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>Next Phase</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MANDATORY OCG LAB REVEAL (Pull Back View)                     */}
        {/* ------------------------------------------------------------- */}
        <div className="max-w-5xl mx-auto mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-blue-950/20 border border-blue-500/20 shadow-xl text-center relative overflow-hidden">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
            <Sparkles size={13} />
            <span>Built From Real Operating Necessity</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Powered by technology developed by <span className="text-blue-400">OCG LAB</span>.
          </h3>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            OCG LAB builds the intelligent systems, AI agents, automation, visualization, and interfaces that power the OCG operating model.
          </p>

          <div className="mt-6 flex justify-center">
            <a 
              href="/about#lab"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-blue-500/40 text-xs font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-400 transition-all shadow-lg shadow-blue-950 cursor-pointer"
            >
              <span>Explore OCG LAB</span>
              <ArrowRight size={14} />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}

export default TechnologyPipelineSequence;

