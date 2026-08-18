import { Link } from "wouter";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GExperience from "@/components/GExperience";
import { ArrowRight, Check, Clock3, Search, Calculator, Workflow, Hammer, Landmark, ShieldCheck, Sparkles } from "lucide-react";

const strategies = [
  { title: "Flip", path: "Acquire → Renovate → Sell → Build Capital", desc: "A practical first step for some investors who need to build experience and capital before pursuing longer-term holdings." },
  { title: "BRRRR", path: "Acquire → Renovate → Rent → Refinance → Repeat", desc: "A portfolio-building strategy when the property, financing, rent profile, and refinance path support it." },
  { title: "Buy + Hold", path: "Acquire → Stabilize → Operate → Build Equity", desc: "For investors prioritizing durable ownership, cash flow, and long-term equity creation." },
  { title: "Not Sure Yet", path: "Goals → Capital → Risk → Market → Strategy", desc: "You do not need to arrive with the answer. Determining the right path is part of the work." },
];

const pressureTasks = ["Document condition", "Build renovation scope", "Estimate rehab", "Research comps", "Determine ARV", "Develop design direction", "Run acquisition numbers", "Structure financing", "Prepare lender review", "Make the decision"];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090b0f] text-white">
      <Navbar />

      <main>
        <section className="relative min-h-[96vh] overflow-hidden pt-20 flex items-center">
          <div className="absolute inset-0 hero-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(31,78,255,0.28),transparent_28%)]" />
          <div className="absolute right-[-12%] top-[20%] h-[520px] w-[620px] rotate-[-8deg] rounded-[48px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] shadow-2xl shadow-blue-950/30 backdrop-blur-sm" />
          <div className="absolute right-[5%] top-[29%] hidden lg:block w-[470px]">
            <div className="property-concept-card">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/40"><span>Wichita concept property</span><span>OCG intelligence view</span></div>
              <div className="mt-6 h-56 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#151a22,#0c1017_55%,#173575)] relative overflow-hidden">
                <div className="absolute inset-x-7 bottom-6 h-28 rounded-t-xl border-x border-t border-white/15 bg-white/[0.06]" />
                <div className="absolute bottom-6 left-[37%] h-20 w-16 border border-white/15 bg-black/15" />
                <div className="absolute bottom-12 left-12 h-12 w-16 border border-blue-300/20 bg-blue-400/10" />
                <div className="absolute bottom-12 right-12 h-12 w-16 border border-blue-300/20 bg-blue-400/10" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[['Evidence','Verified + retrieved'],['Potential','Design + scope'],['Decision','Human guided']].map(([a,b]) => <div key={a} className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><div className="text-xs text-white/75">{a}</div><div className="mt-1 text-[10px] text-white/35">{b}</div></div>)}
              </div>
            </div>
          </div>

          <div className="container relative z-10 py-20">
            <div className="max-w-[760px]">
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.55}} className="section-eyebrow mb-5">Wichita, Kansas · Real Estate Investment + Acquisition</motion.div>
              <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.05}} className="ocg-wordmark text-[clamp(5rem,14vw,10rem)] font-black tracking-[-0.105em] leading-[0.76] mb-9 pr-5">OCG</motion.div>
              <motion.h1 initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.12}} className="text-[clamp(3.3rem,7vw,6.5rem)] font-semibold leading-[0.91] tracking-[-0.055em] max-w-4xl">
                Real estate investing.<br/><span className="text-white/46">Built smarter.</span>
              </motion.h1>
              <motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.18}} className="mt-7 max-w-2xl text-lg md:text-xl leading-relaxed text-white/58">
                OCG combines acquisition strategy, renovation and design expertise, financing intelligence, and AI-powered systems to help investors make better real estate decisions and execute with greater precision.
              </motion.p>
              <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.24}} className="mt-9 flex flex-wrap gap-3">
                <Link href="/invest" className="btn-gold">Start Investing <ArrowRight size={15}/></Link>
                <Link href="/sell" className="btn-ghost-gold">Sell a Property</Link>
                <a href="#g" className="btn-ghost-gold">Talk to G</a>
              </motion.div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/42">
                {["Strategy before deployment", "Wichita-focused intelligence", "Human-guided decisions"].map(v => <span key={v} className="flex items-center gap-2"><Check size={13} className="text-blue-300" />{v}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white text-[#0b0d12] py-24 md:py-32">
          <div className="container">
            <div className="max-w-4xl">
              <div className="section-eyebrow !text-blue-700 mb-5">Start with the objective</div>
              <h2 className="text-4xl md:text-7xl font-semibold tracking-[-0.045em] leading-[0.98]">You don't have to know your strategy yet.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-black/55">Some investors need to build a portfolio. Some need to complete a disciplined flip first, build capital, learn the process, and decide what comes next. OCG helps determine the strategy before forcing the investment.</p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              {strategies.map((s, i) => (
                <div key={s.title} className="strategy-card group">
                  <div className="text-xs tracking-[0.18em] text-blue-700">0{i+1}</div>
                  <h3 className="mt-8 text-3xl font-semibold tracking-[-0.03em]">{s.title}</h3>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-[0.09em] text-black/45">{s.path}</div>
                  <p className="mt-5 text-sm leading-relaxed text-black/55">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 md:py-36 bg-[#0c0f15] overflow-hidden">
          <div className="container">
            <div className="grid lg:grid-cols-[0.82fr_1.18fr] gap-14 lg:gap-20 items-start">
              <div className="lg:sticky lg:top-28">
                <div className="section-eyebrow mb-5">Why we built it</div>
                <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[0.97]">We didn't set out to build AI.</h2>
                <h3 className="mt-5 text-2xl md:text-3xl text-white/45 tracking-[-0.02em]">We needed a faster way to make good decisions.</h3>
                <p className="mt-7 text-base leading-relaxed text-white/55">Off-market opportunities often come with restrictive showing windows and compressed decision timelines. The work still had to be done: understand condition, scope renovation, estimate costs, establish ARV, develop a design and value-add direction, structure financing, and prepare enough information for lender review.</p>
                <p className="mt-5 text-base leading-relaxed text-white/55">The process was right. The timing wasn't. So OCG began building the systems we wished we'd had.</p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:p-7">
                <div className="flex items-center justify-between border-b border-white/8 pb-5">
                  <div className="flex items-center gap-3"><Clock3 className="text-blue-300" size={18}/><span className="text-sm font-semibold">Limited decision window</span></div>
                  <span className="text-xs uppercase tracking-[0.13em] text-white/35">Off-market workflow</span>
                </div>
                <div className="mt-5 grid sm:grid-cols-2 gap-2">
                  {pressureTasks.map((task, i) => <div key={task} className="flex items-center gap-3 rounded-xl border border-white/7 bg-black/10 px-4 py-3 text-sm text-white/58"><span className="text-[10px] text-blue-300/70">{String(i+1).padStart(2,'0')}</span>{task}</div>)}
                </div>
                <div className="mt-7 rounded-2xl bg-blue-500/[0.08] border border-blue-300/10 p-5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-blue-300/70">The shift</div>
                  <div className="mt-3 text-2xl font-semibold">Compress the work. Preserve the judgment.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#090b0f] py-24 md:py-32">
          <div className="container">
            <div className="max-w-3xl">
              <div className="section-eyebrow mb-5">OCG operating intelligence</div>
              <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em]">Technology doesn't make the decision. It helps us make a better one.</h2>
            </div>
            <div className="mt-12 grid lg:grid-cols-4 gap-4">
              {[
                {icon:Search,title:'HUNTER',sub:'Opportunity Discovery',body:'Finds and investigates acquisition opportunities and surfaces the signals that deserve attention.'},
                {icon:Calculator,title:'VICTOR',sub:'Deal Intelligence',body:'Performs deeper underwriting, comp analysis, rehab modeling, MAO, financing scenarios, and risk review.'},
                {icon:Workflow,title:'PIPER',sub:'Acquisition Operations',body:'Manages opportunity stages, next actions, follow-up, negotiation context, and pipeline continuity.'},
                {icon:Sparkles,title:'OCG',sub:'Human Strategy + Execution',body:'Applies judgment, advises clients, coordinates acquisition and renovation, and makes the final call.'},
              ].map((x) => <div key={x.title} className="tech-card"><x.icon size={20} className="text-blue-300"/><div className="mt-8 text-2xl font-bold">{x.title}</div><div className="mt-1 text-xs uppercase tracking-[0.12em] text-blue-300/65">{x.sub}</div><p className="mt-5 text-sm leading-relaxed text-white/50">{x.body}</p></div>)}
            </div>
          </div>
        </section>

        <GExperience />

        <section className="bg-white text-[#0a0d12] py-24 md:py-32">
          <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="section-eyebrow !text-blue-700 mb-5">Transformation as strategy</div>
              <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[0.98]">We don't look at renovation as decoration.</h2>
              <p className="mt-6 text-lg leading-relaxed text-black/55">Condition, scope, layout, materials, target buyer or renter, financing, and exit strategy all affect the investment. OCG combines renovation and design thinking with acquisition analysis to pursue value creation without blindly over-improving the asset.</p>
              <Link href="/how-ocg-works" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">See the OCG process <ArrowRight size={15}/></Link>
            </div>
            <div className="concept-compare">
              <div className="concept-half before"><span>Before · Wichita concept</span><Hammer size={24}/></div>
              <div className="concept-half after"><span>Proposed transformation</span><Sparkles size={24}/></div>
            </div>
          </div>
        </section>

        <section className="bg-[#0b0e14] py-24">
          <div className="container rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-blue-500/[0.06] p-8 md:p-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-3xl"><div className="section-eyebrow mb-4">Your next move</div><h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em]">Start with a strategy conversation.</h2><p className="mt-5 text-white/52">Whether you have capital, a property, experience, or simply the determination to get started, we can begin by understanding what you are trying to accomplish.</p></div>
            <Link href="/contact" className="btn-gold shrink-0">Book Strategy Session <ArrowRight size={15}/></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
