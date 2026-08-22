import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Home as HomeIcon,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Handshake,
  MessageSquareText,
  CalendarDays,
  Phone,
} from 'lucide-react';
import { ISellerIntakePayload, ISellerOfferResult } from '../../../shared/contracts';

type SellerAction = 'ACCEPT_PRELIMINARY_OFFER' | 'COUNTEROFFER' | 'REQUEST_CALL' | 'REQUEST_WALKTHROUGH';

const conditions: ISellerIntakePayload['propertyCondition'][] = [
  'Move-In Ready',
  'Dated / Needs Updates',
  'Needs Major Cosmetic & Mechanical Rehab',
  'Full Gut / Major Deferred Maintenance',
  'Severe Structural / Fire Damage',
];

const occupancies: ISellerIntakePayload['occupancyStatus'][] = ['Owner Occupied', 'Tenant Occupied', 'Vacant', 'Estate / Unoccupied'];
const situations: ISellerIntakePayload['sellerSituation'][] = ['Inherited Property / Probate', 'Downsizing / Estate Liquidation', 'Deferred Maintenance', 'Relocation / Quick Transition', 'Tired Landlord', 'Exploring Options'];
const timelines: ISellerIntakePayload['desiredTimeline'][] = ['Immediate (14-21 Days)', 'Within 30-45 Days', '60-90 Days', 'Flexible'];
const priorities: ISellerIntakePayload['primaryPriority'][] = ['Maximum Net Cash', 'Speed & Convenience', 'No Repairs / As-Is', 'Flexible Closing Date'];

export function Sell() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [publicMatch, setPublicMatch] = useState<any | null>(null);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [condition, setCondition] = useState<ISellerIntakePayload['propertyCondition'] | ''>('');
  const [occupancy, setOccupancy] = useState<ISellerIntakePayload['occupancyStatus'] | ''>('');
  const [situation, setSituation] = useState<ISellerIntakePayload['sellerSituation'] | ''>('');
  const [timeline, setTimeline] = useState<ISellerIntakePayload['desiredTimeline'] | ''>('');
  const [priority, setPriority] = useState<ISellerIntakePayload['primaryPriority'] | ''>('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offerResult, setOfferResult] = useState<ISellerOfferResult | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [preferredWindow, setPreferredWindow] = useState('');
  const [actionPending, setActionPending] = useState<SellerAction | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setIsSearchingAddress(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/seller/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      setPublicMatch(data.found ? data.publicRecord : null);
      setStep(2);
    } catch {
      // A provider failure should not destroy the seller's progress. The final
      // underwriting endpoint will route the submission to manual review.
      setPublicMatch(null);
      setStep(2);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condition || !occupancy || !situation || !timeline || !priority || !consent) return;
    setIsSubmitting(true);
    setErrorMessage('');

    const payload: ISellerIntakePayload = {
      address: address.trim(),
      city: 'Wichita',
      state: 'KS',
      propertyCondition: condition,
      occupancyStatus: occupancy,
      sellerSituation: situation,
      desiredTimeline: timeline,
      primaryPriority: priority,
      knownRepairs: [],
      sellerNotes,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      preferredContact: 'Phone',
    };

    try {
      const res = await fetch('/api/seller/preliminary-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Unable to complete property review');
      setOfferResult(await res.json());
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setErrorMessage(error?.message || 'We could not complete the review. Your information has not been lost; please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSellerAction = async (action: SellerAction) => {
    if (!offerResult) return;
    setActionPending(action);
    setActionMessage('');
    try {
      const res = await fetch('/api/seller/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offerResult.id,
          action,
          counterAmount: action === 'COUNTEROFFER' ? Number(counterAmount) : undefined,
          preferredWindow: preferredWindow || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unable to record your request');
      setActionMessage(data.message || 'Your request was recorded for OCG review.');
    } catch (error: any) {
      setActionMessage(error?.message || 'We could not record that request. Please try again.');
    } finally {
      setActionPending(null);
    }
  };

  const reset = () => {
    setStep(1);
    setAddress('');
    setPublicMatch(null);
    setCondition('');
    setOccupancy('');
    setSituation('');
    setTimeline('');
    setPriority('');
    setSellerNotes('');
    setFullName('');
    setEmail('');
    setPhone('');
    setConsent(false);
    setOfferResult(null);
    setCounterAmount('');
    setPreferredWindow('');
    setActionMessage('');
  };

  const fieldClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white outline-none transition focus:border-amber-400';

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-800 bg-[#09111d] py-16 sm:py-20 lg:py-24">
        <motion.div animate={{ x: ['-10%', '12%', '-10%'] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-amber-500/8 blur-3xl" />
        <motion.div animate={{ x: ['10%', '-12%', '10%'] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-amber-400">
              <Sparkles size={13} /> Wichita Property Acquisition
            </div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl">
              ENTER YOUR ADDRESS.<br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-white bg-clip-text text-transparent">GET YOUR PRELIMINARY OFFER.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Tell us a little about the property. OCG handles the research and underwriting behind the scenes, then gives you a preliminary as-is offer when the evidence supports one.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mx-auto mt-9 grid max-w-3xl grid-cols-3 gap-2 text-left sm:gap-4">
            {[
              ['01', 'Address', 'Start the research'],
              ['02', 'A few questions', 'Condition & timing'],
              ['03', 'Your result', 'Offer or human review'],
            ].map(([n, title, copy]) => (
              <div key={n} className="rounded-2xl border border-slate-800 bg-slate-950/55 p-3 sm:p-4">
                <div className="text-[10px] font-black text-amber-400">{n}</div>
                <div className="mt-1 text-xs font-bold text-white sm:text-sm">{title}</div>
                <div className="mt-1 hidden text-[11px] text-slate-500 sm:block">{copy}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-12 sm:py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {step < 4 && (
            <div className="mb-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              <span>Property review</span>
              <span>Step {step} of 3</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl sm:p-10">
                <form onSubmit={handleAddressSubmit} className="space-y-7">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400"><MapPin size={14} /> Property address</div>
                    <h2 className="text-2xl font-extrabold text-white sm:text-3xl">What property are you considering selling?</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">This starts the private property-research process. We only use reliable data for an automated offer; missing data is sent to a human reviewer.</p>
                  </div>
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input autoFocus required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter the full Wichita property address" className={`${fieldClass} py-4 pl-12 text-base`} />
                  </div>
                  <button disabled={!address.trim() || isSearchingAddress} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-amber-400 disabled:opacity-40 sm:w-auto sm:min-w-64">
                    {isSearchingAddress ? <><RefreshCw size={15} className="animate-spin" /> Starting property research…</> : <>Continue <ArrowRight size={15} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="property" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl sm:p-10">
                {publicMatch ? (
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                    <div><div className="text-sm font-bold text-white">Property record found</div><div className="mt-1 text-xs text-slate-400">We matched available property information and will use it only as permitted by the active data mode.</div></div>
                  </div>
                ) : (
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <Clock size={18} className="mt-0.5 shrink-0 text-blue-400" />
                    <div><div className="text-sm font-bold text-white">Research is continuing</div><div className="mt-1 text-xs text-slate-400">You can keep going. If we cannot verify enough reliable information automatically, OCG will review the property manually rather than guess.</div></div>
                  </div>
                )}

                <div className="mb-7">
                  <div className="mb-2 text-xs font-black uppercase tracking-wider text-amber-400">A few property questions</div>
                  <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Give us the facts only you know.</h2>
                  <p className="mt-2 text-sm text-slate-400">The system should research everything else itself.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-300">Current condition<select required value={condition} onChange={(e) => setCondition(e.target.value as any)} className={`${fieldClass} mt-2`}><option value="">Choose condition</option>{conditions.map((x) => <option key={x}>{x}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-300">Occupancy<select required value={occupancy} onChange={(e) => setOccupancy(e.target.value as any)} className={`${fieldClass} mt-2`}><option value="">Choose occupancy</option>{occupancies.map((x) => <option key={x}>{x}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-300">What best describes the situation?<select required value={situation} onChange={(e) => setSituation(e.target.value as any)} className={`${fieldClass} mt-2`}><option value="">Choose one</option>{situations.map((x) => <option key={x}>{x}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-300">Ideal timing<select required value={timeline} onChange={(e) => setTimeline(e.target.value as any)} className={`${fieldClass} mt-2`}><option value="">Choose timing</option>{timelines.map((x) => <option key={x}>{x}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-300 sm:col-span-2">What matters most?<select required value={priority} onChange={(e) => setPriority(e.target.value as any)} className={`${fieldClass} mt-2`}><option value="">Choose priority</option>{priorities.map((x) => <option key={x}>{x}</option>)}</select></label>
                </div>

                <label className="mt-4 block text-xs font-bold text-slate-300">Anything important we should know? <span className="font-normal text-slate-500">Optional</span><textarea value={sellerNotes} onChange={(e) => setSellerNotes(e.target.value)} rows={3} maxLength={1000} placeholder="Major repairs, access, title situation, or anything else that could matter…" className={`${fieldClass} mt-2 resize-none`} /></label>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-slate-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800">Back</button>
                  <button type="button" disabled={!condition || !occupancy || !situation || !timeline || !priority} onClick={() => setStep(3)} className="rounded-xl bg-amber-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-400 disabled:opacity-40">Last step <ArrowRight size={14} className="ml-1 inline" /></button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl sm:p-10">
                <form onSubmit={handleFinalSubmit}>
                  <div className="mb-7">
                    <div className="mb-2 text-xs font-black uppercase tracking-wider text-amber-400">Where should we send the result?</div>
                    <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Your property review is almost ready.</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">If the evidence meets OCG's underwriting gates, you will see a preliminary offer. If it does not, your submission goes directly into human review—without fabricated numbers.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-300">Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${fieldClass} mt-2`} /></label>
                    <label className="text-xs font-bold text-slate-300">Phone<input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(316) 000-0000" className={`${fieldClass} mt-2`} /></label>
                    <label className="text-xs font-bold text-slate-300 sm:col-span-2">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={`${fieldClass} mt-2`} /></label>
                  </div>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs leading-relaxed text-slate-400">
                    <input required type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-500" />
                    <span>I authorize The OC Group to use the information I provide to evaluate this property and contact me about this submission. I understand any displayed offer is preliminary, non-binding, and subject to property verification, walkthrough, title review, and a separate written purchase agreement.</span>
                  </label>

                  {errorMessage && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">{errorMessage}</div>}

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-slate-700 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800">Back</button>
                    <button disabled={isSubmitting || !fullName.trim() || !phone.trim() || !email.trim() || !consent} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-4 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-400 disabled:opacity-40">
                      {isSubmitting ? <><RefreshCw size={14} className="animate-spin" /> Running property review…</> : <>Show My Result <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 4 && offerResult && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
                    <div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">OCG Property Review</div><h2 className="mt-1 text-2xl font-extrabold text-white">{offerResult.property.address}</h2></div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-[10px] font-mono text-slate-500">{offerResult.id}</div>
                  </div>

                  {offerResult.sellerOfferPresentation.status === 'PRELIMINARY_OFFER_AVAILABLE' ? (
                    <div className="py-8 text-center">
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }} className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-300"><CheckCircle2 size={14} /> Preliminary offer available</motion.div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Preliminary as-is acquisition range</div>
                      <div className="mt-3 bg-gradient-to-r from-amber-300 via-amber-100 to-white bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl">${offerResult.sellerOfferPresentation.offerRangeMin?.toLocaleString()} – ${offerResult.sellerOfferPresentation.offerRangeMax?.toLocaleString()}</div>
                      <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400">This is a preliminary, non-binding offer. It is subject to a walkthrough, verification of property condition and data, title review, and a separate written purchase agreement.</p>

                      <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
                        <button disabled={!!actionPending} onClick={() => submitSellerAction('ACCEPT_PRELIMINARY_OFFER')} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-400 disabled:opacity-50"><Handshake size={16} /> Accept Preliminary Offer</button>
                        <button disabled={!!actionPending} onClick={() => submitSellerAction('REQUEST_WALKTHROUGH')} className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-5 py-4 text-xs font-black uppercase tracking-wider text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"><CalendarDays size={16} /> Request Walkthrough</button>
                      </div>

                      <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/55 p-4 text-left">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white"><MessageSquareText size={15} className="text-amber-400" /> Want to counter?</div>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input type="number" min="1" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} placeholder="Your preferred price" className={`${fieldClass} flex-1`} /><button type="button" disabled={!!actionPending || !counterAmount} onClick={() => submitSellerAction('COUNTEROFFER')} className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-40">Submit Counter</button></div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-9 text-center">
                      <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-blue-300"><Clock size={14} /> Human review in progress</div>
                      <h3 className="text-3xl font-black text-white">We have your property.</h3>
                      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">The automated engine does not have enough verified evidence to responsibly display a dollar offer yet. OCG will complete the missing review instead of guessing.</p>
                      <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-2"><button disabled={!!actionPending} onClick={() => submitSellerAction('REQUEST_CALL')} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-500"><Phone size={15} /> Request a Call</button><button disabled={!!actionPending} onClick={() => submitSellerAction('REQUEST_WALKTHROUGH')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-200 hover:bg-slate-800"><CalendarDays size={15} /> Request Walkthrough</button></div>
                    </div>
                  )}

                  {actionMessage && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-center text-sm text-emerald-200">{actionMessage}</div>}

                  <div className="mt-5 grid gap-4 border-t border-slate-800 pt-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"><div className="mb-3 text-xs font-black uppercase tracking-wider text-blue-400">What OCG reviewed</div><ul className="space-y-2 text-xs leading-relaxed text-slate-400">{offerResult.sellerOfferPresentation.explanation.whatOcgReviewed.map((x) => <li key={x} className="flex gap-2"><span className="text-blue-400">•</span>{x}</li>)}</ul></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"><div className="mb-3 text-xs font-black uppercase tracking-wider text-amber-400">What happens next</div><ul className="space-y-2 text-xs leading-relaxed text-slate-400">{offerResult.sellerOfferPresentation.explanation.nextSteps.map((x) => <li key={x} className="flex gap-2"><span className="text-amber-400">→</span>{x}</li>)}</ul></div>
                  </div>

                  <div className="mt-5 flex gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-[11px] leading-relaxed text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-amber-400" /><span>{offerResult.sellerOfferPresentation.legalDisclaimer}</span></div>
                </div>

                <div className="text-center"><button onClick={reset} className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white">Review another property</button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-[#09111d] py-12">
        <div className="container mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            [HomeIcon, 'Sell as-is', 'No need to renovate the property before asking OCG to review it.'],
            [ShieldCheck, 'Your underwriting stays private', 'Internal comps, ARV, repair assumptions, and acquisition math are not published.'],
            [Handshake, 'You stay in control', 'A preliminary acceptance is not a binding purchase contract; walkthrough and verification come first.'],
          ].map(([Icon, title, copy]: any) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"><Icon size={19} className="text-amber-400" /><div className="mt-3 text-sm font-bold text-white">{title}</div><p className="mt-1 text-xs leading-relaxed text-slate-500">{copy}</p></div>)}
        </div>
      </section>
    </div>
  );
}

export default Sell;
