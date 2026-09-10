import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, BarChart3, Hammer, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import OCGWordmark from "@/components/OCGWordmark";
import Home from "./Home";

const chapters = [
  { kicker: "01 · SOURCE", title: "See the opportunity.", copy: "Start with the property, the block, and the market—not the sales pitch.", Icon: MapPin },
  { kicker: "02 · ANALYZE", title: "Make the numbers prove it.", copy: "Underwrite acquisition, repairs, financing, ARV, rent, risk, and exit before capital moves.", Icon: BarChart3 },
  { kicker: "03 · TRANSFORM", title: "Create value deliberately.", copy: "Renovation strategy follows the investment thesis: scope the work, protect the budget, and improve the asset with intent.", Icon: Hammer },
  { kicker: "04 · EXECUTE", title: "Move with conviction.", copy: "Evidence first. Capital structured intelligently. Human judgment where it matters.", Icon: ShieldCheck },
];

function CinematicOpening() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const shade = useTransform(scrollYProgress, [0, 0.62, 1], [0.46, 0.72, 0.88]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={sectionRef} className="relative h-[360vh] bg-[#05080d]">
      <div className="sticky top-0 h-[calc(100vh-5rem)] overflow-hidden border-b border-white/10">
        <motion.img
          src="/images/hero/wichita_hero_street.jpg"
          alt="Wichita, Kansas residential neighborhood"
          className="absolute inset-0 h-full w-full object-cover"
          style={reduceMotion ? undefined : { scale: imageScale, y: imageY }}
        />
        <motion.div className="absolute inset-0 bg-[#05080d]" style={reduceMotion ? { opacity: 0.68 } : { opacity: shade }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_38%,rgba(37,99,235,0.22),transparent_36%),linear-gradient(90deg,rgba(5,8,13,0.98)_0%,rgba(5,8,13,0.80)_48%,rgba(5,8,13,0.22)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#05080d] to-transparent" />

        <div className="absolute left-0 top-0 h-px w-full bg-white/10">
          <motion.div className="h-px bg-blue-400" style={{ width: progress }} />
        </div>

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-12">
          <div className="grid w-full items-end gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="pb-8 lg:pb-16">
              <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-300">
                <span className="h-px w-8 bg-blue-400" /> Wichita, Kansas · Real Estate Investment + Acquisition
              </div>
              <div className="mb-6"><OCGWordmark size="hero" /></div>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
                STRATEGY FIRST.<br />
                <span className="text-blue-300">NUMBERS ALWAYS.</span><br />
                EXECUTION DELIVERED.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                OCG combines acquisition strategy, underwriting, renovation intelligence, financing discipline, and local market judgment to make better real estate decisions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/invest" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-transform hover:-translate-y-0.5">
                  Explore Investor Services <ArrowRight size={14} />
                </Link>
                <Link href="/sell" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:border-blue-300/70 hover:bg-blue-500/10">
                  Start Property Review
                </Link>
              </div>
            </div>

            <div className="hidden pb-12 lg:block">
              <div className="ml-auto max-w-md rounded-[2rem] border border-white/10 bg-black/28 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">OCG Investment Method</div>
                <div className="space-y-2">
                  {chapters.map(({ kicker, title, Icon }, index) => (
                    <motion.div
                      key={kicker}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                      initial={{ opacity: 0.5, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><Icon size={17} /></div>
                      <div><div className="text-[9px] font-bold tracking-[0.18em] text-blue-300">{kicker}</div><div className="text-sm font-semibold text-white">{title}</div></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">
          <ArrowDown className="mx-auto mb-1 animate-bounce" size={14} /> Scroll to follow the investment thesis
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {chapters.map(({ kicker, title, copy, Icon }, index) => (
          <div key={kicker} className="flex h-[67.5vh] items-center px-5 sm:px-8 lg:px-12" style={{ marginTop: index === 0 ? "90vh" : 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.58 }}
              transition={{ duration: 0.55 }}
              className="ml-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#07101d]/86 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300"><Icon size={20} /></div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">{kicker}</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white sm:text-5xl">{title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">{copy}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CinematicHome() {
  return (
    <>
      <CinematicOpening />
      <style>{`.cinematic-existing-home > div > section:first-child { display: none; }`}</style>
      <div className="cinematic-existing-home"><Home /></div>
    </>
  );
}
