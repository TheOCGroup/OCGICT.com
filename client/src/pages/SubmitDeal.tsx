import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Home, DollarSign, User, Phone, Mail, MapPin,
  FileText, ChevronRight, CheckCircle2, Building2,
  Wrench, Bed, Bath, Ruler, Calendar, ArrowRight, ShieldCheck, HeartHandshake, AlertCircle, Bot
} from "lucide-react";

const SUPABASE_URL = "https://lsaerludzkxjewqgbvkg.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWVybHVkemt4amV3cWdidmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTMwNzEsImV4cCI6MjA5MTc2OTA3MX0.k0PmsyeAQ-hq8aTn_AVoyzsx-cbYdmfQzHKhIMp_s1U";

async function submitDeal(data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_submissions`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

const inputCls = "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors";
const labelCls = "block text-slate-400 text-xs font-bold tracking-wider uppercase mb-2";

export default function SubmitDeal() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Step 1 — Situation & Intent
    submitter_type: "Property Owner",
    situation: "Estate / Inherited Property",
    timeline_preference: "Flexible / Exploring Options",
    // Step 2 — Property Address & Basics
    property_address: "",
    city: "Wichita",
    state: "KS",
    zip: "",
    neighborhood: "East Wichita / Crown Heights",
    bedrooms: "3",
    bathrooms: "2",
    sqft: "",
    year_built: "",
    occupancy_status: "Vacant",
    // Step 3 — Condition & Priority
    property_condition: "Fair — Needs Updating",
    known_repairs: "",
    seller_priority: "Speed & As-Is Simplicity",
    asking_price: "",
    // Step 4 — Contact Info
    submitter_name: "",
    submitter_phone: "",
    submitter_email: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.property_address || !form.submitter_name || !form.submitter_phone) {
      toast.error("Please fill in your name, contact phone, and property address.");
      return;
    }
    setSubmitting(true);
    try {
      await submitDeal({
        submitter_name: form.submitter_name,
        submitter_phone: form.submitter_phone || null,
        submitter_email: form.submitter_email || null,
        submitter_type: form.submitter_type,
        property_address: form.property_address,
        city: form.city || "Wichita",
        state: form.state || "KS",
        zip: form.zip || null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        sqft: form.sqft ? parseInt(form.sqft) : null,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        property_condition: form.property_condition,
        asking_price: form.asking_price ? parseFloat(form.asking_price.replace(/[$,]/g, "")) : null,
        strategy: form.situation,
        description: `Situation: ${form.situation} | Priority: ${form.seller_priority} | Timeline: ${form.timeline_preference} | Repairs: ${form.known_repairs} | Notes: ${form.notes}`,
      });
      setSubmitted(true);
      toast.success("Preliminary property review submitted successfully.");
    } catch (err: any) {
      toast.error("Submission failed: " + (err.message || "Network error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-24 space-y-16">
        {/* Header */}
        <section className="container max-w-4xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              <HeartHandshake size={14} /> Respectful Seller Advisory & Preliminary Review
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[0.98] text-white">
              Sell a property with clarity.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
                No high-pressure wholesaler games.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Whether you are managing an inherited estate, handling deferred repairs, or transitioning an asset in Wichita, OCG provides an objective preliminary review and transparent acquisition options.
            </p>
          </div>
        </section>

        {/* Multi-Step Form */}
        <section className="container max-w-4xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-12 shadow-2xl space-y-8">
            {/* Progress Stepper */}
            {!submitted && (
              <div className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-6">
                {[
                  { n: 1, label: "Situation" },
                  { n: 2, label: "Property" },
                  { n: 3, label: "Condition" },
                  { n: 4, label: "Contact" },
                ].map((s) => (
                  <div
                    key={s.n}
                    className={`text-center pb-2 border-b-2 transition-all ${
                      step >= s.n
                        ? "border-blue-500 text-blue-400 font-bold"
                        : "border-slate-800 text-slate-500"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-mono">Step 0{s.n}</span>
                    <div className="text-xs hidden sm:block">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Submitted View */}
            {submitted ? (
              <div className="py-12 text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-3xl font-bold text-white">Review Request Received</h2>
                <p className="text-slate-300 max-w-lg mx-auto text-sm leading-relaxed">
                  Thank you, {form.submitter_name}. OCG acquisition operations (PIPER & VICTOR) are retrieving public record filings for <strong>{form.property_address}</strong>. Genaro and our acquisitions team will review the details and reach out to discuss your options.
                </p>
                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setStep(1);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                  >
                    Submit Another Property
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* STEP 1: Situation */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Tell us about your situation</h3>
                      <p className="text-xs text-slate-400 mt-1">Understanding your situation helps us give you the right kind of advice.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Your Relationship to the Property</label>
                        <select
                          value={form.submitter_type}
                          onChange={(e) => set("submitter_type", e.target.value)}
                          className={inputCls}
                        >
                          <option value="Property Owner">Owner / Title Holder</option>
                          <option value="Heir / Estate Executor">Heir / Estate Representative</option>
                          <option value="Tired Landlord">Landlord Disposing Portfolio</option>
                          <option value="Real Estate Agent">Real Estate Agent / Broker</option>
                          <option value="Wholesaler">Wholesaler / Acquisition Partner</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Circumstance / Motivation</label>
                        <select
                          value={form.situation}
                          onChange={(e) => set("situation", e.target.value)}
                          className={inputCls}
                        >
                          <option value="Estate / Inherited Property">Inherited Property / Probate</option>
                          <option value="Downsizing / Senior Transition">Downsizing / Family Transition</option>
                          <option value="Deferred Maintenance / Major Repairs">Deferred Maintenance / Major Repairs Needed</option>
                          <option value="Relocating / Need Fast Closing">Relocating / Need Flexible Closing</option>
                          <option value="Liquidating Rental Asset">Liquidating Rental Asset</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Desired Timeline</label>
                        <select
                          value={form.timeline_preference}
                          onChange={(e) => set("timeline_preference", e.target.value)}
                          className={inputCls}
                        >
                          <option value="ASAP (Under 14 Days)">As fast as possible (Under 14 Days)</option>
                          <option value="30 Days">30 Days</option>
                          <option value="60 - 90 Days">60 – 90 Days</option>
                          <option value="Flexible / Exploring Options">Flexible / Just Exploring Options</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
                      >
                        Continue to Property Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Property Address & Specs */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Property Details</h3>
                      <p className="text-xs text-slate-400 mt-1">We pull public records for Sedgwick County to prepare your review.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Street Address *</label>
                        <input
                          type="text"
                          value={form.property_address}
                          onChange={(e) => set("property_address", e.target.value)}
                          placeholder="e.g. 1420 N Roosevelt St"
                          className={inputCls}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>City</label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>State</label>
                          <input
                            type="text"
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>ZIP</label>
                          <input
                            type="text"
                            value={form.zip}
                            onChange={(e) => set("zip", e.target.value)}
                            placeholder="67208"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className={labelCls}>Beds</label>
                          <input
                            type="number"
                            value={form.bedrooms}
                            onChange={(e) => set("bedrooms", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Baths</label>
                          <input
                            type="number"
                            step="0.5"
                            value={form.bathrooms}
                            onChange={(e) => set("bathrooms", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Sq Ft</label>
                          <input
                            type="text"
                            value={form.sqft}
                            onChange={(e) => set("sqft", e.target.value)}
                            placeholder="1,650"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Year Built</label>
                          <input
                            type="text"
                            value={form.year_built}
                            onChange={(e) => set("year_built", e.target.value)}
                            placeholder="1955"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!form.property_address) {
                            toast.error("Please provide the property address.");
                            return;
                          }
                          setStep(3);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
                      >
                        Continue to Condition <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Condition & Priorities */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Condition & Pricing Expectations</h3>
                      <p className="text-xs text-slate-400 mt-1">We purchase properties 100% as-is. Be completely candid about repairs.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Overall Property Condition</label>
                        <select
                          value={form.property_condition}
                          onChange={(e) => set("property_condition", e.target.value)}
                          className={inputCls}
                        >
                          <option value="Move-In Ready / Updated">Move-In Ready / Updated</option>
                          <option value="Fair — Needs Updating">Fair — Needs Cosmetic Updating</option>
                          <option value="Needs Significant Renovation">Needs Significant Renovation</option>
                          <option value="Distressed / Major Structural or Roof Work">Distressed / Heavy Rehab / Fire / Water</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Known Major Repairs (Roof, HVAC, Plumbing, Foundation)</label>
                        <textarea
                          rows={2}
                          value={form.known_repairs}
                          onChange={(e) => set("known_repairs", e.target.value)}
                          placeholder="e.g. 15-year-old roof, needs new kitchen/bath, dated electrical panel"
                          className={inputCls}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Target Price (Optional)</label>
                          <input
                            type="text"
                            value={form.asking_price}
                            onChange={(e) => set("asking_price", e.target.value)}
                            placeholder="e.g. $125,000"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Primary Seller Priority</label>
                          <select
                            value={form.seller_priority}
                            onChange={(e) => set("seller_priority", e.target.value)}
                            className={inputCls}
                          >
                            <option value="Speed & As-Is Simplicity">Speed & 100% As-Is Simplicity</option>
                            <option value="Maximizing Net Proceeds">Maximizing Net Proceeds</option>
                            <option value="Flexible Closing Date">Flexible Closing Date</option>
                            <option value="Discreet & Private Transaction">Discreet & Private Transaction</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-950"
                      >
                        Continue to Contact Info <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Contact Info & Submission */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Where should we send the review?</h3>
                      <p className="text-xs text-slate-400 mt-1">We respect your privacy and will never spam or sell your information.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Your Full Name *</label>
                        <input
                          type="text"
                          value={form.submitter_name}
                          onChange={(e) => set("submitter_name", e.target.value)}
                          placeholder="e.g. John Smith"
                          className={inputCls}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Phone Number *</label>
                          <input
                            type="tel"
                            value={form.submitter_phone}
                            onChange={(e) => set("submitter_phone", e.target.value)}
                            placeholder="(316) 555-0123"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Email Address</label>
                          <input
                            type="email"
                            value={form.submitter_email}
                            onChange={(e) => set("submitter_email", e.target.value)}
                            placeholder="john@example.com"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>Additional Notes or Instructions</label>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={(e) => set("notes", e.target.value)}
                          placeholder="Any details on access, probate status, or questions for Genaro and the team..."
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-[11px] text-slate-400 space-y-1">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-400" /> Preliminary Review Process
                      </div>
                      <p>
                        Submission initiates preliminary property intelligence retrieval. OCG does not make automated or algorithmic binding offers. A team member will follow up after reviewing public records and comp data.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-950"
                      >
                        {submitting ? "Processing..." : "Submit Property for Review"} <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
