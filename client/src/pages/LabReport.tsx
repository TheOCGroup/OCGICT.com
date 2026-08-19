import { FormEvent, useState } from "react";
import { ArrowRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, Radar, Wrench } from "lucide-react";
import { Link } from "wouter";

const coverage = [
  { icon: Radar, title: "What changed", copy: "Important AI developments without forcing you to follow every announcement." },
  { icon: Wrench, title: "What is worth testing", copy: "Tools and capabilities that may actually improve how people work." },
  { icon: BriefcaseBusiness, title: "What matters for business", copy: "Practical applications, operating implications, and lessons from implementation." },
  { icon: BrainCircuit, title: "What is noise", copy: "A clear distinction between meaningful progress, early experiments, and hype." },
];

export default function LabReport() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "subscribed" | "staging" | "error">("idle");
  const [message, setMessage] = useState("");

  async function subscribe(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "ocg-lab-report-gateway" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to subscribe.");

      if (data.status === "SUBSCRIBED") {
        setStatus("subscribed");
        setMessage("You’re subscribed to the next Lab Report.");
      } else {
        setStatus("staging");
        setMessage("Your interest was captured in staging. Persistent newsletter delivery is being connected before public launch.");
      }
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message || "Unable to subscribe.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F4] text-[#0B0F17]">
      <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">From OCG LAB</div>
              <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">THE LAB REPORT</h1>
              <p className="mt-5 max-w-2xl text-xl font-semibold tracking-tight text-slate-700">Practical AI intelligence without the noise.</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                The Lab Report follows meaningful AI developments, tools worth testing, and practical business applications—along with lessons from building and using intelligent systems inside the OCG ecosystem.
              </p>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current publication</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight">Read the latest Lab Report</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Open the current publication and follow future issues from the dedicated Lab Report experience.</p>
              <a href="https://theocglabreport.netlify.app/" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B0F17] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800">
                Read The Lab Report <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {coverage.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-[26px] border border-slate-200 bg-[#F7F7F4] p-6">
                <Icon size={20} className="text-blue-700" />
                <h2 className="mt-4 text-lg font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-[34px] bg-[#0B0F17] p-7 text-white sm:p-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Get the next issue</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Stay connected to what we’re learning.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">One email when a new issue is published. No generic marketing blast, and no interruption to the OCG real-estate experience.</p>
          </div>

          <div>
            {status === "subscribed" ? (
              <div className="rounded-[24px] border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-100">
                <div className="flex items-center gap-2 font-black"><CheckCircle2 size={18} /> Subscribed</div>
                <p className="mt-2 text-emerald-100/80">{message}</p>
              </div>
            ) : (
              <form onSubmit={subscribe} className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60" />
                  <button disabled={status === "sending"} className="rounded-xl bg-blue-600 px-5 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:bg-blue-500 disabled:opacity-50">
                    {status === "sending" ? "Submitting…" : "Get The Next Issue"}
                  </button>
                </div>
                {message && <div className={`text-xs leading-5 ${status === "error" ? "text-red-300" : status === "staging" ? "text-amber-200" : "text-slate-400"}`}>{message}</div>}
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm leading-7 text-slate-600">Came here for real estate instead?</p>
          <Link href="/" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-600">Return to OCG <ArrowRight size={14} /></Link>
        </div>
      </section>
    </main>
  );
}
