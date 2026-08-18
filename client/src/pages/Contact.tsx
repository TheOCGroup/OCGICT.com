import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle2, 
  Bot, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { loadStrategyBrief } from '@/lib/persistence';

export function Contact() {
  const [role, setRole] = useState<'investor' | 'seller' | 'capital'>('investor');
  const [briefAttached, setBriefAttached] = useState<boolean>(false);
  const [briefId, setBriefId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // Investor Fields
    capitalAmount: '$50,000 – $100,000',
    strategyInterest: 'Fix & Flip Renovation',
    investorExperience: 'First-Time Investor',
    // Seller Fields
    propertyAddress: '',
    propertyCondition: 'Needs Cosmetic Updates',
    sellerTimeline: 'Within 30 Days',
    // Capital Partner Fields
    lendingFacility: 'Private Debt / Bridge Financing',
    // Common Message
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  // Load existing Strategy Brief context if created with G
  useEffect(() => {
    const brief = loadStrategyBrief();
    if (brief) {
      setBriefAttached(true);
      setBriefId(brief.id);
      if (brief.clientContext.investorStage.value.includes('Seller')) {
        setRole('seller');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* 1. CONTACT HERO */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 mb-6 shadow-lg">
            <Sparkles size={14} />
            <span>Direct Principal Communication</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Let's start a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-slate-300">
              high-conviction conversation.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            Whether you are an investor deploying capital, a seller seeking an objective preliminary property review, or a capital partner—our team is ready to evaluate the numbers with you.
          </p>

        </div>
      </section>

      {/* 2. PROGRESSIVE INTAKE FORM */}
      <section className="py-24 bg-[#070A0F] border-b border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
            
            {/* Left Box: The Progressive Form */}
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
              
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Strategy Session Request Received</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-white">{formData.name}</strong>. Genaro Ocasio and the OCG acquisition team will review your inquiry and contact you within 24 hours.
                  </p>
                  {briefAttached && (
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-300 inline-block font-mono">
                      ✓ Attached Strategy Brief Dossier ({briefId})
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Step 1: Who Are You? (Role Switcher) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 font-mono">
                      Step 01 · Who Are You?
                    </label>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('investor')}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          role === 'investor'
                            ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-lg shadow-blue-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <DollarSign size={18} className="mx-auto mb-1" />
                        <span className="text-xs">Investor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('seller')}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          role === 'seller'
                            ? 'bg-amber-600 border-amber-400 text-white font-bold shadow-lg shadow-amber-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 size={18} className="mx-auto mb-1" />
                        <span className="text-xs">Seller</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('capital')}
                        className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          role === 'capital'
                            ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-lg shadow-purple-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <ShieldCheck size={18} className="mx-auto mb-1" />
                        <span className="text-xs">Capital / Lender</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Context-Aware Relevant Fields */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                      Step 02 · Inquiry Details
                    </div>

                    {/* Investor-Only Fields */}
                    {role === 'investor' && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Available Liquid Capital
                          </label>
                          <select
                            value={formData.capitalAmount}
                            onChange={(e) => setFormData({ ...formData, capitalAmount: e.target.value })}
                            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-400 focus:outline-none"
                          >
                            <option>$25,000 – $50,000 (Exploring)</option>
                            <option>$50,000 – $100,000 (Active Deployment)</option>
                            <option>$100,000 – $250,000+ (Portfolio Growth)</option>
                            <option>$250,000+ (Private Lending / Equity Partner)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Primary Strategy Focus
                          </label>
                          <select
                            value={formData.strategyInterest}
                            onChange={(e) => setFormData({ ...formData, strategyInterest: e.target.value })}
                            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-400 focus:outline-none"
                          >
                            <option>Fix & Flip Renovation</option>
                            <option>BRRRR Strategy</option>
                            <option>Turnkey Buy & Hold</option>
                            <option>Undecided / Open to Guidance</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Seller-Only Fields */}
                    {role === 'seller' && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Wichita Property Address *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 248 S Rutan Ave, Wichita, KS"
                            value={formData.propertyAddress}
                            onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                            required
                            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Estimated Condition
                          </label>
                          <select
                            value={formData.propertyCondition}
                            onChange={(e) => setFormData({ ...formData, propertyCondition: e.target.value })}
                            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
                          >
                            <option>Needs Cosmetic Updates</option>
                            <option>Needs Major Mechanical / Roof Repairs</option>
                            <option>Full Gut / Deferred Maintenance</option>
                            <option>Move-In Ready</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1.5">
                            Desired Closing Timeline
                          </label>
                          <select
                            value={formData.sellerTimeline}
                            onChange={(e) => setFormData({ ...formData, sellerTimeline: e.target.value })}
                            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-amber-400 focus:outline-none"
                          >
                            <option>As soon as possible (14–21 days)</option>
                            <option>Within 30–60 days</option>
                            <option>Flexible / Exploring Options</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Capital Partner Fields */}
                    {role === 'capital' && (
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">
                          Capital Structure Focus
                        </label>
                        <select
                          value={formData.lendingFacility}
                          onChange={(e) => setFormData({ ...formData, lendingFacility: e.target.value })}
                          className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-400 focus:outline-none"
                        >
                          <option>Private Debt / 1st Lien Senior Bridge Loan</option>
                          <option>DSCR Rental Mortgage Facility</option>
                          <option>Equity Joint Venture</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Contact Info */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                      Step 03 · Your Contact Info
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          placeholder="First and Last Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="(316) 000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 font-medium mb-1.5">Additional Notes (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Any specific questions, timelines, or context..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Attached Strategy Brief indicator */}
                  {briefAttached && (
                    <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-300">
                      <div className="flex items-center gap-2">
                        <Bot size={14} className="text-blue-400" />
                        <span>Active Strategy Brief attached automatically</span>
                      </div>
                      <span className="font-mono text-[10px] text-blue-400/80">{briefId}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-500 transition-all shadow-xl shadow-blue-950 cursor-pointer"
                  >
                    Submit Strategy Request
                  </button>

                </form>
              )}

            </div>

            {/* Right Box: Direct Office & Response Commitment */}
            <div className="space-y-6">
              
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Direct Contact</div>
                  <h3 className="text-xl font-bold text-white">The OC Group / OCG</h3>
                  <p className="text-xs text-slate-400 mt-1">Wichita & South-Central Kansas</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Phone size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Direct Phone</div>
                      <div className="text-slate-200 font-semibold">(720) 620-9929</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Mail size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Official Email</div>
                      <div className="text-slate-200 font-semibold">Contact@ocasiocollective.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <MapPin size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Headquarters</div>
                      <div className="text-slate-200 font-semibold">Wichita, Kansas</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-300 mb-1">
                    <Clock size={14} className="text-blue-400" />
                    <span>Response Commitment</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All strategy inquiries and property submissions are reviewed by Genaro Ocasio and the acquisition team within 24 hours.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

export default Contact;

