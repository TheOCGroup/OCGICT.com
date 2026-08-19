import { ArrowRight, Building2, Compass, Cpu, Palette, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "wouter";

const disciplines = [
  { icon: Palette, label: "Interior Design", copy: "Understanding how layout, material choices, and presentation influence how people experience a property." },
  { icon: ShieldCheck, label: "Insurance + Risk", copy: "Learning to think in terms of exposure, protection, contingencies, and what can go wrong before it does." },
  { icon: Building2, label: "Real Estate", copy: "Acquisition, negotiation, property evaluation, investor needs, and the realities of moving a transaction forward." },
  { icon: Wrench, label: "Renovation", copy: "Connecting condition, scope, design, cost, sequencing, and the end user instead of treating rehab as a line item." },
  { icon: Compass, label: "Investment", copy: "Matching strategy, capital, financing, risk, timeline, and exit rather than forcing every investor into the same model." },
  { icon: Cpu, label: "AI + Systems", copy: "Building tools to compress research, organize evidence, coordinate work, and make the operating process easier to execute." },
];

export default function About() {
  return (
    <main className="min-h-screen bg-[#F7F7F4] text-[#0B0F17]">
      <section className="border-b border-slate-200 px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">About OCG</div>
              <h1 className="mt-4 text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Real-estate experience shaped the company.
              </h1>
              <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-tight text-slate-600 sm:text-3xl">Necessity shaped the technology.</h2>
              <p className="mt-7 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                OCG grew from a practical problem: real-estate opportunities move quickly, but responsible decisions still require research, condition thinking, renovation scope, numbers, financing, and execution. The company began building intelligent systems because the process needed to move faster without pretending the judgment could be automated away.
              </p>
            </div>

            <aside className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Founder</div>
              <div className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-[#F2F1ED] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-black text-slate-600">GO</div>
                <div className="mt-4 text-sm font-black">Genaro Ocasio</div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Founder photography will replace this deliberate placeholder. No synthetic founder image is used.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">The convergence</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Six disciplines. One operating point of view.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">They are not separate careers pasted onto a bio. Each one changed how OCG approaches property, risk, value, capital, design, and execution.</p>
          </div>

          <div className="relative mt-12">
            <div className="absolute bottom-0 left-5 top-0 hidden w-px bg-gradient-to-b from-blue-600 via-slate-300 to-slate-200 md:block" />
            <div className="grid gap-4 md:pl-14 lg:grid-cols-2">
              {disciplines.map(({ icon: Icon, label, copy }, index) => (
                <article key={label} className="group relative rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={20} /></div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">0{index + 1}</div>
                      <h3 className="mt-1 text-xl font-black tracking-tight">{label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1220] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Why technology entered the picture</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">We did not start with AI. We started with a bottleneck.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Limited showing windows and off-market timelines made it difficult to inspect, scope, compare, underwrite, design, coordinate financing, and decide quickly enough. OCG began building the systems it wished it had. The technology exists to organize evidence and accelerate the work—not to replace professional verification or human judgment.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">Operating principle</div>
              <blockquote className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-3xl">Technology does not make the decision. It helps us make a better one.</blockquote>
              <Link href="/how-ocg-works" className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-300">See how OCG works <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Start where you are</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Investor, seller, partner, or simply exploring?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">OCG should make the next conversation clear without forcing everyone through the same funnel.</p>
          </div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-blue-500">Start a conversation <ArrowRight size={14} /></Link>
        </div>
      </section>
    </main>
  );
}
