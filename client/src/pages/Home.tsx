import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Building2,
  Sparkles,
  ArrowRight,
  Bot,
  DollarSign,
  CheckCircle2,
  Home as HomeIcon,
  Search,
  Gauge,
  Footprints,
} from 'lucide-react';
import OCGWordmark from '@/components/OCGWordmark';
import { InteractiveTransformSlider } from '@/components/InteractiveTransformSlider';
import { Calculators } from '@/components/Calculators';
import { GExperience } from '@/components/GExperience';
import { TechnologyPipelineSequence } from '@/components/TechnologyPipelineSequence';
import { OriginStorySequence } from '@/components/OriginStorySequence';
import { WichitaLandmarkRibbon } from '@/components/WichitaLandmarkRibbon';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#070A0F] text-slate-100 selection:bg-blue-600 selection:text-white">
      <section className="relative flex min-h-[94vh] items-center justify-center overflow-hidden border-b border-slate-800">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 9, ease: 'easeOut' }}
          className="absolute inset-0 z-0"
        >
          <img
            src="/images/hero/wichita_hero_street.jpg"
            alt="Wichita Kansas residential neighborhood"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F]/95 via-[#070A0F]/74 to-[#070A0F]/22" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-[#070A0F]/10 to-transparent" />
          <motion.div
            animate={{ x: ['-8%', '8%', '-8%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-28 left-0 h-72 w-[70%] rounded-full bg-blue-500/10 blur-3xl"
          />
        </motion.div>

        <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={reveal}
              transition={{ duration: 0.75 }}
              className="max-w-3xl"
            >
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-950/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-300 shadow-lg shadow-black/40 backdrop-blur-md"
              >
                <Sparkles size={13} className="text-blue-400" />
                <span>Wichita, Kansas · Investment · Acquisition · Consulting</span>
              </motion.div>

              <div className="mb-6">
                <OCGWordmark size="hero" />
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.02] tracking-tight text-white drop-shadow-md sm:text-6xl lg:text-7xl">
                ACQUIRE INTELLIGENTLY.<br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-200 to-slate-200 bg-clip-text text-transparent">
                  TRANSFORM STRATEGICALLY.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base font-normal leading-relaxed text-slate-200 drop-shadow sm:text-lg lg:text-xl">
                Real estate investment, acquisition, renovation strategy, and consulting built around Wichita property intelligence and disciplined execution.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/sell"
                  className="group flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-950/70 transition-all hover:-translate-y-0.5 hover:bg-amber-400"
                >
                  <HomeIcon size={16} />
                  <span>Get My Preliminary Offer</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/invest"
                  className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/70 px-7 py-4 text-xs font-bold uppercase tracking-wider text-blue-200 shadow-xl backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-900/80"
                >
                  <span>Explore Investor Services</span>
                </Link>

                <a
                  href="#g"
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white"
                >
                  <Bot size={15} />
                  <span>Talk to G</span>
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300 drop-shadow">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={15} className="text-amber-400" />
                  <span>Preliminary Offer Path for Sellers</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={15} className="text-blue-400" />
                  <span>Wichita Micro-Market Intelligence</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={15} className="text-blue-400" />
                  <span>Human Review Where It Matters</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-amber-500/10 via-blue-500/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/78 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">Selling a Wichita Property?</div>
                    <div className="mt-1 text-lg font-extrabold text-white">Start with the address. We do the research.</div>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400"
                  >
                    <Search size={22} />
                  </motion.div>
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    ['1', 'Enter your address', 'We begin property and public-record research.'],
                    ['2', 'Answer a few questions', 'Condition, timing, and contact—nothing unnecessary.'],
                    ['3', 'OCG intelligence runs', 'Property facts, condition signals, comps, ARV, repairs, and acquisition math.'],
                    ['4', 'Receive your preliminary offer', 'If confidence gates pass, review the range and accept or counter subject to walkthrough.'],
                  ].map(([number, title, copy], index) => (
                    <motion.div
                      key={number}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + index * 0.12 }}
                      className="group flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition-colors hover:border-amber-500/30"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-black text-amber-400">{number}</div>
                      <div>
                        <div className="text-sm font-bold text-white">{title}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{copy}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link
                  href="/sell"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-amber-100"
                >
                  Start My Property Review <ArrowRight size={14} />
                </Link>
                <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-500">Preliminary offers are non-binding and subject to verification and walkthrough. If reliable data is insufficient, the property is routed for human review.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <WichitaLandmarkRibbon />

      <section className="relative z-10 border-b border-slate-800 bg-[#0B1220] py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mb-12 max-w-3xl"
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">Two Ways to Work With OCG</div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Invest with more intelligence. Sell with less friction.</h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl transition-colors hover:border-blue-500/50"
            >
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 transition-transform group-hover:scale-110">
                  <DollarSign size={24} />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-400">Investment · Acquisition · Consulting</div>
                <h3 className="mb-3 text-2xl font-bold text-white">For Real Estate Investors</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-300">Analyze opportunities, structure acquisitions, plan renovation, evaluate financing, and make better investment decisions with OCG alongside you.</p>
                <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  {['Deal & acquisition analysis', 'Renovation strategy', 'Financing strategy', 'Risk & exit planning'].map((item) => (
                    <div key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{item}</div>
                  ))}
                </div>
              </div>
              <div className="mt-8 border-t border-slate-800 pt-6">
                <Link href="/invest" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 transition-colors group-hover:text-blue-300">Explore Investor Services <ArrowRight size={14} /></Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group flex flex-col justify-between rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 p-8 shadow-xl transition-colors hover:border-amber-400/50"
            >
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 transition-transform group-hover:scale-110">
                  <Building2 size={24} />
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">Address → Intelligence → Preliminary Offer</div>
                <h3 className="mb-3 text-2xl font-bold text-white">For Property Sellers</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-300">Enter the property. Answer a few questions. OCG researches what it can privately and, when the evidence is strong enough, gives you a preliminary as-is acquisition offer.</p>
                <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  {['No cleaning or repairs first', 'Private property research', 'Accept or counter', 'Walkthrough before final terms'].map((item) => (
                    <div key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{item}</div>
                  ))}
                </div>
              </div>
              <div className="mt-8 border-t border-slate-800 pt-6">
                <Link href="/sell" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 transition-colors group-hover:text-amber-300">Get My Preliminary Offer <ArrowRight size={14} /></Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <InteractiveTransformSlider />
      <Calculators />
      <OriginStorySequence />
      <TechnologyPipelineSequence />

      <section id="g" className="relative z-10 border-t border-slate-800 bg-[#070A0F] py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={reveal}
            transition={{ duration: 0.65 }}
            className="mx-auto mb-12 max-w-4xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
              <Bot size={13} />
              <span>OCG Investment Intelligence</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">Not a chatbot.<br /><span className="bg-gradient-to-r from-blue-400 via-blue-200 to-slate-400 bg-clip-text text-transparent">An intelligent gateway into OCG.</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">Use G to explore investment scenarios, Wichita housing context, financing strategy, property questions, and your next decision.</p>
          </motion.div>
          <div className="mx-auto max-w-6xl"><GExperience /></div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-gradient-to-b from-[#0B1220] to-[#070A0F] py-20 text-center">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">Your Next Move</div>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Start with the property—or start with the strategy.</h2>
          <p className="mb-8 text-base leading-relaxed text-slate-300">If you are selling, start with the address. If you are investing, start with the opportunity. OCG handles the analysis from there.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/sell" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-950 transition-all hover:-translate-y-0.5 hover:bg-amber-400">Get My Preliminary Offer <ArrowRight size={14} /></Link>
            <Link href="/contact" className="rounded-xl bg-blue-600 px-8 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-950 transition-all hover:-translate-y-0.5 hover:bg-blue-500">Book Strategy Session</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
