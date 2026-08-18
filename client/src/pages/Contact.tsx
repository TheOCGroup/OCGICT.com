import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, TrendingUp, Home as HomeIcon, Users, Shield, Phone, Mail, MapPin, Clock, CheckCircle2, Send, Loader2, Calendar } from "lucide-react";
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
  { id: "investor", label: "Investor", icon: TrendingUp, desc: "Explore Fix & Flip, BRRRR, or capital placement." },
  { id: "seller", label: "Seller Review", icon: HomeIcon, desc: "Preliminary review for off-market or estate property." },
  { id: "wholesaler", label: "Acquisitions Partner", icon: Users, desc: "Submit off-market property for quick underwriting." },
  { id: "lender", label: "Lending Partner", icon: Shield, desc: "Partner with OCG on debt or bridge financing." },
];

const inputCls = "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";
const selectCls = "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors";
const labelCls = "text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block";

function InvestorForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", experience: "new", interest: "Fix & Flip Strategy", budget: "50-100", notes: "", buyerList: false });

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
        source: "Website — Investor Strategy Form",
        notes: `Experience: ${form.experience} | Budget: ${form.budget} | Buyer List: ${form.buyerList ? "Yes" : "No"}\n\n${form.notes}`,
      });
      toast.success("Thank you! Genaro and the OCG team will reach out within 24 hours.");
      setForm({ firstName: "", lastName: "", email: "", phone: "", experience: "new", interest: "Fix & Flip Strategy", budget: "50-100", notes: "", buyerList: false });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Email *</label>
          <input required type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <option value="Fix &amp; Flip Strategy">Fix &amp; Flip Strategy</option>
            <option value="BRRRR Strategy">BRRRR Strategy</option>
            <option value="Buy &amp; Hold">Buy &amp; Hold</option>
            <option value="General Strategy Consultation">General Strategy Consultation</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Available Liquid Reserves</label>
        <select className={selectCls} value={form.budget} onChange={e => set("budget", e.target.value)}>
          <option value="under50">Under $50,000</option>
          <option value="50-100">$50,000 – $100,000</option>
          <option value="100-250">$100,000 – $250,000</option>
          <option value="over250">$250,000+</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>What are you trying to accomplish?</label>
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Share your timeline, goals, or specific Wichita neighborhoods of interest..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-950 mt-2">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <>Book Strategy Session <ArrowRight size={15} /></>}
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
      toast.success("Thank you! OCG acquisitions will review public records and connect within 24 hours.");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Phone *</label>
          <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Property Address *</label>
        <input required className={inputCls} placeholder="123 Main St, Wichita, KS" value={form.address} onChange={e => set("address", e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Property Condition</label>
          <select className={selectCls} value={form.condition} onChange={e => set("condition", e.target.value)}>
            <option value="fair">Fair — Needs Cosmetic Updates</option>
            <option value="poor">Significant Repairs Needed</option>
            <option value="distressed">Distressed / Heavy Rehab</option>
            <option value="good">Good / Move-In Ready</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Circumstance</label>
          <select className={selectCls} value={form.situation} onChange={e => set("situation", e.target.value)}>
            <option value="inherited">Inherited Property / Estate</option>
            <option value="fast-close">Looking for Fast, Clean Close</option>
            <option value="deferred">Tired Landlord / Deferred Maintenance</option>
            <option value="relocation">Downsizing or Relocating</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Additional Notes</label>
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Any details on repairs, occupancy, or questions..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-950 mt-2">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <>Request Seller Review <ArrowRight size={15} /></>}
      </button>
    </form>
  );
}

function WholesalerForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", askingPrice: "", arv: "", rehab: "", closeDate: "", notes: "" });

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
        source: "Website — Acquisition Deal Submission",
        notes: `Close Deadline: ${form.closeDate || "Not specified"}\n\n${form.notes}`,
      });
      toast.success("Deal submitted! VICTOR and the acquisition team will review.");
      setForm({ name: "", phone: "", email: "", address: "", askingPrice: "", arv: "", rehab: "", closeDate: "", notes: "" });
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
          <input type="text" className={inputCls} placeholder="$160,000" value={form.arv} onChange={e => set("arv", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Est. Rehab</label>
          <input type="text" className={inputCls} placeholder="$40,000" value={form.rehab} onChange={e => set("rehab", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Lockbox info, inspection window, title company..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-950 mt-2">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <>Submit Deal For Review <Send size={15} /></>}
      </button>
    </form>
  );
}

function LenderForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", lenderType: "Hard Money / Private Debt", minLoan: "$50,000", maxLoan: "$1,000,000", notes: "" });

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
        notes: `Lender Type: ${form.lenderType} | Min: ${form.minLoan} | Max: ${form.maxLoan}\n\n${form.notes}`,
      });
      toast.success("Application submitted! Genaro will review and connect.");
      setForm({ name: "", company: "", email: "", phone: "", lenderType: "Hard Money / Private Debt", minLoan: "$50,000", maxLoan: "$1,000,000", notes: "" });
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
          <label className={labelCls}>Lending Institution / Fund *</label>
          <input required className={inputCls} placeholder="Institution Name" value={form.company} onChange={e => set("company", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Email *</label>
          <input required type="email" className={inputCls} placeholder="lender@company.com" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <input required type="tel" className={inputCls} placeholder="(720) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Program Type</label>
        <select className={selectCls} value={form.lenderType} onChange={e => set("lenderType", e.target.value)}>
          <option value="Hard Money / Private Debt">Hard Money / Fix &amp; Flip Debt</option>
          <option value="DSCR Long-Term Loan">DSCR 30-Year Long-Term</option>
          <option value="Bridge / Mezzanine">Bridge / Transition Facility</option>
          <option value="Private Equity / JV">Private Equity / JV Capital</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Program Guidelines / Rate Sheets</label>
        <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Max LTC/LTV, minimum credit requirements, typical rates..." value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-950 mt-2">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <>Submit Lending Program <ArrowRight size={15} /></>}
      </button>
    </form>
  );
}

export default function Contact() {
  const [activeForm, setActiveForm] = useState<FormType>("investor");

  return (
    <div className="min-h-screen bg-[#070A0F] text-white selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 space-y-16">
        <section className="container max-w-5xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              <Calendar size={14} /> Direct OCG Strategy Session
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[0.98] text-white">
              Let's start a high-conviction conversation.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Whether you are an investor deploying capital, a seller seeking a preliminary property review, or a capital partner — our team is ready to evaluate the numbers with you.
            </p>
          </div>
        </section>

        <section className="container max-w-5xl">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10 items-start">
            {/* Left: Contact Info & Calendar Direct */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-xl">
                <div>
                  <h3 className="text-xl font-bold text-white">The OC Group / OCG</h3>
                  <div className="text-xs text-blue-400 font-mono mt-0.5">Wichita, Kansas</div>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <a href="tel:+17206209929" className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all">
                    <Phone size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Direct Phone</div>
                      <div className="font-semibold text-white">720.620.9929</div>
                    </div>
                  </a>

                  <a href="mailto:Contact@ocasiocollective.com" className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all">
                    <Mail size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Official Email</div>
                      <div className="font-semibold text-white">Contact@ocasiocollective.com</div>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <MapPin size={16} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Operating Headquarters</div>
                      <div className="font-semibold text-white">Wichita & South-Central Kansas</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-200">Response Commitment</div>
                  <p>All strategy inquiries and property submissions are reviewed by Genaro Ocasio and the acquisition team within 24 hours.</p>
                </div>
              </div>
            </div>

            {/* Right: Lead Forms */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl space-y-6">
              {/* Form Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-800 pb-5">
                {formTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveForm(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeForm === t.id
                        ? "bg-blue-600/15 border-blue-500 text-white shadow-md"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <t.icon size={15} className={`mb-1.5 ${activeForm === t.id ? "text-blue-400" : "text-slate-500"}`} />
                    <div className="text-xs font-bold">{t.label}</div>
                  </button>
                ))}
              </div>

              {activeForm === "investor" && <InvestorForm />}
              {activeForm === "seller" && <SellerForm />}
              {activeForm === "wholesaler" && <WholesalerForm />}
              {activeForm === "lender" && <LenderForm />}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
