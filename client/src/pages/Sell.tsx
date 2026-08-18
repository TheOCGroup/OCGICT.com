import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  HeartHandshake, 
  ShieldCheck, 
  Clock, 
  Bot, 
  Eye, 
  HelpCircle,
  Home as HomeIcon,
  Layers,
  MapPin
} from 'lucide-react';
import { GExperience } from '@/components/GExperience';

export function Sell() {
  const [activeTab, setActiveTab] = useState<'conversation' | 'form'>('conversation');
  const [selectedZone, setSelectedZone] = useState<'exterior' | 'roof' | 'windows' | 'entry' | 'landscape'>('exterior');
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    relationship: 'Owner / Title Holder',
    motivation: 'Inherited Property / Probate',
    timeline: 'Within 30 Days',
    address: '',
    neighborhood: 'College Hill',
    propertyType: 'Single Family Residence',
    conditionRating: 'Needs Major Cosmetic Rehab',
    repairsNeeded: [] as string[],
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const zones = {
    exterior: {
      title: 'Exterior Clapboard & Siding',
      original: 'Aged, weathered paint with localized moisture wear along foundation perimeter.',
      ocgVision: 'Prepared, primed, and finished with architectural charcoal mineral paint and sealed joints.',
      potential: 'Restores building envelope protection and creates modern curb appeal for neighborhood buyers.'
    },
    roof: {
      title: 'Architectural Shingle Roofing',
      original: 'Aging 3-tab shingles with granule loss and worn roof valleys.',
      ocgVision: 'Complete tear-off and replacement with 30-year architectural dimensional shingles and synthetic underlayment.',
      potential: 'Eliminates moisture risk and guarantees inspection compliance for the future homeowner.'
    },
    windows: {
      title: 'Windows & Thermal Glazing',
      original: 'Single-pane aluminum sliders with broken seals and drafts.',
      ocgVision: 'Energy Star double-pane vinyl replacement units with black exterior casing.',
      potential: 'Dramatically improves energy efficiency, natural lighting, and interior comfort.'
    },
    entry: {
      title: 'Front Porch & Entryway',
      original: 'Weathered concrete slab and dated iron railings.',
      ocgVision: 'Architectural cedar gabled portico with modern recessed downlighting and cedar trim.',
      potential: 'Creates an inviting, warm architectural focal point that honors Wichita neighborhood heritage.'
    },
    landscape: {
      title: 'Landscape & Curb Appeal',
      original: 'Overgrown shrubs crowding siding and broken perimeter fencing.',
      ocgVision: 'Low-maintenance native Kansas grasses, clean stone borders, and open sunlit lawn.',
      potential: 'Enhances drainage grading away from foundation and provides welcoming street presence.'
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-slate-100 selection:bg-amber-500 selection:text-white">
      
      {/* 1. SELLER HERO — PROPERTY FIRST, WARM & REASSURING */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-6 shadow-lg">
              <HeartHandshake size={14} />
              <span>Respectful Property Review & Seller Advisory</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              SELL YOUR PROPERTY<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-slate-300">
                WITH COMPLETE CLARITY.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              A straightforward property review. Clear options. No pressure. Whether managing an inherited estate, dealing with deferred maintenance, or transitioning an asset in Wichita—we evaluate what your property can become.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#transformation-experience"
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-500 transition-all shadow-xl shadow-amber-950 cursor-pointer"
              >
                <span>See What OCG Sees</span>
                <ArrowRight size={15} />
              </a>
              <a
                href="#seller-intake"
                className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-7 py-4 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-xl cursor-pointer"
              >
                <Bot size={15} className="text-amber-400" />
                <span>Talk to G About Your Property</span>
              </a>
            </div>

            {/* Three Reassurance Pillars */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-800/80 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>As-Is Acquisition</span>
                </div>
                <p className="text-xs text-slate-400">Zero repairs, zero cleaning, and zero staging required on your part.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>Flexible Timelines</span>
                </div>
                <p className="text-xs text-slate-400">Close in as few as 14 days, or take up to 60 days to transition comfortably.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <CheckCircle2 size={14} />
                  <span>Direct Principal Sale</span>
                </div>
                <p className="text-xs text-slate-400">No agent commissions, no open houses, and clear transaction terms.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THE SELLER PROPERTY TRANSFORMATION EXPERIENCE */}
      <section id="transformation-experience" className="py-24 bg-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Architectural Vision</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              We don't just see the house as it sits today.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-slate-400">
                We see what it can become.
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              When evaluating a home with deferred maintenance or historic character, we look past surface wear to envision structural restoration and neighborhood value-add.
            </p>
          </div>

          {/* Side-by-Side Original vs Transformed Potential */}
          <div className="grid lg:grid-cols-2 gap-8 items-stretch mb-10">
            
            {/* Original Condition Box */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Representative Original Condition
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Wichita Residential</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-800 aspect-[16/10] mb-4 bg-slate-950">
                  <img 
                    src="/images/seller/wichita_seller_original.jpg" 
                    alt="Original Property Condition" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Weathered exterior paint, aging 3-tab roof, overgrown foundation vegetation, and deferred maintenance common to 1950s Wichita housing stock.
                </p>
              </div>
            </div>

            {/* Transformed Potential Box */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-500/40 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    [ Conceptual Transformation ]
                  </span>
                  <span className="text-[11px] font-mono text-blue-300">OCG Value Vision</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-blue-500/30 aspect-[16/10] mb-4 bg-slate-950">
                  <img 
                    src="/images/seller/wichita_seller_potential.jpg" 
                    alt="Conceptual Property Transformation" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Modern charcoal palette with warm vertical cedar entry accents, new 30-year architectural roof, energy-efficient black windows, and native Kansas landscaping.
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Property Zone Breakdown */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Zone Analysis</div>
            <h3 className="text-xl font-bold text-white mb-6">Explore How OCG Restores Key Property Zones</h3>

            {/* Zone Buttons */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              {(Object.keys(zones) as Array<keyof typeof zones>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedZone(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedZone === key
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950 border border-amber-400'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {zones[key].title}
                </button>
              ))}
            </div>

            {/* Selected Zone Card */}
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observed Condition</div>
                <div className="text-xs text-slate-300 leading-relaxed">{zones[selectedZone].original}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">OCG Renovation Plan</div>
                <div className="text-xs text-slate-300 leading-relaxed">{zones[selectedZone].ocgVision}</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40">
                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1">Neighborhood Equity Impact</div>
                <div className="text-xs text-blue-200/90 leading-relaxed">{zones[selectedZone].potential}</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. CONVERSATIONAL G SELLER INTAKE + STRUCTURED FORM FALLBACK */}
      <section id="seller-intake" className="py-24 bg-[#0B1220] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
              <Bot size={13} />
              <span>Step-by-Step Property Advisory</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Thinking about selling? Let's evaluate the property.
            </h2>
            <p className="mt-3 text-base text-slate-300">
              You can talk conversationally through your situation with G, or fill out our direct 4-step property review form below.
            </p>

            {/* Mode Switcher */}
            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'conversation'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950 border border-amber-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bot size={15} />
                <span>Talk with G (Recommended)</span>
              </button>

              <button
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950 border border-amber-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <HomeIcon size={15} />
                <span>Direct Property Form</span>
              </button>
            </div>
          </div>

          {/* Render Active View */}
          {activeTab === 'conversation' ? (
            <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-6 sm:p-8">
              <div className="mb-4 pb-4 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold text-amber-400 uppercase tracking-wider">G Seller Advisory Session</span>
                <span className="font-mono text-[11px] text-slate-500">POWERED BY OCG LAB</span>
              </div>
              <GExperience />
            </div>
          ) : (
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
              
              {/* Form Step Tracker */}
              <div className="grid grid-cols-4 gap-2 mb-8">
                {['1. Situation', '2. Property', '3. Condition', '4. Contact'].map((stepName, i) => (
                  <div 
                    key={i} 
                    className={`text-center pb-2 border-b-2 text-xs font-bold uppercase tracking-wider ${
                      formStep === i + 1 
                        ? 'border-amber-400 text-amber-400' 
                        : formStep > i + 1 
                        ? 'border-emerald-500 text-emerald-400' 
                        : 'border-slate-800 text-slate-600'
                    }`}
                  >
                    {stepName}
                  </div>
                ))}
              </div>

              {/* Step 1: Situation */}
              {formStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Tell us about your ownership situation</h3>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Relationship to Property
                    </label>
                    <select 
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option>Owner / Title Holder</option>
                      <option>Executor / Personal Representative of Estate</option>
                      <option>Beneficiary / Family Member</option>
                      <option>Power of Attorney</option>
                      <option>Landlord / Investment Property Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Primary Motivation / Circumstance
                    </label>
                    <select 
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option>Inherited Property / Probate</option>
                      <option>Deferred Maintenance / Tired of Repairs</option>
                      <option>Downsizing / Estate Liquidation</option>
                      <option>Relocation / Fast Transition Needed</option>
                      <option>Tired Landlord / Problem Tenants</option>
                      <option>Exploring Options / Curious on Value</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Desired Closing Timeline
                    </label>
                    <select 
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option>As soon as possible (14–21 days)</option>
                      <option>Within 30–45 days</option>
                      <option>Within 60–90 days (Need time to pack/move)</option>
                      <option>Flexible / No Rush</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setFormStep(2)}
                      className="px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
                    >
                      Next: Property Details →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Property */}
              {formStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Where is the property located?</h3>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Property Street Address *
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. 248 S Rutan Ave, Wichita, KS"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Wichita Neighborhood
                    </label>
                    <select 
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option>College Hill / East Wichita</option>
                      <option>Crown Heights / Central</option>
                      <option>Delano / West Bank</option>
                      <option>Riverside / North</option>
                      <option>South City / Linwood</option>
                      <option>Derby / Surrounding Sedgwick County</option>
                      <option>Other Wichita Area</option>
                    </select>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      onClick={() => setFormStep(1)}
                      className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setFormStep(3)}
                      className="px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                    >
                      Next: Condition & Repairs →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Condition */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Overall property condition</h3>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Estimated Condition Level
                    </label>
                    <select 
                      value={formData.conditionRating}
                      onChange={(e) => setFormData({ ...formData, conditionRating: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option>Move-In Ready / Minor Cosmetic Paint</option>
                      <option>Dated / Needs Kitchen, Bath & Flooring Updates</option>
                      <option>Needs Major Cosmetic & Mechanical Rehab (Roof/HVAC)</option>
                      <option>Full Gut Renovation / Heavy Deferred Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Notes on Specific Repairs or Situation
                    </label>
                    <textarea 
                      rows={3}
                      placeholder="Any notes regarding roof age, HVAC, foundation, or personal property left behind..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      onClick={() => setFormStep(2)}
                      className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setFormStep(4)}
                      className="px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                    >
                      Next: Contact Information →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Contact */}
              {formStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Where can we send your preliminary review?</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Your Full Name *
                      </label>
                      <input 
                        type="text"
                        placeholder="First and Last Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Phone Number *
                      </label>
                      <input 
                        type="tel"
                        placeholder="(316) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Email Address *
                    </label>
                    <input 
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <button
                      onClick={() => setFormStep(3)}
                      className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        alert("Thank you. Genaro Ocasio and the OCG acquisition team will review Sedgwick County public records and contact you within 24 hours.");
                      }}
                      className="px-8 py-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 shadow-xl shadow-amber-950 cursor-pointer"
                    >
                      Submit For Preliminary Review
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </section>

    </div>
  );
}

export default Sell;

