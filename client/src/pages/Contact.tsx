/* ============================================================
   CONTACT / BOOK CALL PAGE — Dark Luxury "Investment Grade" Design
   4 lead forms: Investor, Seller, Wholesaler, Lender Partner
   All forms POST to Supabase leads table → CRM at theocgroupcrm.netlify.app
   Contact: Genaro Ocasio | 720.620.9929 | Contact@ocasiocollective.com
   ============================================================ */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, TrendingUp, HomeIcon, Users, Shield, Phone, Mail, MapPin, Clock, CheckCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://lsaerludzkxjewqgbvkg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWVybHVkemt4amV3cWdidmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTMwNzEsImV4cCI6MjA5MTc2OTA3MX0.k0PmsyeAQ-hq8aTn_AVoyzsx-cbYdmfQzHKhIMp_s1U";

async function submitLeadToCRM(lead: Record<string, string | number | null>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      ...lead,
      id: crypto.randomUUID(),
      stage: "New Lead",
      priority: "Medium",
      state: "KS",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

type FormType = "investor" | "seller" | "wholesaler" | "lender";

const formTabs: { id: FormType; label: string; icon: typeof TrendingUp; desc: string }[] = [
  { id: "investor", label: "Investor", icon: TrendingUp, desc: "I'm looking for deals, strategy support, or JV opportunities." },
  { id: "seller", label: "Seller", icon: HomeIcon, desc: "I own a property and need a flexible, creative solution." },
  { id: "wholesaler", label: "Wholesaler", icon: Users, desc: "I have deals and need a reliable, fast-moving buyer." },
  { id: "lender", label: "Lender Partner", icon: Shield, desc: "I'm a lender interested in deal flow from The OC Group." },
];

const inputCls = "w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/50 transition-colors";
const selectCls = "w-full bg-[#1a1a1a] border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B3BFF]/50 transition-colors";
const labelCls = "text-white/50 text-xs mb-1.5 block";

function InvestorForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", experience: "new", interest: "flip", budget: "under50", notes: "", buyerList: false });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitLeadToCRM({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        type: "Investor",
        investment_strategy: form.interest,
        source: "Website — Investor Form",
        notes: `Experience: ${form.experience} | Budget: ${form.budget} | Buyer List: ${form.buyerList ? "Yes" : "No"}\n\n${form.notes}`,
      });
      toast.success("Thank you! Genaro will reach out within 24 hours to schedule your strategy call.");
      setForm({ firstName: "", lastName: "", email: "", phone: "", experience: "new", interest: "flip", budget: "under50", notes: "", buyerList: false });
    } catch {
      toast.error("Submission failed. Please call us directly at 720.620.9929.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name *</label>
          <input required className={inputCls} placeholder="First name" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Last Name *</label>
          <input required className={inputCls} placeholder="Last name" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Email *</label>
        <input required type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Phone *</label>
        <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Investment Experience</label>
        <select className={selectCls} value={form.experience} onChange={e => set("experience", e.target.value)}>
          <option value="new">New Investor (0–1 deals)</option>
          <option value="some">Some Experience (2–5 deals)</option>
          <option value="active">Active Investor (6+ deals)</option>
          <option value="portfolio">Portfolio Investor (10+ properties)</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Primary Interest</label>
        <select className={selectCls} value={form.interest} onChange={e => set("interest", e.target.value)}>
          <option value="Fix and Flip">Fix &amp; Flip Strategy</option>
          <option value="BRRRR">BRRRR Strategy</option>
          <option value="Buy and Hold">Buy &amp; Hold</option>
          <option value="Deal Sourcing">Deal Sourcing / Marketplace</option>
          <option value="Deal Analysis">Deal Analysis</option>
          <option value="Joint Venture">Joint Venture</option>
          <option value="General Consultation">General Consultation</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Investment Budget Range</label>
        <select className={selectCls} value={form.budget} onChange={e => set("budget", e.target.value)}>
          <option value="under50">Under $50,000</option>
          <option value="50-100">$50,000 – $100,000</option>
          <option value="100-250">$100,000 – $250,000</option>
          <option value="250-500">$250,000 – $500,000</option>
          <option value="over500">$500,000+</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Tell Us About Your Goals</label>
        <textarea rows={4} className={`${inputCls} resize-none`} placeholder="What are you trying to accomplish? What's your timeline? Any specific deals or strategies you're interested in?" value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <div className="flex items-start gap-2 mt-1">
        <input type="checkbox" id="investor-list" className="mt-0.5 accent-[#3B3BFF]" checked={form.buyerList} onChange={e => set("buyerList", e.target.checked)} />
        <label htmlFor="investor-list" className="text-white/40 text-xs leading-relaxed cursor-pointer">
          Add me to the buyer list for first access to new deals and investment opportunities.
        </label>
      </div>
      <button type="submit" disabled={loading} className="btn-gold justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Book Strategy Call <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}

function SellerForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", address: "", condition: "fair", situation: "fast-close", askingPrice: "", notes: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitLeadToCRM({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email || null,
        phone: form.phone,
        type: "Seller",
        address: form.address,
        source: "Website — Seller Form",
        seller_motivation: form.situation,
        asking_terms: form.askingPrice || null,
        notes: `Condition: ${form.condition} | Situation: ${form.situation} | Asking: ${form.askingPrice || "Not specified"}\n\n${form.notes}`,
      });
      toast.success("Thank you! Genaro will reach out within 24 hours to discuss your options.");
      setForm({ firstName: "", lastName: "", phone: "", email: "", address: "", condition: "fair", situation: "fast-close", askingPrice: "", notes: "" });
    } catch {
      toast.error("Submission failed. Please call us directly at 720.620.9929.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>First Name *</label>
          <input required className={inputCls} placeholder="First name" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Last Name *</label>
          <input required className={inputCls} placeholder="Last name" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Phone *</label>
        <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Property Address *</label>
        <input required className={inputCls} placeholder="123 Main St, Wichita, KS" value={form.address} onChange={e => set("address", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Property Condition</label>
        <select className={selectCls} value={form.condition} onChange={e => set("condition", e.target.value)}>
          <option value="good">Good — Minor updates needed</option>
          <option value="fair">Fair — Moderate renovation needed</option>
          <option value="poor">Poor — Significant renovation needed</option>
          <option value="distressed">Distressed — Major work required</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>What's Your Situation?</label>
        <select className={selectCls} value={form.situation} onChange={e => set("situation", e.target.value)}>
          <option value="fast-close">Need to sell quickly</option>
          <option value="flexible">Open to flexible terms</option>
          <option value="behind">Behind on payments</option>
          <option value="inherited">Inherited property</option>
          <option value="relocation">Relocating</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Asking Price (if you have one)</label>
        <input type="text" className={inputCls} placeholder="$0 — we'll evaluate fairly" value={form.askingPrice} onChange={e => set("askingPrice", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Additional Details</label>
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Tell us anything else that would help us understand your situation..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn-gold justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Get a Seller Consultation <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}

function WholesalerForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", askingPrice: "", arv: "", rehab: "", beds: "", baths: "", sqft: "", closeDate: "", notes: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitLeadToCRM({
        name: form.name,
        email: form.email,
        phone: form.phone,
        type: "Wholesaler",
        address: form.address,
        target_price: form.askingPrice ? parseFloat(form.askingPrice.replace(/[^0-9.]/g, "")) : null,
        arv: form.arv ? parseFloat(form.arv.replace(/[^0-9.]/g, "")) : null,
        rehab_budget: form.rehab ? parseFloat(form.rehab.replace(/[^0-9.]/g, "")) : null,
        bedrooms: form.beds || null,
        bathrooms: form.baths || null,
        sqft: form.sqft || null,
        next_action_date: form.closeDate || null,
        source: "Website — Wholesaler Deal Submission",
        notes: `Close Deadline: ${form.closeDate || "Not specified"}\n\n${form.notes}`,
      });
      toast.success("Deal submitted! Genaro will evaluate and respond within 48 hours.");
      setForm({ name: "", phone: "", email: "", address: "", askingPrice: "", arv: "", rehab: "", beds: "", baths: "", sqft: "", closeDate: "", notes: "" });
    } catch {
      toast.error("Submission failed. Please call us directly at 720.620.9929.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Your Name *</label>
          <input required className={inputCls} placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Email *</label>
        <input required type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Property Address *</label>
        <input required className={inputCls} placeholder="123 Main St, Wichita, KS" value={form.address} onChange={e => set("address", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Asking Price *</label>
          <input required type="text" className={inputCls} placeholder="$85,000" value={form.askingPrice} onChange={e => set("askingPrice", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Your Est. ARV</label>
          <input type="text" className={inputCls} placeholder="$150,000" value={form.arv} onChange={e => set("arv", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Est. Rehab</label>
          <input type="text" className={inputCls} placeholder="$40,000" value={form.rehab} onChange={e => set("rehab", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Beds</label>
          <input type="number" className={inputCls} placeholder="3" value={form.beds} onChange={e => set("beds", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Baths</label>
          <input type="number" className={inputCls} placeholder="2" value={form.baths} onChange={e => set("baths", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Sq Ft</label>
          <input type="number" className={inputCls} placeholder="1,400" value={form.sqft} onChange={e => set("sqft", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Close Deadline</label>
        <input type="date" className={inputCls} value={form.closeDate} onChange={e => set("closeDate", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Property Description / Notes</label>
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Condition, seller motivation, any unique factors, comparable sales you're aware of..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn-gold justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit Deal for Review <Send size={16} /></>}
      </button>
    </form>
  );
}

function LenderForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", lenderType: "", minLoan: "", maxLoan: "", geoFocus: "", notes: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitLeadToCRM({
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        type: "Private Lender",
        source: "Website — Lender Partner Application",
        lender_status: form.lenderType,
        notes: `Lender Type: ${form.lenderType} | Min: ${form.minLoan} | Max: ${form.maxLoan} | Geography: ${form.geoFocus}\n\n${form.notes}`,
      });
      toast.success("Application submitted! Genaro will review and reach out within 48 hours.");
      setForm({ name: "", company: "", email: "", phone: "", lenderType: "", minLoan: "", maxLoan: "", geoFocus: "", notes: "" });
    } catch {
      toast.error("Submission failed. Please call us directly at 720.620.9929.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Name *</label>
          <input required className={inputCls} placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Company *</label>
          <input required className={inputCls} placeholder="Lending Co." value={form.company} onChange={e => set("company", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Email *</label>
        <input required type="email" className={inputCls} placeholder="lender@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Phone *</label>
        <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Lender Type *</label>
        <select required className={selectCls} value={form.lenderType} onChange={e => set("lenderType", e.target.value)}>
          <option value="">Select type</option>
          <option value="Private Lender">Private Lender</option>
          <option value="Hard Money">Hard Money Lender</option>
          <option value="DSCR">DSCR Lender</option>
          <option value="Bridge">Bridge Lender</option>
          <option value="Portfolio">Portfolio Lender</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Min Loan</label>
          <input type="text" className={inputCls} placeholder="$50,000" value={form.minLoan} onChange={e => set("minLoan", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Max Loan</label>
          <input type="text" className={inputCls} placeholder="$1,000,000" value={form.maxLoan} onChange={e => set("maxLoan", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Geographic Focus</label>
        <input type="text" className={inputCls} placeholder="Kansas, Midwest, National..." value={form.geoFocus} onChange={e => set("geoFocus", e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Lending Programs / Notes</label>
        <textarea rows={4} className={`${inputCls} resize-none`} placeholder="Describe your lending programs, typical rates, LTV, and any other relevant details..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn-gold justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit Application <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}

export default function Contact() {
  const [activeForm, setActiveForm] = useState<FormType>("investor");

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />

      {/* ── PAGE HERO ── */}
      <section className="pt-32 pb-16 bg-[#111111]">
        <div className="container">
          <div className="max-w-2xl">
            <span className="section-eyebrow">Get in Touch</span>
            <h1
              className="text-4xl md:text-5xl font-bold text-white leading-tight mt-3 mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Let's Start a Conversation
            </h1>
            <p className="text-white/55 text-base leading-relaxed">
              Whether you're an investor, a seller, a wholesaler, or a capital partner — the first step is a conversation. No pressure, no hype. Just strategy.
            </p>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="py-16 bg-[#0d0d0d]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left: Contact Info + Book Call */}
            <div className="lg:col-span-1">
              {/* Book a Call CTA — Calendly Embed */}
              <div className="bg-[#111111] border border-white/10 rounded-sm mb-6 overflow-hidden">
                <div className="bg-[#3B3BFF] px-6 pt-6 pb-4">
                  <h3
                    className="text-white font-bold text-2xl mb-1"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Book a Strategy Call
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Pick a time that works for you — 30 minutes with Genaro, no pressure.
                  </p>
                </div>
                {/* Calendly inline embed */}
                <div className="w-full" style={{ minHeight: 520 }}>
                  <iframe
                    src="https://calendly.com/theocgroup?embed_domain=theocgroup.com&embed_type=Inline&hide_landing_page_details=1&hide_gdpr_banner=1&background_color=111111&text_color=ffffff&primary_color=3B3BFF"
                    width="100%"
                    height="520"
                    frameBorder="0"
                    title="Book a Strategy Call with Genaro Ocasio"
                    className="block"
                    style={{ minHeight: 520 }}
                  />
                </div>
                <div className="px-6 py-4 border-t border-white/8">
                  <p className="text-white/40 text-xs text-center mb-3">Prefer to call directly?</p>
                  <a
                    href="tel:+17206209929"
                    className="bg-[#3B3BFF] text-white font-semibold text-xs tracking-widest uppercase px-6 py-3 rounded-sm hover:bg-[#2a2aee] transition-colors inline-flex items-center gap-2 w-full justify-center"
                  >
                    <Phone size={14} /> Call 720.620.9929
                  </a>
                </div>
              </div>

              {/* Contact Details */}
              <div className="card-luxury p-6 mb-6">
                <h4 className="text-white font-semibold text-lg mb-5" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Genaro Ocasio
                </h4>
                <div className="flex flex-col gap-4">
                  <a href="tel:+17206209929" className="flex items-center gap-3 text-white/60 hover:text-[#3B3BFF] transition-colors">
                    <div className="w-8 h-8 rounded-sm bg-[#3B3BFF]/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={14} className="text-[#3B3BFF]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 tracking-widest uppercase">Phone</div>
                      <div className="text-sm">720.620.9929</div>
                    </div>
                  </a>
                  <a href="mailto:Contact@ocasiocollective.com" className="flex items-center gap-3 text-white/60 hover:text-[#3B3BFF] transition-colors">
                    <div className="w-8 h-8 rounded-sm bg-[#3B3BFF]/10 flex items-center justify-center flex-shrink-0">
                      <Mail size={14} className="text-[#3B3BFF]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 tracking-widest uppercase">Email</div>
                      <div className="text-sm">Contact@ocasiocollective.com</div>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="w-8 h-8 rounded-sm bg-[#3B3BFF]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-[#3B3BFF]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 tracking-widest uppercase">Location</div>
                      <div className="text-sm">Wichita, Kansas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="w-8 h-8 rounded-sm bg-[#3B3BFF]/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-[#3B3BFF]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 tracking-widest uppercase">Response Time</div>
                      <div className="text-sm">Within 24 hours</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Expect */}
              <div className="card-luxury p-6">
                <h4 className="text-white font-semibold text-base mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  What to Expect
                </h4>
                <div className="flex flex-col gap-3">
                  {[
                    { step: "01", text: "Submit your form or call directly" },
                    { step: "02", text: "Genaro responds within 24 hours" },
                    { step: "03", text: "30-min strategy call scheduled" },
                    { step: "04", text: "Clear next steps delivered" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <span className="text-[#3B3BFF] font-bold text-sm w-6 flex-shrink-0" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {item.step}
                      </span>
                      <span className="text-white/50 text-xs">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Forms */}
            <div className="lg:col-span-2">
              {/* Form Type Selector */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                {formTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveForm(tab.id)}
                    className={`p-4 rounded-sm border text-left transition-all ${
                      activeForm === tab.id
                        ? "bg-[#3B3BFF]/15 border-[#3B3BFF]/40 text-white"
                        : "bg-white/3 border-white/8 text-white/50 hover:bg-white/5 hover:text-white/70"
                    }`}
                  >
                    <tab.icon size={16} className={`mb-2 ${activeForm === tab.id ? "text-[#3B3BFF]" : "text-white/30"}`} />
                    <div className="font-semibold text-sm mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {tab.label}
                    </div>
                    <div className="text-[10px] leading-tight opacity-70 hidden md:block">{tab.desc}</div>
                  </button>
                ))}
              </div>

              {/* Active Form */}
              <div className="card-luxury p-8">
                <div className="mb-6">
                  <div className="text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-1">
                    {formTabs.find(t => t.id === activeForm)?.label} Form
                  </div>
                  <h3 className="text-white font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {activeForm === "investor" && "Investor Inquiry"}
                    {activeForm === "seller" && "Seller Consultation Request"}
                    {activeForm === "wholesaler" && "Submit a Deal"}
                    {activeForm === "lender" && "Lender Partner Application"}
                  </h3>
                  <p className="text-white/40 text-sm mt-1">
                    {activeForm === "investor" && "Tell us about your investment goals and we'll schedule a strategy call."}
                    {activeForm === "seller" && "Tell us about your property and situation — no pressure, just options."}
                    {activeForm === "wholesaler" && "Submit your deal for review. We evaluate and respond within 48 hours."}
                    {activeForm === "lender" && "Tell us about your lending program and we'll evaluate the partnership fit."}
                  </p>
                </div>
                {activeForm === "investor" && <InvestorForm />}
                {activeForm === "seller" && <SellerForm />}
                {activeForm === "wholesaler" && <WholesalerForm />}
                {activeForm === "lender" && <LenderForm />}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
