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
  Home as HomeIcon,
  Search,
  AlertCircle,
  FileText,
  DollarSign,
  Phone,
  Mail,
  HelpCircle,
  RefreshCw,
  MapPin,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ISellerIntakePayload, ISellerOfferResult } from '../../../shared/contracts';
import { GExperience } from '@/components/GExperience';

export function Sell() {
  const [activeMode, setActiveMode] = useState<'flow' | 'conversation'>('flow');
  const [step, setStep] = useState<number>(1);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicMatch, setPublicMatch] = useState<any | null>(null);
  const [offerResult, setOfferResult] = useState<ISellerOfferResult | null>(null);

  const [formData, setFormData] = useState<ISellerIntakePayload>({
    address: '',
    city: 'Wichita',
    state: 'KS',
    zip: '67218',
    propertyCondition: 'Needs Major Cosmetic & Mechanical Rehab',
    occupancyStatus: 'Vacant',
    sellerSituation: 'Inherited Property / Probate',
    desiredTimeline: 'Within 30-45 Days',
    primaryPriority: 'No Repairs / As-Is',
    knownRepairs: ['Roof / Shingles (Aging)'],
    sellerNotes: '',
    fullName: '',
    email: '',
    phone: '',
    preferredContact: 'Phone'
  });

  // Handle Address Lookup & Background Research Trigger
  const handleAddressSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.address.trim()) return;

    setIsSearchingAddress(true);
    try {
      const res = await fetch('/api/seller/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: formData.address })
      });
      const data = await res.json();
      if (data.found && data.publicRecord) {
        setPublicMatch(data.publicRecord);
        if (data.publicRecord.livingAreaSqft) {
          setFormData(prev => ({ ...prev, city: 'Wichita', state: 'KS' }));
        }
      } else {
        setPublicMatch(null);
      }
    } catch (err) {
      console.warn('Address lookup error, continuing:', err);
    } finally {
      setIsSearchingAddress(false);
      setStep(2);
    }
  };

  // Handle Final Submission & Underwriting Offer Generation
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/seller/preliminary-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result: ISellerOfferResult = await res.json();
      setOfferResult(result);
      setStep(5); // Results View
    } catch (err) {
      console.error('Error generating preliminary offer:', err);
      alert('Unable to connect to underwriting service. Please verify network connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRepair = (repair: string) => {
    const current = formData.knownRepairs || [];
    if (current.includes(repair)) {
      setFormData({ ...formData, knownRepairs: current.filter(r => r !== repair) });
    } else {
      setFormData({ ...formData, knownRepairs: [...current, repair] });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-slate-100 selection:bg-amber-500 selection:text-white">
      
      {/* 1. SELLER HERO — CALM, RESPECTFUL & PROPERTY-FIRST */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-6 shadow-lg">
            <HeartHandshake size={14} />
            <span>Respectful Property Review & Direct Acquisition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            SELL YOUR PROPERTY<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-slate-300">
              WITH COMPLETE CLARITY.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            A straightforward property review. Clear options. No pressure. Enter your address to start background research and receive an objective preliminary offer range for your Wichita property.
          </p>

          {/* Mode Switcher */}
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => setActiveMode('flow')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'flow'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950 border border-amber-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <HomeIcon size={15} />
              <span>Instant Property Review Flow</span>
            </button>

            <button
              onClick={() => setActiveMode('conversation')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeMode === 'conversation'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950 border border-amber-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Bot size={15} />
              <span>Talk to G (Conversational)</span>
            </button>
          </div>

          {/* Three Reassurance Pillars */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={14} />
                <span>As-Is Purchase</span>
              </div>
              <p className="text-xs text-slate-400">Zero cleaning, staging, or contractor repair costs.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={14} />
                <span>Guarded Pricing</span>
              </div>
              <p className="text-xs text-slate-400">Deterministic 70% underwriting based on verified Sedgwick County comps.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <CheckCircle2 size={14} />
                <span>Zero Commissions</span>
              </div>
              <p className="text-xs text-slate-400">Direct principal sale with title and closing costs covered.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE MAIN SELLER ACQUISITION ENGINE */}
      <section className="py-20 bg-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          
          {activeMode === 'conversation' ? (
            <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-6 sm:p-8">
              <div className="mb-4 pb-4 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span className="font-bold text-amber-400 uppercase tracking-wider">G Seller Advisory Session</span>
                <span className="font-mono text-[11px] text-slate-500">POWERED BY OCG LAB</span>
              </div>
              <GExperience />
            </div>
          ) : (
            <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
              
              {/* Step Progress Tracker (Steps 1 to 4 + Results) */}
              {step < 5 && (
                <div className="grid grid-cols-4 gap-2 mb-8">
                  {[
                    { num: 1, label: '1. Address' },
                    { num: 2, label: '2. Condition' },
                    { num: 3, label: '3. Situation' },
                    { num: 4, label: '4. Contact' }
                  ].map((s) => (
                    <div 
                      key={s.num}
                      className={`text-center pb-2 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        step === s.num
                          ? 'border-amber-400 text-amber-400'
                          : step > s.num
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-slate-800 text-slate-600'
                      }`}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 1: ADDRESS-FIRST & PARALLEL BACKGROUND RESEARCH                      */}
              {/* ========================================================================= */}
              {step === 1 && (
                <form onSubmit={handleAddressSubmit} className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      <MapPin size={14} />
                      <span>Step 01 · Property Address</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Where is your property located?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      We immediately begin background cross-referencing against Sedgwick County appraisal rolls and neighborhood comps.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Wichita Property Address *
                    </label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="e.g. 248 S Rutan Ave, Wichita, KS 67218"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="w-full p-4 pl-12 rounded-2xl bg-slate-950 border border-slate-800 text-white text-base focus:border-amber-400 focus:outline-none placeholder-slate-600"
                      />
                      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>

                  {/* Pre-Loaded Quick Selection for Wichita Corridors */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Try a Verified Canonical Wichita Property
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { addr: '248 S Rutan Ave', hood: 'College Hill' },
                        { addr: '1421 N Glendale Ave', hood: 'Crown Heights' },
                        { addr: '814 N Delano St', hood: 'Historic Delano' }
                      ].map((item) => (
                        <button
                          key={item.addr}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, address: `${item.addr}, Wichita, KS` });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:border-amber-500/50 hover:text-white transition-all cursor-pointer"
                        >
                          📍 {item.addr} <span className="text-slate-500">({item.hood})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSearchingAddress || !formData.address.trim()}
                      className="flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all shadow-xl shadow-amber-950 cursor-pointer"
                    >
                      {isSearchingAddress ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Searching Sedgwick County Records...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Condition →</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: PROPERTY CONDITION & KNOWN REPAIRS                                */}
              {/* ========================================================================= */}
              {step === 2 && (
                <div className="space-y-6">
                  
                  {/* Public Record Badge if Found */}
                  {publicMatch && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Sedgwick County Record Matched</div>
                          <div className="text-slate-400 text-[11px]">
                            Parcel: {publicMatch.parcelId} · {publicMatch.livingAreaSqft} sq ft · Built {publicMatch.yearBuilt} · {publicMatch.taxDistrict}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">
                        VERIFIED KNOWN
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      <span>Step 02 · Condition & Scope</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      What is the current condition of the house?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      We evaluate properties in any condition. Honest answers help us calculate an accurate preliminary offer range.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Overall Condition Level *
                    </label>
                    <select
                      value={formData.propertyCondition}
                      onChange={(e) => setFormData({ ...formData, propertyCondition: e.target.value as any })}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-400 focus:outline-none"
                    >
                      <option>Move-In Ready</option>
                      <option>Dated / Needs Updates</option>
                      <option>Needs Major Cosmetic & Mechanical Rehab</option>
                      <option>Full Gut / Major Deferred Maintenance</option>
                      <option>Severe Structural / Fire Damage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Major Known Repairs or System Replacements Needed
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        'Roof / Shingles (Aging)',
                        'HVAC / Furnace Replacement',
                        'Foundation / Settling Cracks',
                        'Plumbing / Cast Iron Stacks',
                        'Electrical / Fuse Box',
                        'Kitchen Remodel',
                        'Bathrooms Remodel',
                        'Extensive Trash / Personal Items'
                      ].map((item) => {
                        const isSelected = (formData.knownRepairs || []).includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleRepair(item)}
                            className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                    >
                      Next: Situation & Timeline →
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: SELLER SITUATION, OCCUPANCY & PRIORITIES                         */}
              {/* ========================================================================= */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      <span>Step 03 · Situation & Goals</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      What are your timing and transition goals?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      This allows us to tailor closing terms, occupancy transitions, or estate clearances to your needs.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Primary Circumstance / Situation
                      </label>
                      <select
                        value={formData.sellerSituation}
                        onChange={(e) => setFormData({ ...formData, sellerSituation: e.target.value as any })}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option>Inherited Property / Probate</option>
                        <option>Downsizing / Estate Liquidation</option>
                        <option>Deferred Maintenance</option>
                        <option>Relocation / Quick Transition</option>
                        <option>Tired Landlord</option>
                        <option>Exploring Options</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Occupancy Status
                      </label>
                      <select
                        value={formData.occupancyStatus}
                        onChange={(e) => setFormData({ ...formData, occupancyStatus: e.target.value as any })}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option>Vacant</option>
                        <option>Owner Occupied</option>
                        <option>Tenant Occupied</option>
                        <option>Estate / Unoccupied</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Desired Closing Timeline
                      </label>
                      <select
                        value={formData.desiredTimeline}
                        onChange={(e) => setFormData({ ...formData, desiredTimeline: e.target.value as any })}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option>Immediate (14-21 Days)</option>
                        <option>Within 30-45 Days</option>
                        <option>60-90 Days</option>
                        <option>Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Your Number One Priority
                      </label>
                      <select
                        value={formData.primaryPriority}
                        onChange={(e) => setFormData({ ...formData, primaryPriority: e.target.value as any })}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option>No Repairs / As-Is</option>
                        <option>Speed & Convenience</option>
                        <option>Maximum Net Cash</option>
                        <option>Flexible Closing Date</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Optional Seller Notes
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="Any additional details regarding probate, title, condition, or special requirements..."
                      value={formData.sellerNotes}
                      onChange={(e) => setFormData({ ...formData, sellerNotes: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 cursor-pointer"
                    >
                      Next: Contact Information →
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: CONTACT INFO & UNDERWRITING GENERATION TRIGGER                    */}
              {/* ========================================================================= */}
              {step === 4 && (
                <form onSubmit={handleFinalSubmit} className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      <span>Step 04 · Contact & Authorization</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Where should we deliver your preliminary property review?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Our system will instantly synthesize Sedgwick County public comps and display your preliminary offer range.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Full Name *
                      </label>
                      <input 
                        type="text"
                        placeholder="First and Last Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Phone Number *
                      </label>
                      <input 
                        type="tel"
                        placeholder="(316) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input 
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-3.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.fullName || !formData.phone || !formData.email}
                      className="flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all shadow-xl shadow-amber-950 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Generating Preliminary Underwriting...</span>
                        </>
                      ) : (
                        <>
                          <span>Generate Preliminary Review & Offer</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================================= */}
              {/* STEP 5: PRELIMINARY OFFER RESULTS EXPERIENCE                              */}
              {/* ========================================================================= */}
              {step === 5 && offerResult && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  
                  {/* Results Header */}
                  <div className="border-b border-slate-800 pb-6">
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
                        Your Preliminary Property Review
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        RECORD ID: {offerResult.id}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {offerResult.property.address}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {offerResult.property.city}, {offerResult.property.state} {offerResult.property.zip} · {offerResult.property.livingAreaSqft} sq ft · Built {offerResult.property.yearBuilt}
                    </p>
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* CASE 1: HIGH CONFIDENCE PRELIMINARY OFFER RANGE               */}
                  {/* ------------------------------------------------------------- */}
                  {offerResult.sellerOfferPresentation.status === 'PRELIMINARY_OFFER_AVAILABLE' && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 border border-amber-500/40 shadow-2xl text-center space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                        <CheckCircle2 size={13} />
                        <span>Preliminary OCG Offer Range Available</span>
                      </div>

                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Estimated Preliminary As-Is Offer Range
                      </div>

                      <div className="text-3xl sm:text-5xl lg:text-6xl font-black text-amber-400 font-mono tracking-tight">
                        ${offerResult.sellerOfferPresentation.offerRangeMin?.toLocaleString()} – ${offerResult.sellerOfferPresentation.offerRangeMax?.toLocaleString()}
                      </div>

                      <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                        Based on Sedgwick County appraisal rolls, verified neighborhood comps, and our deterministic 70% acquisition framework. Includes zero seller repairs, zero commissions, and all closing fees covered.
                      </p>

                      <div className="pt-2 flex flex-wrap justify-center gap-3">
                        <a
                          href="/contact"
                          className="px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg shadow-amber-950 cursor-pointer"
                        >
                          Lock In Written Cash Purchase Agreement
                        </a>
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* CASE 2: MEDIUM CONFIDENCE PRELIMINARY ESTIMATE                */}
                  {/* ------------------------------------------------------------- */}
                  {offerResult.sellerOfferPresentation.status === 'PRELIMINARY_ESTIMATE' && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-blue-500/30 shadow-2xl text-center space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                        <Clock size={13} />
                        <span>Preliminary Acquisition Estimate</span>
                      </div>

                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Estimated Baseline Value (Subject to Verification)
                      </div>

                      <div className="text-3xl sm:text-5xl font-black text-blue-300 font-mono tracking-tight">
                        ${offerResult.sellerOfferPresentation.offerRangeMin?.toLocaleString()} – ${offerResult.sellerOfferPresentation.offerRangeMax?.toLocaleString()}
                      </div>

                      <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                        This preliminary estimate is supported by submarket pricing benchmarks. A brief physical walkthrough is required to confirm interior condition before a formal binding offer is approved.
                      </p>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* CASE 3: LOW CONFIDENCE / ADDITIONAL REVIEW REQUIRED           */}
                  {/* ------------------------------------------------------------- */}
                  {offerResult.sellerOfferPresentation.status === 'ADDITIONAL_REVIEW_REQUIRED' && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-amber-500/30 shadow-2xl text-center space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                        <AlertCircle size={13} />
                        <span>Additional Property Review Required</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        Specialized Acquisition Review Assigned
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                        Because of structural scope, title/probate specifics, or unique parcel characteristics, our underwriting rules do not permit an automated number. Genaro Ocasio will review your property records personally.
                      </p>
                    </div>
                  )}

                  {/* What OCG Reviewed & What Remains To Be Verified */}
                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                    <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle2 size={15} />
                        <span>What OCG Evaluated</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {offerResult.sellerOfferPresentation.explanation.whatOcgReviewed.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock size={15} />
                        <span>Verification & Next Steps</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {offerResult.sellerOfferPresentation.explanation.nextSteps.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400">→</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Legal Disclaimer */}
                  <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-500 leading-relaxed text-center">
                    <ShieldCheck size={14} className="inline text-amber-400 mr-1" />
                    {offerResult.sellerOfferPresentation.legalDisclaimer}
                  </div>

                  {/* Handoff Status Notice */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setStep(1);
                        setOfferResult(null);
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ← Review Another Property
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
