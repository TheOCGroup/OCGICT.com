import { ArrowRight, BookOpen, Boxes, Calculator, Cpu, Sparkles, Wrench } from "lucide-react";
import { Link } from "wouter";

const capabilities = [
  { icon: Cpu, title: "AI Systems", copy: "Purpose-built agents and intelligent applications designed around real operating work." },
  { icon: Boxes, title: "Automation", copy: "Connected workflows that move information, decisions, and follow-up through a business." },
  { icon: Sparkles, title: "Agentic Experiences", copy: "Interfaces like G that can understand context, explain, navigate, and take approved actions." },
];

const productFamilies = [
  { icon: BookOpen, title: "AI Playbooks", copy: "Practical operating guides for applying AI to real business workflows." },
  { icon: Wrench, title: "Super AI Systems", copy: "Packaged AI systems and playbooks built for repeatable business use." },
  { icon: Calculator, title: "Toolkits + Calculators", copy: "Focused tools for analysis, decisions, and execution without unnecessary complexity." },
];

export default function OCGLab() {
  return (
    <main className="min-h-screen bg-[#F7F7F4] text-[#0B0F17]">
      <section className="relative overflow-hidden border-b border-slate-200 px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#10B981]" />
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-blue-700">OCG Ecosystem · Technology</div>
            <h1 className="text-5xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">OCG LAB</h1>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-slate-700 sm:text-3xl">AI built for real operating problems.</h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              OCG LAB is the technology company in the OCG ecosystem. It builds intelligent systems, automation, business applications, and digital tools from problems encountered in real operations—including the technology demonstrated across OCG.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/lab-report" className="inline-flex items-center gap-2 rounded-xl bg-[#0B0F17] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800">
                Read The Lab Report <ArrowRight size={14} />
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-800 transition hover:border-slate-400">Back to OCG</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">What the LAB builds</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Technology should solve work, not create more of it.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={21} /></div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0B1220] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Products</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Useful products, not technology theater.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">OCG visitors should only see these recommendations when they are actually relevant. The real-estate journey remains the priority.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {productFamilies.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <Icon size={20} className="text-blue-300" />
                  <h3 className="mt-4 font-black">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
