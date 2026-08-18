import React, { useState } from "react";
import { Search, Calculator, GitCommit, UserCheck, ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";

interface AgentModule {
  id: string;
  name: string;
  role: string;
  headline: string;
  description: string;
  sampleSignals: string[];
  responsibilities: string[];
}

const agents: AgentModule[] = [
  {
    id: "hunter",
    name: "HUNTER",
    role: "Deal Finder · Opportunity Intelligence",
    headline: "Discovery & Signal Extraction",
    description: "Evaluates market activity, public filings, estate dispositions, and off-market distress signals across Wichita neighborhoods to surface viable acquisition targets.",
    sampleSignals: [
      "Tax assessment vs historical transaction price discrepancies",
      "Notice of default / Sedgwick County probate tracking",
      "Off-market distress indicators & micro-neighborhood velocity",
      "Long-term landlord portfolio exit signatures"
    ],
    responsibilities: [
      "Property Identification",
      "Initial Record Pull (Sedgwick County / Wichita records)",
      "Opportunity Signal Flagging",
      "Intake Queue Routing"
    ]
  },
  {
    id: "victor",
    name: "VICTOR",
    role: "Deal Scout · Underwriting & Property Intelligence",
    headline: "Rigorous Financial & Scope Underwriting",
    description: "Deep-dives into physical condition, photographic evidence, comparable sales radius, renovation category costs, and MAO boundaries to model returns across Flip and BRRRR scenarios.",
    sampleSignals: [
      "Micro-radius MLS comp clustering (0.5 mi)",
      "Wichita cost-per-sqft contractor rate tables",
      "70% Rule MAO threshold calculation",
      "Dual-scenario modeling (Flip Resale vs DSCR Refinance)"
    ],
    responsibilities: [
      "Comparable Sales Clustering",
      "Detailed Renovation Scoping",
      "MAO & Acquisition Pricing Calculation",
      "Lender Debt Service Modeling"
    ]
  },
  {
    id: "piper",
    name: "PIPER",
    role: "Pipeline Engine · Acquisition Operations",
    headline: "Transaction Flow & Milestone Integrity",
    description: "Manages the operational lifecycle of live opportunities—tracking negotiation milestones, inspection contingencies, title verification, lender packet packaging, and closing prep.",
    sampleSignals: [
      "Contract timeline & contingency tracking",
      "Lender review packet assembly",
      "Title search & municipal lien checks",
      "Closing coordination timeline alerts"
    ],
    responsibilities: [
      "Contract & Stage Tracking",
      "Lender Due Diligence Packaging",
      "Timeline & Inspection Contingency Alarms",
      "Handoff to Renovation Execution"
    ]
  },
  {
    id: "ocg",
    name: "OCG",
    role: "Human Strategy · Judgment + Execution",
    headline: "The Decision, Design & Execution Core",
    description: "Where technology ends and human responsibility begins. OCG evaluates the deal within client goals, finalizes design direction, structures financing, conducts physical walk-throughs, and executes.",
    sampleSignals: [
      "Interior design & spatial optimization plan",
      "Personal client liquidity & risk alignment",
      "On-site physical contractor walkthrough",
      "Final offer conviction & contract signing"
    ],
    responsibilities: [
      "Strategic Offer Approval",
      "Architectural & Renovation Design",
      "Financing Structure Finalization",
      "Project Management & Asset Resale"
    ]
  }
];

export default function TechnologyEcosystem() {
  const [activeTab, setActiveTab] = useState<string>("hunter");
  const current = agents.find((a) => a.id === activeTab) || agents[0];

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0B0F17] p-6 lg:p-12 shadow-2xl">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
          OCG Technology Ecosystem
        </div>
        <h3 className="mt-3 text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
          Technology doesn't make the decision.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
            It helps us make a better one.
          </span>
        </h3>
        <p className="mt-4 text-sm md:text-base text-slate-400 leading-relaxed">
          HUNTER, VICTOR, and PIPER are not marketing mascots. They are purposeful operating systems engineered to handle data ingestion, financial underwriting, and acquisition logistics so our team can focus on judgment and execution.
        </p>
      </div>

      {/* System Progression Bar */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-slate-800 pb-6">
        {agents.map((agent, idx) => (
          <button
            key={agent.id}
            onClick={() => setActiveTab(agent.id)}
            className={`rounded-2xl p-4 text-left transition-all border ${
              activeTab === agent.id
                ? "bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/40"
                : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-blue-400 uppercase tracking-widest font-bold">
                Step 0{idx + 1}
              </span>
              {activeTab === agent.id && (
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              )}
            </div>
            <div className="mt-2 text-lg font-black text-white">{agent.name}</div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">{agent.role.split("·")[0]}</div>
          </button>
        ))}
      </div>

      {/* Active System Details */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
              {current.role}
            </span>
            <h4 className="text-2xl md:text-3xl font-bold text-white mt-1">
              {current.headline}
            </h4>
            <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed">
              {current.description}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <CheckCircle size={15} className="text-blue-400" />
              Core Operating Responsibilities
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {current.responsibilities.map((resp, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-blue-400 font-mono text-[10px]">✓</span>
                  <span>{resp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operating Signals Specification Mock */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {current.name} // SPECIFICATION
            </span>
            <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
              ARCHITECTURE MODEL
            </span>
          </div>

          <div className="space-y-2.5">
            {current.sampleSignals.map((sig, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs text-slate-300">
                <div className="font-mono text-[10px] text-slate-500 mb-1">Signal Protocol 0{idx + 1}</div>
                <div>{sig}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-500 italic">
              Integrated inside OCG operating procedures for consistent acquisition execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
