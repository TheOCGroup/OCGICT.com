import { ArrowRight, BrainCircuit, BriefcaseBusiness, Radar, Wrench } from "lucide-react";
import { Link } from "wouter";

const coverage = [
  { icon: Radar, title: "What changed", copy: "Important AI developments without forcing you to follow every announcement." },
  { icon: Wrench, title: "What is worth testing", copy: "Tools and capabilities that may actually improve how people work." },
  { icon: BriefcaseBusiness, title: "What matters for business", copy: "Practical applications, operating implications, and lessons from implementation." },
  { icon: BrainCircuit, title: "What is noise", copy: "A clear distinction between meaningful progress, early experiments, and hype." },
];

export default function LabReport() {
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

      <section className="px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm leading-7 text-slate-600">Came here for real estate instead?</p>
          <Link href="/" className="mt-3 inline-flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-600">Return to OCG <ArrowRight size={14} /></Link>
        </div>
      </section>
    </main>
  );
}
