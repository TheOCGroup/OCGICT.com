/*
  Design: Dark Luxury — "Investment Grade"
  Page: Seller / Property Preliminary Review
  Palette: #0d0d0d bg, #F5F0E8 text, #3B3BFF accent
  Typography: Cormorant Garamond (headings) + Inter (body)
*/

import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Home, DollarSign, User, Phone, Mail, MapPin,
  FileText, ChevronRight, CheckCircle2, Building2,
  Wrench, Bed, Bath, Ruler, Calendar
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

const inputCls = "w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#3B3BFF]/60 transition-colors";
const labelCls = "block text-white/50 text-xs font-semibold tracking-widest uppercase mb-2";

export default function SubmitDeal() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    // Step 1 — About you
    submitter_name: "",
    submitter_phone: "",
    submitter_email: "",
    submitter_type: "Wholesaler",
    // Step 2 — Property
    property_address: "",
    city: "Wichita",
    state: "KS",
    zip: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    year_built: "",
    property_condition: "Fair",
    // Step 3 — Numbers
    asking_price: "",
    arv: "",
    rehab_estimate: "",
    strategy: "Fix & Flip",
    description: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.property_address || !form.submitter_name) {
      toast.error("Please fill in your name and property address.");
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
        arv: form.arv ? parseFloat(form.arv.replace(/[$,]/g, "")) : null,
        rehab_estimate: form.rehab_estimate ? parseFloat(form.rehab_estimate.replace(/[$,]/g, "")) : null,
        strategy: form.strategy,
        description: form.description || null,
        status: "Pending Review",
      });
      setSubmitted(true);
    } catch (e) {
      toast.error("Submission failed. Please try again or call 720.620.9929.");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 border-b border-white/5">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-2 text-[#3B3BFF] text-xs font-semibold tracking-widest uppercase mb-5">
            <div className="w-8 h-px bg-[#3B3BFF]" />
            SELLERS · PROPERTY OWNERS · DEAL SOURCES
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-none mb-5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Tell Us About the Property
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-xl">
            Start with what you know. This preliminary review helps OCG understand the property, the situation, and what information we may need next. G will eventually make this flow conversational so sellers can explain the situation naturally before completing structured details.
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              "Plain-language preliminary review",
              "Wichita-focused acquisition process",
              "All condition properties considered",
            ].map(t => (
              <div key={t} className="flex items-center gap-2 text-white/40 text-sm">
                <CheckCircle2 size={14} className="text-[#3B3BFF]" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="container max-w-3xl">

          {submitted ? (
            /* Success state */
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-[#3B3BFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-[#3B3BFF]" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Property Submitted
              </h2>
              <p className="text-white/50 text-lg mb-3">
                OCG has received the property information for preliminary review. We will follow up about the appropriate next step.
              </p>
              <p className="text-white/30 text-sm mb-10">
                Questions? Call or text <a href="tel:7206209929" className="text-[#3B3BFF] hover:underline">720.620.9929</a>
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => { setSubmitted(false); setStep(1); setForm(f => ({ ...f, property_address: "", asking_price: "", arv: "", description: "" })); }}
                  className="border border-white/15 text-white/60 hover:text-white text-sm px-6 py-3 rounded-sm transition-colors"
                >
                  Submit Another Property
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="bg-[#3B3BFF] hover:bg-[#2a2aee] text-white text-sm font-semibold px-6 py-3 rounded-sm transition-colors"
                >
                  Explore OCG →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step indicators */}
              <div className="flex items-center gap-0 mb-12">
                {[
                  { n: 1, label: "About You" },
                  { n: 2, label: "Property" },
                  { n: 3, label: "Numbers" },
                ].map(({ n, label }, i) => (
                  <div key={n} className="flex items-center">
                    <button
                      onClick={() => n < step && setStep(n)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-sm text-sm transition-colors ${
                        step === n
                          ? "bg-[#3B3BFF]/15 text-[#3B3BFF] border border-[#3B3BFF]/30"
                          : n < step
                          ? "text-white/40 hover:text-white/60 cursor-pointer"
                          : "text-white/20 cursor-default"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        step === n ? "bg-[#3B3BFF] text-white" : n < step ? "bg-white/20 text-white/60" : "bg-white/5 text-white/20"
                      }`}>{n < step ? "✓" : n}</div>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                    {i < 2 && <ChevronRight size={14} className="text-white/15 mx-1" />}
                  </div>
                ))}
              </div>

              {/* Step 1 — About You */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-[#111] border border-white/8 rounded-sm p-6">
                    <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      <User size={18} className="text-[#3B3BFF]" /> Your Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Full Name *</label>
                        <input className={inputCls} placeholder="John Smith" value={form.submitter_name}
                          onChange={e => set("submitter_name", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>Phone</label>
                        <div className="relative">
                          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                          <input className={inputCls + " pl-9"} placeholder="(316) 555-0100" value={form.submitter_phone}
                            onChange={e => set("submitter_phone", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <div className="relative">
                          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                          <input className={inputCls + " pl-9"} placeholder="you@example.com" value={form.submitter_email}
                            onChange={e => set("submitter_email", e.target.value)} />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>I am a...</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["Wholesaler", "Seller", "Agent/Realtor", "Investor"].map(t => (
                            <button key={t} onClick={() => set("submitter_type", t)}
                              className={`py-2.5 px-3 text-xs rounded-sm border transition-colors ${
                                form.submitter_type === t
                                  ? "bg-[#3B3BFF]/15 border-[#3B3BFF]/40 text-[#3B3BFF]"
                                  : "border-white/10 text-white/40 hover:text-white/60"
                              }`}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (!form.submitter_name) { toast.error("Please enter your name."); return; }
                        setStep(2);
                      }}
                      className="bg-[#3B3BFF] hover:bg-[#2a2aee] text-white text-sm font-semibold tracking-widest uppercase px-8 py-3 rounded-sm transition-colors flex items-center gap-2"
                    >
                      Next: Property Details <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 — Property */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-[#111] border border-white/8 rounded-sm p-6">
                    <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      <Home size={18} className="text-[#3B3BFF]" /> Property Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Property Address *</label>
                        <div className="relative">
                          <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                          <input className={inputCls + " pl-9"} placeholder="1234 N Main St" value={form.property_address}
                            onChange={e => set("property_address", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>City</label>
                        <input className={inputCls} placeholder="Wichita" value={form.city}
                          onChange={e => set("city", e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>State</label>
                          <input className={inputCls} placeholder="KS" value={form.state}
                            onChange={e => set("state", e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>ZIP</label>
                          <input className={inputCls} placeholder="67202" value={form.zip}
                            onChange={e => set("zip", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}><Bed size={11} className="inline mr-1" />Bedrooms</label>
                        <select className={inputCls} value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)}>
                          <option value="">Select</option>
                          {["1","2","3","4","5","6+"].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}><Bath size={11} className="inline mr-1" />Bathrooms</label>
                        <select className={inputCls} value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)}>
                          <option value="">Select</option>
                          {["1","1.5","2","2.5","3","3.5","4+"].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}><Ruler size={11} className="inline mr-1" />Sq Ft</label>
                        <input className={inputCls} placeholder="1,200" value={form.sqft}
                          onChange={e => set("sqft", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}><Calendar size={11} className="inline mr-1" />Year Built</label>
                        <input className={inputCls} placeholder="1965" value={form.year_built}
                          onChange={e => set("year_built", e.target.value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}><Wrench size={11} className="inline mr-1" />Property Condition</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {["Excellent","Good","Fair","Poor"].map(c => (
                            <button key={c} onClick={() => set("property_condition", c)}
                              className={`py-2.5 px-3 text-xs rounded-sm border transition-colors ${
                                form.property_condition === c
                                  ? "bg-[#3B3BFF]/15 border-[#3B3BFF]/40 text-[#3B3BFF]"
                                  : "border-white/10 text-white/40 hover:text-white/60"
                              }`}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button onClick={() => setStep(1)}
                      className="border border-white/10 text-white/40 hover:text-white/70 text-sm px-6 py-3 rounded-sm transition-colors">
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        if (!form.property_address) { toast.error("Please enter the property address."); return; }
                        setStep(3);
                      }}
                      className="bg-[#3B3BFF] hover:bg-[#2a2aee] text-white text-sm font-semibold tracking-widest uppercase px-8 py-3 rounded-sm transition-colors flex items-center gap-2"
                    >
                      Next: Deal Numbers <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Numbers */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-[#111] border border-white/8 rounded-sm p-6">
                    <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      <DollarSign size={18} className="text-[#3B3BFF]" /> Deal Numbers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}>Asking Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                          <input className={inputCls + " pl-7"} placeholder="75,000" value={form.asking_price}
                            onChange={e => set("asking_price", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Estimated ARV</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                          <input className={inputCls + " pl-7"} placeholder="150,000" value={form.arv}
                            onChange={e => set("arv", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Est. Rehab Cost</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                          <input className={inputCls + " pl-7"} placeholder="30,000" value={form.rehab_estimate}
                            onChange={e => set("rehab_estimate", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Best Exit Strategy</label>
                        <select className={inputCls} value={form.strategy} onChange={e => set("strategy", e.target.value)}>
                          {["Fix & Flip","BRRRR","Buy & Hold","Wholesale","Creative Finance","Not Sure"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Spread preview */}
                      {form.asking_price && form.arv && (
                        <div className="sm:col-span-2 bg-[#0d0d0d] border border-[#3B3BFF]/20 rounded-sm p-4">
                          <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Estimated Spread</div>
                          <div className={`text-2xl font-bold ${
                            (parseFloat(form.arv.replace(/[$,]/g,"")) - parseFloat(form.asking_price.replace(/[$,]/g,"")) - (parseFloat(form.rehab_estimate.replace(/[$,]/g,"")) || 0)) > 30000
                              ? "text-emerald-400" : "text-yellow-400"
                          }`}>
                            ${Math.max(0, parseFloat(form.arv.replace(/[$,]/g,"")) - parseFloat(form.asking_price.replace(/[$,]/g,"")) - (parseFloat(form.rehab_estimate.replace(/[$,]/g,"")) || 0)).toLocaleString()}
                          </div>
                          <div className="text-white/25 text-xs mt-1">ARV − Ask − Rehab</div>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className={labelCls}><FileText size={11} className="inline mr-1" />Additional Notes</label>
                        <textarea
                          className={inputCls + " resize-none"}
                          rows={4}
                          placeholder="Seller motivation, timeline, occupancy status, any liens or title issues, JV terms you're looking for..."
                          value={form.description}
                          onChange={e => set("description", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="bg-[#111] border border-white/8 rounded-sm p-5">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-3">Submission Summary</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-white/40">Submitted by</div>
                      <div className="text-white">{form.submitter_name} ({form.submitter_type})</div>
                      <div className="text-white/40">Property</div>
                      <div className="text-white">{form.property_address}, {form.city} {form.state}</div>
                      {form.asking_price && <><div className="text-white/40">Asking</div><div className="text-white">${parseFloat(form.asking_price.replace(/[$,]/g,"")).toLocaleString()}</div></>}
                      {form.arv && <><div className="text-white/40">ARV</div><div className="text-white">${parseFloat(form.arv.replace(/[$,]/g,"")).toLocaleString()}</div></>}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(2)}
                      className="border border-white/10 text-white/40 hover:text-white/70 text-sm px-6 py-3 rounded-sm transition-colors">
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-[#3B3BFF] hover:bg-[#2a2aee] disabled:opacity-50 text-white text-sm font-semibold tracking-widest uppercase px-10 py-3 rounded-sm transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                      ) : (
                        <><CheckCircle2 size={14} /> Submit Deal</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      {!submitted && (
        <section className="py-12 border-t border-white/5">
          <div className="container max-w-3xl text-center">
            <p className="text-white/30 text-sm">
              Prefer to talk directly?{" "}
              <a href="tel:7206209929" className="text-[#3B3BFF] hover:underline">Call or text 720.620.9929</a>
              {" "}· {" "}
              <a href="mailto:Contact@ocasiocollective.com" className="text-[#3B3BFF] hover:underline">Contact@ocasiocollective.com</a>
            </p>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
