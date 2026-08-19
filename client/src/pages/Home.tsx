import { ArrowRight, Bot, Building2, CheckCircle2, DollarSign, FlaskConical, Newspaper, Sparkles } from "lucide-react";
import { Link } from "wouter";
import OCGWordmark from "@/components/OCGWordmark";
import { InteractiveTransformSlider } from "@/components/InteractiveTransformSlider";
import { Calculators } from "@/components/Calculators";
import { GExperience } from "@/components/GExperience";
import { TechnologyPipelineSequence } from "@/components/TechnologyPipelineSequence";
import { OriginStorySequence } from "@/components/OriginStorySequence";

export function Home() {
  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#0B0F17] selection:bg-blue-600 selection:text-white">
      <section className="relative flex min-h-[92vh] items-center overflow-hidden border-b border-slate-200 bg-[#0B0F17]">
        <div className="absolute inset-0">
          <img
            src="/images/hero/wichita_hero_street.jpg"
            alt="Residential neighborhood in Wichita, Kansas"
            className="h-full w-full scale-[1.03] object-cover object-center motion-safe:animate-[heroDrift_18s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F]/95 via-[#070A0F]/68 to-[#070A0F]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F]/70 via-transparent to-[#070A0F]/15" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              <Sparkles size={13} className="text-blue-300" /> Wichita, Kansas · Real Estate Investment + Acquisition
            </div>

            <div className="mb-7">
              <OCGWordmark size="hero" />
            </div>

            <h1 className="text-4xl font-black leading-[1.01] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              REAL ESTATE INVESTING.<br />
              <span className="text-blue-200">BUILT SMARTER.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg lg:text-xl">
              Acquire intelligently. Transform strategically. Build lasting value. OCG combines real-estate judgment, renovation thinking, financing strategy, and intelligent operating systems to move with greater precision in Wichita.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/invest" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-xl shadow-black/20 transition hover:bg-blue-500">
                Start Investing <ArrowRight size={15} />
              </Link>
              <Link href="/sell" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-4 text-xs font-black uppercase tracking-[0.12em] text-white backdrop-blur-md transition hover:bg-white/15">
                Sell a Property
              </Link>
              <a href="#g" className="inline-flex items-center gap-2 rounded-xl px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-blue-100 transition hover:bg-white/10">
                <Bot size={15} /> Ask G
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-200">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-blue-300" /> Strategy before deployment</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-blue-300" /> Wichita market focus</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-blue-300" /> Human judgment + execution</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#F7F7F4] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Start with your goal</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#0B0F17] sm:text-5xl">What are you trying to accomplish?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">You do not need to arrive knowing the strategy or the process. Start with the reason you are here.</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Link href="/invest" className="group rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><DollarSign size={23} /></div>
              <div className="mt-7 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Invest</div>
              <h3 className="mt-2 text-2xl font-black tracking-tight">I want to invest.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Explore Flip, BRRRR, Buy + Hold, or let OCG help determine which path deserves a closer look.</p>
              <div className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-700">Explore strategies <ArrowRight size={14} className="transition group-hover:translate-x-1" /></div>
            </Link>

            <Link href="/sell" className="group rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800"><Building2 size={23} /></div>
              <div className="mt-7 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">Sell</div>
              <h3 className="mt-2 text-2xl font-black tracking-tight">I have a property.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Start with the address, understand the review process, and see whether OCG may be a fit—without pressure.</p>
              <div className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-800">Start property review <ArrowRight size={14} className="transition group-hover:translate-x-1" /></div>
            </Link>

            <Link href="/how-ocg-works" className="group rounded-[30px] border border-slate-200 bg-[#111827] p-7 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300"><Sparkles size={23} /></div>
              <div className="mt-7 text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">OCG process</div>
              <h3 className="mt-2 text-2xl font-black tracking-tight">Show me how OCG works.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">See how property intelligence, underwriting, systems, and human judgment fit together.</p>
              <div className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-300">Follow the process <ArrowRight size={14} className="transition group-hover:translate-x-1" /></div>
            </Link>
          </div>
        </div>
      </section>

      <OriginStorySequence />
      <TechnologyPipelineSequence />

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700"><FlaskConical size={15} /> Technology developed by OCG LAB</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">The technology is evidence. Real estate is the mission.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">OCG LAB builds intelligent systems and business tools from real operating problems. If the technology behind OCG is what brought you here, there is a separate doorway for that.</p>
          </div>
          <Link href="/ocg-lab" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-[#F7F7F4] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-900 transition hover:border-blue-400">Explore OCG LAB <ArrowRight size={14} /></Link>
        </div>
      </section>

      <InteractiveTransformSlider />
      <Calculators />

      <section id="g" className="relative border-t border-slate-800 bg-[#070A0F] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-300"><Bot size={13} /> Meet G</div>
            <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-5xl">Available when you need him. Out of the way when you don’t.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">G is OCG’s contextual guide. Ask a real-estate question, compare a strategy, understand a number, or let him point you toward the right next step.</p>
          </div>
          <GExperience />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F7F7F4] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Newspaper size={25} /></div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">The Lab Report · from OCG LAB</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Practical AI intelligence without the noise.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Follow the developments, tools, and practical business applications we think are actually worth knowing.</p>
          </div>
          <Link href="/lab-report" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-blue-700">Read The Lab Report <ArrowRight size={14} /></Link>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0B0F17] px-4 py-20 text-center text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.18),transparent_42%)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Your next move</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">Start with the conversation that fits you.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">Investor, seller, lender, capital partner, or simply exploring—OCG should make the next step clear rather than forcing everyone through the same funnel.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-blue-600 px-7 py-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-blue-500">Start a Conversation</Link>
            <Link href="/about" className="rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/[0.08]">About OCG</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
