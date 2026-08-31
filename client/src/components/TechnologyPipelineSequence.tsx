import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calculator, Home, Search, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const steps = [
  {
    number: "01",
    title: "Start with the property",
    copy: "An address, a deal, or a seller conversation gives OCG a concrete place to begin.",
    icon: Home,
  },
  {
    number: "02",
    title: "Build the evidence",
    copy: "Property facts, comparable sales, condition signals, renovation scope, and local context are assembled before conclusions are drawn.",
    icon: Search,
  },
  {
    number: "03",
    title: "Run the numbers",
    copy: "Acquisition price, ARV, repairs, financing, reserves, holding costs, and exit strategy are evaluated together — not in isolation.",
    icon: Calculator,
  },
  {
    number: "04",
    title: "Make the decision",
    copy: "Technology accelerates the work. OCG applies judgment, verifies what matters, and decides whether the opportunity deserves capital and execution.",
    icon: ShieldCheck,
  },
];

export function TechnologyPipelineSequence() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.07] bg-[#070A0F] py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(37,99,235,.12),transparent_30%),radial-gradient(circle_at_85%_100%,rgba(30,64,175,.08),transparent_28%)]" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="lg:sticky lg:top-32"
          >
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-300">How intelligence becomes action</div>
            <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-5xl">
              Better decisions begin before the offer.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              OCG combines local real-estate judgment with disciplined research and underwriting. The technology stays behind the experience; what clients see is a clearer path from property to decision.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => window.dispatchEvent(new Event("ocg:open-g"))}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Talk to G <ArrowRight size={14} />
              </button>
              <Link
                href="/how-ocg-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 transition-all hover:border-blue-300/25 hover:bg-blue-400/[0.06]"
              >
                See How OCG Works
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{ duration: 0.55, delay: index * 0.07 }}
                  className="group relative min-h-[250px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 transition-all hover:-translate-y-1 hover:border-blue-300/20 hover:bg-blue-400/[0.035] sm:p-7"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/0 to-transparent transition-all group-hover:via-blue-300/45" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Step {step.number}</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/15 bg-blue-400/[0.055] text-blue-200">
                      <Icon size={19} />
                    </div>
                  </div>
                  <h3 className="mt-10 text-xl font-extrabold tracking-tight text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{step.copy}</p>
                </motion.article>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12 border-t border-white/[0.07] pt-7"
        >
          <p className="max-w-4xl text-xs leading-6 text-slate-500">
            OCG uses technology to accelerate research, organization, and scenario analysis. Property values, renovation budgets, financing terms, and acquisition decisions remain subject to source verification, physical condition, market changes, and human review.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default TechnologyPipelineSequence;
