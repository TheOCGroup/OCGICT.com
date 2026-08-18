import React, { useState, useRef, useCallback } from "react";
import { Sparkles, Hammer, MapPin, DollarSign, MoveHorizontal, ChevronRight } from "lucide-react";

interface PropertyCase {
  id: string;
  name: string;
  neighborhood: string;
  propertyType: string;
  sqft: string;
  yearBuilt: string;
  beforeImg: string;
  afterImg: string;
  estimatedRehab: string;
  projectedArv: string;
  targetBuyer: string;
  scopeItems: string[];
  designStrategy: string;
}

const properties: PropertyCase[] = [
  {
    id: "bungalow",
    name: "College Hill Craftsman",
    neighborhood: "College Hill / Central Wichita",
    propertyType: "1.5-Story Craftsman Bungalow",
    sqft: "1,640 sq ft",
    yearBuilt: "1932",
    beforeImg: "/images/transformations/bungalow-before.jpg",
    afterImg: "/images/transformations/bungalow-concept-after.jpg",
    estimatedRehab: "$48,500",
    projectedArv: "$235,000",
    targetBuyer: "Owner-Occupant / First-Time Move-Up Buyer",
    scopeItems: [
      "Exterior restoration: Charcoal siding + clean alabaster white trim",
      "Restored natural cedar porch deck & structural balusters",
      "New architectural 30-year shingle roof system",
      "Energy-efficient black clad double-hung windows",
      "Native Kansas ornamental landscaping & clean concrete approach"
    ],
    designStrategy: "Preserving historic craftsman character while infusing modern architectural contrast to maximize neighborhood equity ceiling."
  },
  {
    id: "ranch",
    name: "Crown Heights Mid-Century",
    neighborhood: "East Wichita / Crown Heights Area",
    propertyType: "Mid-Century Brick Ranch",
    sqft: "1,820 sq ft",
    yearBuilt: "1965",
    beforeImg: "/images/transformations/ranch-before.jpg",
    afterImg: "/images/transformations/ranch-concept-after.jpg",
    estimatedRehab: "$54,000",
    projectedArv: "$278,000",
    targetBuyer: "Turnkey Relocation / Young Professional Family",
    scopeItems: [
      "Limewashed brick facade with charcoal architectural gable",
      "Natural warm cedar wood entryway privacy slats & custom door",
      "Frosted vertical glass modern black garage door",
      "Architectural low-voltage landscape lighting + rock bed mulch",
      "Full interior reconfiguration to open-concept kitchen/living"
    ],
    designStrategy: "Elevating dated 1960s brick into a crisp modern ranch without exceeding neighborhood comp thresholds."
  }
];

export default function InteractiveTransformSlider() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleGAction = (e: any) => {
      if (e.detail?.type === "load_property_case" && e.detail.payload?.propertyId) {
        const targetId = e.detail.payload.propertyId;
        const foundIdx = properties.findIndex((p) => p.id === targetId);
        if (foundIdx !== -1) {
          setActiveIdx(foundIdx);
        }
      }
    };
    window.addEventListener("ocg:g-action", handleGAction);
    return () => window.removeEventListener("ocg:g-action", handleGAction);
  }, []);

  const activeProp = properties[activeIdx];

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0B0F17] p-6 lg:p-8 shadow-2xl">
      {/* Property Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            <Sparkles size={14} /> Authentic Wichita Visual World
          </div>
          <h3 className="mt-1 text-2xl font-bold text-white tracking-tight">
            Strategic Property Transformation
          </h3>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 p-1.5 border border-slate-800">
          {properties.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveIdx(idx);
                setSliderPos(50);
              }}
              className={`rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                activeIdx === idx
                  ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
        {/* Interactive Image Split Slider */}
        <div className="relative">
          <div
            ref={containerRef}
            className="relative h-[340px] sm:h-[420px] md:h-[480px] w-full select-none overflow-hidden rounded-2xl border border-slate-800 cursor-ew-resize shadow-inner"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onClick={(e) => handleMove(e.clientX)}
          >
            {/* After Image (Background) */}
            <img
              src={activeProp.afterImg}
              alt="Conceptual transformation after"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />

            {/* Before Image (Clipped Overlay) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={activeProp.beforeImg}
                alt="Distressed property before"
                className="absolute inset-0 h-full w-full object-cover max-w-none"
                style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%" }}
                loading="lazy"
              />
              <div className="absolute top-4 left-4 rounded-full bg-black/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-200 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Hammer size={12} className="text-amber-400" /> Existing Condition
              </div>
            </div>

            {/* After Label */}
            <div className="absolute top-4 right-4 rounded-full bg-blue-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200 backdrop-blur-md border border-blue-500/30 flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-400" /> Proposed Transformation
            </div>

            {/* Split Divider Line & Handle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl">
                <MoveHorizontal size={16} />
              </div>
            </div>

            {/* Bottom Floating Legend */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between rounded-xl bg-slate-950/85 px-4 py-2.5 backdrop-blur-md border border-white/10 text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <MapPin size={13} className="text-blue-400" /> {activeProp.neighborhood}
              </span>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300 border border-blue-400/30">
                Conceptual Transformation
              </span>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500 italic">
            Drag or click slider to compare pre-acquisition condition with OCG value-add design concept.
          </p>
        </div>

        {/* Strategic Analysis & Scope Breakdown */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Estimated Rehab</span>
                <div className="mt-1 text-2xl font-bold text-white tracking-tight">{activeProp.estimatedRehab}</div>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Target ARV</span>
                <div className="mt-1 text-2xl font-bold text-blue-400 tracking-tight">{activeProp.projectedArv}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div><span className="text-slate-500">Square Footage:</span> {activeProp.sqft}</div>
              <div><span className="text-slate-500">Year Built:</span> {activeProp.yearBuilt}</div>
              <div className="col-span-2"><span className="text-slate-500">Target Buyer:</span> {activeProp.targetBuyer}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 mb-3">
              Renovation & Value-Add Strategy
            </h4>
            <p className="text-sm leading-relaxed text-slate-400 mb-4">
              {activeProp.designStrategy}
            </p>

            <ul className="space-y-2">
              {activeProp.scopeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <ChevronRight size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/80 leading-snug">
            <strong>Data Integrity Notice:</strong> All renovation figures and ARV projections represent modeled frameworks subject to physical contractor scoping and formal title verification. Conceptual transformations are for strategic illustration.
          </div>
        </div>
      </div>
    </div>
  );
}
