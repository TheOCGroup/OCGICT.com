import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  ArrowRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Hammer,
  DollarSign
} from 'lucide-react';

interface TransformationCase {
  id: string;
  name: string;
  neighborhood: string;
  yearBuilt: number;
  squareFeet: number;
  existingConditionImg: string;
  conceptualAfterImg: string;
  estimatedRehab: number;
  targetArv: number;
  targetBuyer: string;
  narrative: string;
  hotspots: Array<{
    id: string;
    label: string;
    top: number; // percentage
    left: number; // percentage
    category: 'EXTERIOR' | 'MECHANICAL' | 'DESIGN' | 'ROOF' | 'LANDSCAPE';
    currentIssue: string;
    proposedIntervention: string;
    whyItMatters: string;
    valueStrategy: string;
    certainty: 'KNOWN' | 'ESTIMATED' | 'PROVISIONAL';
  }>;
}

const TRANSFORMATION_CASES: TransformationCase[] = [
  {
    id: 'college_hill',
    name: 'College Hill 1930s Craftsman',
    neighborhood: 'College Hill / Central Wichita',
    yearBuilt: 1932,
    squareFeet: 1640,
    existingConditionImg: '/images/transformations/bungalow-before.jpg',
    conceptualAfterImg: '/images/transformations/bungalow-concept-after.jpg',
    estimatedRehab: 48500,
    targetArv: 235000,
    targetBuyer: 'Owner-Occupant / First-Time Move-Up Buyer',
    narrative: 'Preserving historic craftsman character while infusing modern architectural contrast to maximize neighborhood equity ceiling.',
    hotspots: [
      {
        id: 'roof',
        label: 'Architectural Roof & Eaves',
        top: 25,
        left: 32,
        category: 'ROOF',
        currentIssue: 'Weathered 3-tab asphalt shingles nearing end of functional lifecycle with minor soffit rot.',
        proposedIntervention: 'Complete tear-off and installation of 30-year architectural dimensional shingles with ice-and-water shield.',
        whyItMatters: 'Protects interior envelope and satisfies strict buyer home inspection contingencies.',
        valueStrategy: 'Appraisal quality rating upgrade from Q5 to Q3 in Sedgwick County comps.',
        certainty: 'KNOWN'
      },
      {
        id: 'porch',
        label: 'Front Porch & Cedar Balusters',
        top: 65,
        left: 45,
        category: 'DESIGN',
        currentIssue: 'Sagging non-historic porch stairs and peeling paint over original timber framing.',
        proposedIntervention: 'Structural sistering of porch floor joists, restored natural cedar balustrades, and stained timber posts.',
        whyItMatters: 'Creates the primary emotional curb appeal moment for College Hill buyers.',
        valueStrategy: 'Elevates visual pricing tier and accelerates initial days-on-market velocity.',
        certainty: 'KNOWN'
      },
      {
        id: 'siding',
        label: 'Charcoal & Alabaster Palette',
        top: 48,
        left: 70,
        category: 'EXTERIOR',
        currentIssue: 'Chalking green paint with localized moisture intrusion along north-facing clapboards.',
        proposedIntervention: 'Scraped, primed with elastomeric bonding primer, and finished in matte charcoal with clean alabaster trim.',
        whyItMatters: 'Establishes contemporary design authority while honoring neighborhood historic fabric.',
        valueStrategy: 'Expands buyer demographic to design-conscious medical and aviation professionals.',
        certainty: 'ESTIMATED'
      },
      {
        id: 'landscape',
        label: 'Native Kansas Landscaping',
        top: 82,
        left: 55,
        category: 'LANDSCAPE',
        currentIssue: 'Overgrown junipers crowding foundation wall and broken concrete perimeter chain-link fence.',
        proposedIntervention: 'Chain-link removal, fresh smooth concrete walkway, and drought-tolerant Kansas native grasses and perennials.',
        whyItMatters: 'Improves drainage grade away from basement foundation walls.',
        valueStrategy: 'Eliminates water penetration objection during buyer underwriting.',
        certainty: 'KNOWN'
      }
    ]
  },
  {
    id: 'crown_heights',
    name: 'Crown Heights Mid-Century Ranch',
    neighborhood: 'Crown Heights / East Wichita',
    yearBuilt: 1958,
    squareFeet: 1820,
    existingConditionImg: '/images/transformations/ranch-before.jpg',
    conceptualAfterImg: '/images/transformations/ranch-concept-after.jpg',
    estimatedRehab: 54000,
    targetArv: 265000,
    targetBuyer: 'Young Family / Design-Conscious Professional',
    narrative: 'Transforming tired 1950s brick into a striking Scandinavian-inspired modern ranch with organic timber portico.',
    hotspots: [
      {
        id: 'brick',
        label: 'Limewash & Siding Transition',
        top: 45,
        left: 28,
        category: 'EXTERIOR',
        currentIssue: 'Mismatched aged red brick with heavy staining and outdated decorative iron scrollwork.',
        proposedIntervention: 'Breathable mineral limewash finish paired with horizontal graphite board-and-batten accents.',
        whyItMatters: 'Permeable mineral finish prevents moisture trapping while revitalizing facade aesthetics.',
        valueStrategy: 'Differentiates property from un-renovated 1950s ranch inventory across Crown Heights.',
        certainty: 'KNOWN'
      },
      {
        id: 'portico',
        label: 'Architectural Cedar Gabled Portico',
        top: 40,
        left: 58,
        category: 'DESIGN',
        currentIssue: 'Flat, uninviting entry slab with minimal rain shelter.',
        proposedIntervention: 'New pitched gabled portico framed with Douglas fir vertical timber slats and modern recessed downlighting.',
        whyItMatters: 'Adds architectural verticality and focal point to a long horizontal ranch profile.',
        valueStrategy: 'Increases perceived square footage and photo click-through rate on digital portals.',
        certainty: 'ESTIMATED'
      },
      {
        id: 'windows',
        label: 'Black-Clad Low-E Windows',
        top: 50,
        left: 76,
        category: 'MECHANICAL',
        currentIssue: 'Single-pane aluminum sliders with broken thermal seals causing condensation.',
        proposedIntervention: 'Energy Star double-pane argon-filled low-E vinyl windows with black exterior cladding.',
        whyItMatters: 'Reduces HVAC utility costs and dampens neighborhood traffic sound.',
        valueStrategy: 'Appraisal energy efficiency credit and immediate buyer reassurance.',
        certainty: 'KNOWN'
      }
    ]
  },
  {
    id: 'delano',
    name: 'Historic Delano Worker Cottage',
    neighborhood: 'Historic Delano District',
    yearBuilt: 1924,
    squareFeet: 1210,
    existingConditionImg: '/images/transformations/wichita_delano_before.jpg',
    conceptualAfterImg: '/images/transformations/wichita_delano_after.jpg',
    estimatedRehab: 36000,
    targetArv: 195000,
    targetBuyer: 'First-Time Homebuyer / Urban Professional',
    narrative: 'Strategic infill modernization balancing compact efficiency with urban Delano walkability.',
    hotspots: [
      {
        id: 'entry',
        label: 'Historic Cottage Porch Rebuild',
        top: 60,
        left: 42,
        category: 'DESIGN',
        currentIssue: 'Weathered porch decking and rotted foundation post skirts.',
        proposedIntervention: 'Rebuilt pressure-treated framework with cedar tongue-and-groove porch ceiling and matte black fixtures.',
        whyItMatters: 'Essential for historic district integrity and neighborhood outdoor living.',
        valueStrategy: 'High-margin entry restoration that commands top dollar per square foot.',
        certainty: 'KNOWN'
      },
      {
        id: 'siding_delano',
        label: 'Slate Siding & Architectural Trim',
        top: 42,
        left: 68,
        category: 'EXTERIOR',
        currentIssue: 'Aged asbestos/composite shingle siding requiring remediation.',
        proposedIntervention: 'Safe overlay/re-siding with modern deep slate horizontal lap siding and crisp white window framing.',
        whyItMatters: 'Safe, durable, low-maintenance exterior for the next 30 years.',
        valueStrategy: 'Enables conventional and FHA financing without condition repair escrows.',
        certainty: 'KNOWN'
      }
    ]
  }
];

export function InteractiveTransformSlider() {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const activeCase = TRANSFORMATION_CASES[activeCaseIndex];
  const selectedHotspot = activeCase.hotspots.find(h => h.id === activeHotspot) || activeCase.hotspots[0];

  const handleSliderMove = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.touches[0].clientX, rect);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.clientX, rect);
  };

  return (
    <section id="transformations" className="relative py-24 bg-[#070A0F] text-white overflow-hidden border-t border-slate-800">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
            <Sparkles size={13} />
            <span>Authentic Wichita Architectural World</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Strategic Property Transformation.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            We don't simply renovate houses—we unlock neighborhood equity through disciplined architectural design, verified contractor scopes, and target buyer positioning.
          </p>

          {/* Neighborhood Case Study Tabs */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-8">
            {TRANSFORMATION_CASES.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCaseIndex(idx);
                  setActiveHotspot(null);
                  setSliderPosition(50);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCaseIndex === idx
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Immersive Transformation Viewport */}
        <div className="max-w-6xl mx-auto">
          
          {/* Main Visual Slider Box */}
          <div 
            className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 aspect-[16/9] select-none touch-none cursor-ew-resize group"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
          >
            {/* Conceptual After Image (Bottom Layer) */}
            <img 
              src={activeCase.conceptualAfterImg}
              alt="Conceptual Renovation"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Existing Original Condition Image (Clipped Top Layer) */}
            <div 
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <img 
                src={activeCase.existingConditionImg}
                alt="Representative Original Condition"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', minWidth: '100%' }}
              />
              <div className="absolute inset-0 bg-slate-950/10 pointer-events-none" />
            </div>

            {/* Interactive Hotspots Overlay */}
            {activeCase.hotspots.map((spot) => (
              <button
                key={spot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot(spot.id);
                }}
                style={{ top: `${spot.top}%`, left: `${spot.left}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-2 rounded-full transition-all cursor-pointer ${
                  activeHotspot === spot.id
                    ? 'bg-blue-500 text-white scale-125 ring-4 ring-blue-400/50 shadow-xl'
                    : 'bg-slate-900/90 text-blue-300 border border-blue-400/60 hover:scale-110 shadow-lg'
                }`}
                title={spot.label}
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </button>
            ))}

            {/* Divider Line & Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-30 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-blue-600 font-bold text-xs">
                ⇄
              </div>
            </div>

            {/* Permanent Verified Badges */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700 text-[11px] font-bold uppercase tracking-wider text-amber-400 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Representative Original Condition
              </span>
            </div>

            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-950/85 backdrop-blur-md border border-blue-500/50 text-[11px] font-bold uppercase tracking-wider text-blue-300 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block animate-pulse" />
                [ Conceptual Transformation ]
              </span>
            </div>

            {/* Bottom Location Indicator */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-200">
                <MapPin size={13} className="text-blue-400" />
                <span>{activeCase.neighborhood}</span>
                <span className="text-slate-500">·</span>
                <span>Built {activeCase.yearBuilt}</span>
                <span className="text-slate-500">·</span>
                <span>{activeCase.squareFeet.toLocaleString()} sq ft</span>
              </div>
            </div>
          </div>

          {/* Underwriting Metrics & Hotspot Inspector Drawer */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            
            {/* Left Box: Underwriting Summary */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Underwriting Overview</div>
                <h3 className="text-xl font-bold text-white">{activeCase.name}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{activeCase.narrative}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div>
                  <div className="text-[11px] font-medium text-slate-400">ESTIMATED REHAB</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">${activeCase.estimatedRehab.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-400">TARGET ARV</div>
                  <div className="text-2xl font-black text-blue-400 font-mono">${activeCase.targetArv.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Right 2-Cols: Architectural Hotspot Inspector */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Architectural Intervention Focus</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    {selectedHotspot.category}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Data Certainty: <span className="font-semibold text-emerald-400">{selectedHotspot.certainty}</span>
                </div>
              </div>

              <h4 className="text-lg font-bold text-white">{selectedHotspot.label}</h4>

              <div className="mt-4 grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">Observed Existing Issue</div>
                  <div className="text-slate-300 leading-relaxed">{selectedHotspot.currentIssue}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">Proposed OCG Intervention</div>
                  <div className="text-slate-300 leading-relaxed">{selectedHotspot.proposedIntervention}</div>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 flex items-start gap-2.5 text-xs">
                <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-200">Value-Add Strategy: </span>
                  <span className="text-blue-300/90">{selectedHotspot.valueStrategy}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Transparent Integrity Notice */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-500">
              Data Integrity Notice: Renovation scopes and ARV projections represent modeled acquisition frameworks verified against Sedgwick County micro-neighborhood comps. Conceptual transformations are architectural illustrations.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default InteractiveTransformSlider;

