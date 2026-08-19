import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Home, MapPin, Search, ShieldCheck } from "lucide-react";
import { ISellerIntakePayload, ISellerOfferResult } from "../../../shared/contracts";

type PublicRecord = {
  parcelId: string;
  situsAddress: string;
  taxDistrict: string;
  yearBuilt: number;
  livingAreaSqft: number;
  provenance?: {
    source?: string;
    certainty?: string;
    mode?: "STAGING_FIXTURE" | "LIVE_PUBLIC_RECORD";
  };
};

const CONDITION_OPTIONS: ISellerIntakePayload["propertyCondition"][] = [
  "Move-In Ready",
  "Dated / Needs Updates",
  "Needs Major Cosmetic & Mechanical Rehab",
  "Full Gut / Major Deferred Maintenance",
  "Severe Structural / Fire Damage",
];

const SITUATION_OPTIONS: ISellerIntakePayload["sellerSituation"][] = [
  "Inherited Property / Probate",
  "Downsizing / Estate Liquidation",
  "Deferred Maintenance",
  "Relocation / Quick Transition",
  "Tired Landlord",
  "Exploring Options",
];

const TIMELINE_OPTIONS: ISellerIntakePayload["desiredTimeline"][] = [
  "Immediate (14-21 Days)",
  "Within 30-45 Days",
  "60-90 Days",
  "Flexible",
];

export default function SellExperience() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publicRecord, setPublicRecord] = useState<PublicRecord | null>(null);
  const [lookupStatus, setLookupStatus] = useState<"idle" | "matched" | "unmatched" | "error">("idle");
  const [result, setResult] = useState<ISellerOfferResult | null>(null);
  const [form, setForm] = useState<ISellerIntakePayload>({
    address: "",
    city: "Wichita",
    state: "KS",
    zip: "",
    propertyCondition: "Dated / Needs Updates",
    occupancyStatus: "Vacant",
    sellerSituation: "Exploring Options",
    desiredTimeline: "Flexible",
    primaryPriority: "No Repairs / As-Is",
    knownRepairs: [],
    sellerNotes: "",
    fullName: "",
    email: "",
    phone: "",
    preferredContact: "Phone",
  });

  const isLiveEvidence = publicRecord?.provenance?.mode === "LIVE_PUBLIC_RECORD";
  const progress = useMemo(() => Math.min(step, 4), [step]);

  async function lookupAddress(event: FormEvent) {
    event.preventDefault();
    if (!form.address.trim()) return;
    setLoading(true);
    setLookupStatus("idle");
    try {
      const response = await fetch("/api/seller/property-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: form.address }),
      });
      const data = await response.json();
      if (response.ok && data.found && data.publicRecord) {
        setPublicRecord(data.publicRecord);
        setLookupStatus("matched");
      } else {
        setPublicRecord(null);
        setLookupStatus("unmatched");
      }
      setStep(2);
    } catch {
      setPublicRecord(null);
      setLookupStatus("error");
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function submitSeller(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/seller/preliminary-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Seller review failed");
      setResult(await response.json());
      setStep(5);
    } catch {
      setResult(null);
      setStep(5);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F4] text-[#0B0F17]">
      <section className="border-b border-slate-200 bg-white px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Sell a property to OCG</div>
            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.055em] sm:text-6xl lg:text-7xl">SELL YOUR PROPERTY WITH CLARITY.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">A straightforward property review. Clear options. No pressure. Start with the address and OCG will determine what can be verified now and what still needs human review.</p>
          </div>
          <div className="rounded-[30px] border border-slate-200 bg-[#F7F7F4] p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-blue-700" size={20} />
              <div>
                <div className="text-sm font-black">Evidence before numbers.</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">OCG will not manufacture a preliminary range when current property or market evidence is incomplete. In that case, your property is routed for additional review instead.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl">
          {step < 5 && (
            <div className="mb-8 grid grid-cols-4 gap-2" aria-label="Seller review progress">
              {["Address", "Condition", "Situation", "Contact"].map((label, index) => {
                const number = index + 1;
                return (
                  <div key={label} className={`border-b-2 pb-2 text-center text-[10px] font-black uppercase tracking-[0.14em] ${progress >= number ? "border-blue-600 text-blue-700" : "border-slate-200 text-slate-400"}`}>
                    {number}. {label}
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            {step === 1 && (
              <form onSubmit={lookupAddress} className="p-7 sm:p-10">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700"><MapPin size={14} /> Property address</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Where is the property?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">We’ll check the evidence currently available to this staging build. Live county and closed-sale integrations are treated separately and are never implied when they are not connected.</p>
                <label className="mt-7 block text-xs font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="seller-address">Wichita property address</label>
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input id="seller-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Enter the property address" className="w-full rounded-2xl border border-slate-200 bg-[#F7F7F4] py-4 pl-11 pr-4 text-base outline-none transition focus:border-blue-500" required />
                </div>
                <button disabled={loading || !form.address.trim()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B0F17] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 disabled:opacity-40">
                  {loading ? "Checking available evidence…" : "Continue"} <ArrowRight size={14} />
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="p-7 sm:p-10">
                {lookupStatus === "matched" && publicRecord && (
                  <div className={`mb-7 rounded-2xl border p-4 ${isLiveEvidence ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex gap-3">
                      {isLiveEvidence ? <CheckCircle2 className="text-emerald-700" size={18} /> : <AlertTriangle className="text-amber-700" size={18} />}
                      <div>
                        <div className="text-sm font-black">{isLiveEvidence ? "Live public record matched" : "Representative staging record matched"}</div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{publicRecord.situsAddress} · {publicRecord.livingAreaSqft} sq ft · Built {publicRecord.yearBuilt}</p>
                        {!isLiveEvidence && <p className="mt-2 text-xs font-semibold text-amber-800">This is staging evidence for workflow testing, not a fresh county retrieval. It cannot unlock a seller-facing dollar range.</p>}
                      </div>
                    </div>
                  </div>
                )}
                {(lookupStatus === "unmatched" || lookupStatus === "error") && (
                  <div className="mb-7 rounded-2xl border border-slate-200 bg-[#F7F7F4] p-4 text-sm text-slate-600">We could not verify a current property record automatically. You can still continue; OCG will route the property for additional review rather than inventing missing facts.</div>
                )}
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Property condition</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">What best describes the house today?</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {CONDITION_OPTIONS.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, propertyCondition: option })} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${form.propertyCondition === option ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:border-slate-300"}`}>{option}</button>)}
                </div>
                <button onClick={() => setStep(3)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0B0F17] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white">Continue <ArrowRight size={14} /></button>
              </div>
            )}

            {step === 3 && (
              <div className="p-7 sm:p-10">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Situation + timing</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">What’s going on with the property?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Choose the closest fit. G can help if your situation does not fit neatly into a category.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {SITUATION_OPTIONS.map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, sellerSituation: option })} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${form.sellerSituation === option ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200"}`}>{option}</button>)}
                </div>
                <label className="mt-7 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Preferred timing</label>
                <select value={form.desiredTimeline} onChange={(e) => setForm({ ...form, desiredTimeline: e.target.value as ISellerIntakePayload["desiredTimeline"] })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-blue-500">{TIMELINE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>
                <button onClick={() => setStep(4)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0B0F17] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white">Continue <ArrowRight size={14} /></button>
              </div>
            )}

            {step === 4 && (
              <form onSubmit={submitSeller} className="p-7 sm:p-10">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Contact</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Where should OCG follow up?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">This creates the acquisition handoff only after you choose to submit the property for review.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500" required />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500" required />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500" required />
                  <textarea value={form.sellerNotes} onChange={(e) => setForm({ ...form, sellerNotes: e.target.value })} placeholder="Anything OCG should know?" className="min-h-28 rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500 sm:col-span-2" />
                </div>
                <button disabled={loading} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-blue-600 disabled:opacity-40">{loading ? "Submitting…" : "Submit for OCG review"} <ArrowRight size={14} /></button>
              </form>
            )}

            {step === 5 && (
              <div className="p-7 sm:p-10">
                {!result ? (
                  <div><AlertTriangle className="text-amber-600" size={24} /><h2 className="mt-4 text-3xl font-black tracking-tight">We could not complete the automated review.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Your property should be reviewed by the OCG team rather than receiving a manufactured automated result.</p></div>
                ) : result.sellerOfferPresentation.status === "PRELIMINARY_OFFER_AVAILABLE" && result.sellerOfferPresentation.offerRangeMin && result.sellerOfferPresentation.offerRangeMax ? (
                  <div><CheckCircle2 className="text-emerald-600" size={24} /><div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Preliminary, non-binding range</div><h2 className="mt-2 text-4xl font-black tracking-tight">${result.sellerOfferPresentation.offerRangeMin.toLocaleString()} – ${result.sellerOfferPresentation.offerRangeMax.toLocaleString()}</h2><p className="mt-4 text-sm leading-6 text-slate-600">{result.sellerOfferPresentation.legalDisclaimer}</p></div>
                ) : (
                  <div><Home className="text-blue-700" size={24} /><div className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-blue-700">Additional review required</div><h2 className="mt-2 text-3xl font-black tracking-tight">{result.sellerOfferPresentation.headline}</h2><p className="mt-4 text-sm leading-6 text-slate-600">OCG has your submission. The current evidence did not meet the automated confidence threshold for a seller-facing dollar range.</p><div className="mt-6 rounded-2xl border border-slate-200 bg-[#F7F7F4] p-4"><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">What still needs verification</div><ul className="mt-3 space-y-2 text-sm text-slate-700">{result.sellerOfferPresentation.explanation.whatRemainsToBeVerified.map((item) => <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>)}</ul></div></div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
