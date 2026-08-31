import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { loadStrategyBrief } from '@/lib/persistence';

const OCG_EMAIL = 'Contact@ocasiocollective.com';
const OCG_PHONE = '(720) 620-9929';

export function Contact() {
  const [role, setRole] = useState<'investor' | 'seller' | 'capital'>('investor');
  const [briefAttached, setBriefAttached] = useState(false);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [handoffPrepared, setHandoffPrepared] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    capitalAmount: '$50,000 – $100,000',
    strategyInterest: 'Fix & Flip Renovation',
    propertyAddress: '',
    propertyCondition: 'Needs Cosmetic Updates',
    sellerTimeline: 'Within 30 Days',
    lendingFacility: 'Private Debt / Bridge Financing',
    message: '',
  });

  useEffect(() => {
    const brief = loadStrategyBrief();
    if (!brief) return;
    setBriefAttached(true);
    setBriefId(brief.id);
    if (brief.clientContext.investorStage.value.includes('Seller')) setRole('seller');
  }, []);

  const emailBody = useMemo(() => {
    const lines = [
      `OCG Strategy Request`,
      ``,
      `Role: ${role === 'capital' ? 'Capital / Lender' : role === 'seller' ? 'Seller' : 'Investor'}`,
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Phone: ${formData.phone}`,
    ];

    if (role === 'investor') {
      lines.push(`Available capital: ${formData.capitalAmount}`);
      lines.push(`Strategy interest: ${formData.strategyInterest}`);
    }

    if (role === 'seller') {
      lines.push(`Property address: ${formData.propertyAddress}`);
      lines.push(`Condition: ${formData.propertyCondition}`);
      lines.push(`Timeline: ${formData.sellerTimeline}`);
    }

    if (role === 'capital') lines.push(`Capital structure focus: ${formData.lendingFacility}`);
    if (briefAttached && briefId) lines.push(`G Strategy Brief reference: ${briefId}`);
    if (formData.message.trim()) lines.push(`Notes: ${formData.message.trim()}`);

    lines.push('', 'Please contact me to discuss next steps.');
    return lines.join('\n');
  }, [briefAttached, briefId, formData, role]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const subjectRole = role === 'capital' ? 'Capital Partner' : role === 'seller' ? 'Seller Property' : 'Investor Strategy';
    const subject = `OCG ${subjectRole} Request — ${formData.name}`;
    const mailto = `mailto:${OCG_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    setHandoffPrepared(true);
    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-[#0B1220] via-[#070A0F] to-[#070A0F] py-20 lg:py-28">
        <div className="absolute left-1/2 top-0 h-64 w-[70%] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="container relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Sparkles size={14} />
            Direct Principal Communication
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Start with the situation.<br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-200 to-slate-300 bg-clip-text text-transparent">We’ll take it from there.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Investor, seller, or capital partner—send OCG the context that matters. This page prepares a direct email to our official inbox so you can see exactly what is being sent before you send it.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-[#070A0F] py-20 lg:py-24">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-9"
            >
              {handoffPrepared ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={30} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Your email request is prepared.</h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                    Your email app should have opened with the OCG request filled in. Review it and press send to complete the handoff. This site does not claim the request is received until you send the email.
                  </p>
                  <a
                    href={`mailto:${OCG_EMAIL}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-500"
                  >
                    <Mail size={14} /> Open Email Again
                  </a>
                  {briefAttached && briefId && (
                    <div className="mx-auto mt-5 max-w-md rounded-xl border border-blue-900/60 bg-blue-950/30 p-3 font-mono text-[11px] text-blue-300">
                      G Strategy Brief reference included: {briefId}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">01 · Your role</div>
                    <div className="grid grid-cols-3 gap-3">
                      <RoleButton active={role === 'investor'} onClick={() => setRole('investor')} icon={<DollarSign size={18} />} label="Investor" />
                      <RoleButton active={role === 'seller'} onClick={() => setRole('seller')} icon={<Building2 size={18} />} label="Seller" tone="amber" />
                      <RoleButton active={role === 'capital'} onClick={() => setRole('capital')} icon={<ShieldCheck size={18} />} label="Capital" tone="purple" />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-800 pt-6">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">02 · Context</div>
                    {role === 'investor' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Available Liquid Capital">
                          <select value={formData.capitalAmount} onChange={(e) => setFormData({ ...formData, capitalAmount: e.target.value })} className={inputClass}>
                            <option>$25,000 – $50,000 (Exploring)</option>
                            <option>$50,000 – $100,000 (Active Deployment)</option>
                            <option>$100,000 – $250,000+ (Portfolio Growth)</option>
                            <option>$250,000+ (Private Lending / Equity Partner)</option>
                          </select>
                        </Field>
                        <Field label="Primary Strategy Focus">
                          <select value={formData.strategyInterest} onChange={(e) => setFormData({ ...formData, strategyInterest: e.target.value })} className={inputClass}>
                            <option>Fix & Flip Renovation</option>
                            <option>BRRRR Strategy</option>
                            <option>Buy & Hold</option>
                            <option>Undecided / Open to Guidance</option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {role === 'seller' && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Wichita Property Address" full>
                          <input required value={formData.propertyAddress} onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })} placeholder="Property address" className={inputClass} />
                        </Field>
                        <Field label="Estimated Condition">
                          <select value={formData.propertyCondition} onChange={(e) => setFormData({ ...formData, propertyCondition: e.target.value })} className={inputClass}>
                            <option>Needs Cosmetic Updates</option>
                            <option>Needs Major Mechanical / Roof Repairs</option>
                            <option>Full Gut / Deferred Maintenance</option>
                            <option>Move-In Ready</option>
                          </select>
                        </Field>
                        <Field label="Desired Timeline">
                          <select value={formData.sellerTimeline} onChange={(e) => setFormData({ ...formData, sellerTimeline: e.target.value })} className={inputClass}>
                            <option>As soon as possible (14–21 days)</option>
                            <option>Within 30–60 days</option>
                            <option>Flexible / Exploring Options</option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {role === 'capital' && (
                      <Field label="Capital Structure Focus">
                        <select value={formData.lendingFacility} onChange={(e) => setFormData({ ...formData, lendingFacility: e.target.value })} className={inputClass}>
                          <option>Private Debt / 1st Lien Senior Bridge Loan</option>
                          <option>DSCR Rental Mortgage Facility</option>
                          <option>Equity Joint Venture</option>
                        </select>
                      </Field>
                    )}
                  </div>

                  <div className="space-y-4 border-t border-slate-800 pt-6">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">03 · Contact</div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full Name"><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} /></Field>
                      <Field label="Phone"><input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} /></Field>
                    </div>
                    <Field label="Email"><input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} /></Field>
                    <Field label="Additional Notes"><textarea rows={3} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className={inputClass} /></Field>
                  </div>

                  {briefAttached && briefId && (
                    <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-xs text-blue-300">
                      <Bot size={14} className="shrink-0 text-blue-400" />
                      G Strategy Brief reference will be included: <span className="font-mono">{briefId}</span>
                    </div>
                  )}

                  <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-950 transition hover:bg-blue-500">
                    <Send size={15} /> Prepare Direct Email Request
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-slate-500">Your email app opens with this request prefilled. You review and send it yourself; nothing is silently submitted from this page.</p>
                </form>
              )}
            </motion.div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-xl">
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Direct Contact</div>
                  <h3 className="mt-1 text-xl font-bold text-white">The OC Group / OCG</h3>
                  <p className="mt-1 text-xs text-slate-400">Wichita & South-Central Kansas</p>
                </div>
                <div className="space-y-3">
                  <a href="tel:+17206209929" className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition hover:border-blue-500/40">
                    <Phone size={16} className="text-blue-400" />
                    <div><div className="text-[10px] font-bold uppercase text-slate-500">Direct Phone</div><div className="text-sm font-semibold text-slate-200">{OCG_PHONE}</div></div>
                  </a>
                  <a href={`mailto:${OCG_EMAIL}`} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 transition hover:border-blue-500/40">
                    <Mail size={16} className="text-blue-400" />
                    <div><div className="text-[10px] font-bold uppercase text-slate-500">Official Email</div><div className="break-all text-sm font-semibold text-slate-200">{OCG_EMAIL}</div></div>
                  </a>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <MapPin size={16} className="text-blue-400" />
                    <div><div className="text-[10px] font-bold uppercase text-slate-500">Headquarters</div><div className="text-sm font-semibold text-slate-200">Wichita, Kansas</div></div>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-blue-900/40 bg-blue-950/30 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-bold text-blue-300"><Clock size={14} /> Response Commitment</div>
                  <p className="text-xs leading-relaxed text-slate-400">Once your email or call reaches OCG, strategy inquiries and property submissions are reviewed by the principal/acquisition team, generally within one business day.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-200 outline-none transition focus:border-blue-400';

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={full ? 'sm:col-span-2 block' : 'block'}><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>{children}</label>;
}

function RoleButton({ active, onClick, icon, label, tone = 'blue' }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; tone?: 'blue' | 'amber' | 'purple' }) {
  const activeClass = tone === 'amber' ? 'border-amber-400 bg-amber-600 text-white' : tone === 'purple' ? 'border-purple-400 bg-purple-600 text-white' : 'border-blue-400 bg-blue-600 text-white';
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-3.5 text-center text-xs transition ${active ? activeClass : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'}`}>
      <span className="mx-auto mb-1 flex justify-center">{icon}</span>{label}
    </button>
  );
}

export default Contact;
