import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Handshake, Landmark, Mail, Phone, ShieldCheck } from "lucide-react";

type Audience = "investor" | "seller" | "capital" | "partner";

const audienceOptions: Array<{ id: Audience; label: string; icon: typeof Building2; description: string }> = [
  { id: "investor", label: "Investor", icon: Building2, description: "Explore a first deal, next acquisition, or portfolio strategy." },
  { id: "seller", label: "Seller", icon: Landmark, description: "Talk through a Wichita property and the right review path." },
  { id: "capital", label: "Capital / Lender", icon: ShieldCheck, description: "Discuss lending, capital, or financing relationships." },
  { id: "partner", label: "Partner / Other", icon: Handshake, description: "Contractors, real-estate partners, vendors, and other conversations." },
];

export function Contact() {
  const [audience, setAudience] = useState<Audience>("investor");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyAddress: "",
    strategyInterest: "",
    capitalAmount: "",
    timeline: "",
    message: "",
  });

  const active = useMemo(() => audienceOptions.find((item) => item.id === audience)!, [audience]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, ...form, source: "contact-page" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send your inquiry.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message || "Unable to send your inquiry.");
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-[#F7F7F4] text-[#0B0F17]">
      <section className="border-b border-slate-200 bg-white px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Start with the right conversation</div>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.055em] sm:text-6xl lg:text-7xl">WHAT ARE YOU TRYING TO ACCOMPLISH?</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              OCG works with investors, property owners, lenders, and real-estate partners. Choose the path that fits; we will only ask for the information relevant to that conversation.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {audienceOptions.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAudience(id)}
                className={`rounded-[24px] border p-5 text-left transition ${audience === id ? "border-blue-600 bg-[#0B0F17] text-white shadow-lg" : "border-slate-200 bg-[#F7F7F4] hover:border-slate-300"}`}
              >
                <Icon size={20} className={audience === id ? "text-blue-300" : "text-blue-700"} />
                <div className="mt-4 font-black tracking-tight">{label}</div>
                <p className={`mt-2 text-sm leading-6 ${audience === id ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {status === "success" ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={30} /></div>
                <h2 className="mt-6 text-3xl font-black tracking-tight">We received your inquiry.</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">It has been placed into OCG's intake queue for review. The next step depends on the type of conversation you selected.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">{active.label}</div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">Tell us enough to start well.</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Name<input required value={form.name} onChange={(e) => field("name", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                  <label className="text-sm font-semibold">Email<input required type="email" value={form.email} onChange={(e) => field("email", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                  <label className="text-sm font-semibold">Phone<input value={form.phone} onChange={(e) => field("phone", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                  <label className="text-sm font-semibold">Timeline<input value={form.timeline} onChange={(e) => field("timeline", e.target.value)} placeholder="Flexible, 30 days, etc." className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                </div>

                {audience === "seller" && (
                  <label className="block text-sm font-semibold">Property address<input value={form.propertyAddress} onChange={(e) => field("propertyAddress", e.target.value)} placeholder="Wichita property address" className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                )}

                {audience === "investor" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold">Strategy interest<input value={form.strategyInterest} onChange={(e) => field("strategyInterest", e.target.value)} placeholder="Flip, BRRRR, hold, unsure" className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                    <label className="text-sm font-semibold">Capital context <span className="font-normal text-slate-400">(optional)</span><input value={form.capitalAmount} onChange={(e) => field("capitalAmount", e.target.value)} placeholder="Only if useful to discuss" className="mt-2 w-full rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>
                  </div>
                )}

                <label className="block text-sm font-semibold">What should we know?<textarea rows={5} value={form.message} onChange={(e) => field("message", e.target.value)} placeholder="A few sentences is enough." className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-[#F7F7F4] px-4 py-3 font-normal outline-none focus:border-blue-500" /></label>

                {status === "error" && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <button disabled={status === "sending"} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {status === "sending" ? "Sending…" : "Send to OCG"} <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[30px] bg-[#0B0F17] p-7 text-white">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">What happens next</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight">A human reviews the context.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">G can help you think through the website, but consequential property, financing, and acquisition decisions remain subject to OCG review and verification.</p>
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3"><Mail size={18} className="text-blue-700" /><span className="font-black">Prefer email?</span></div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use the form so your inquiry is classified and routed to the right OCG workflow.</p>
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3"><Phone size={18} className="text-blue-700" /><span className="font-black">Need help choosing a path?</span></div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Open G from the corner of this page. He knows you are on the contact experience and can help route the conversation.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Contact;
