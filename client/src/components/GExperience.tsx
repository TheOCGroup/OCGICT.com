import { useMemo, useState } from "react";
import { ArrowRight, Bot, Building2, Home, Landmark, Sparkles } from "lucide-react";
import { Link } from "wouter";

type Path = "start" | "capital" | "sell" | "learn";

const responses: Record<Path, { title: string; body: string; next: string }> = {
  start: {
    title: "You don't need to know your strategy yet.",
    body: "Tell me what you want real estate to accomplish. We can explore whether a flip, BRRRR, buy-and-hold, or another structure deserves a closer look before you commit capital.",
    next: "Explore investment paths",
  },
  capital: {
    title: "Capital should have a job — not just be spent.",
    body: "For a fix-and-flip, OCG generally explores lender-funded acquisition and renovation first when appropriate. Your liquidity may be more valuable as reserves, lender confidence, and protection against overruns. DSCR and hold strategies can require capital differently.",
    next: "Discuss my capital strategy",
  },
  sell: {
    title: "Let's start with the property and your situation.",
    body: "You can tell me what is happening in plain language. I can guide you through the information OCG needs for a preliminary review without forcing you through a long form first.",
    next: "Start seller review",
  },
  learn: {
    title: "I can explain the process while the site shows it.",
    body: "Ask about the 70% rule, rehab scope, ARV, lender structures, BRRRR, fix-and-flip, or how OCG evaluates a Wichita opportunity. G is designed to teach, guide, and know when a human strategy conversation is the right next step.",
    next: "See how OCG works",
  },
};

export default function GExperience() {
  const [path, setPath] = useState<Path>("start");
  const response = useMemo(() => responses[path], [path]);

  return (
    <section id="g" className="relative overflow-hidden bg-[#0a0d13] py-24 md:py-32 border-y border-white/8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(40,91,255,0.18),transparent_34%)]" />
      <div className="container relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="section-eyebrow mb-4">Meet G · OCG Investment Intelligence</div>
          <h2 className="text-4xl md:text-6xl font-semibold text-white leading-[0.98] tracking-[-0.03em]">
            Not a chatbot.<br />A guided way into OCG.
          </h2>
          <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-white/58">
            G is being designed as the conversational intelligence layer for OCG — Wichita-aware, investment-fluent, interruptible, and able to guide investors and sellers through the right next step without pretending to replace human judgment.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button onClick={() => setPath("start")} className="g-choice"><Sparkles size={17}/> I want to start investing</button>
            <button onClick={() => setPath("capital")} className="g-choice"><Landmark size={17}/> I have capital</button>
            <button onClick={() => setPath("sell")} className="g-choice"><Home size={17}/> I want to sell</button>
            <button onClick={() => setPath("learn")} className="g-choice"><Building2 size={17}/> Teach me how OCG works</button>
          </div>
        </div>

        <div className="relative rounded-[28px] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-blue-950/20 backdrop-blur">
          <div className="rounded-[22px] border border-white/8 bg-[#0e1219] p-5 md:p-7">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-blue-300"><Bot size={20}/></div>
                <div>
                  <div className="font-semibold text-white">G</div>
                  <div className="text-xs text-white/35">OCG Investment Intelligence</div>
                </div>
              </div>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-300/5 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-200/75">Guided mode</span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-300/75">G is thinking with context</p>
              <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-white tracking-[-0.02em]">{response.title}</h3>
              <p className="mt-4 text-sm md:text-base leading-relaxed text-white/58">{response.body}</p>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link href={path === "sell" ? "/sell" : path === "learn" ? "/how-ocg-works" : "/contact"} className="btn-gold justify-center flex-1">
                {response.next} <ArrowRight size={15}/>
              </Link>
              <span className="flex items-center justify-center rounded-sm border border-white/8 px-4 py-3 text-[11px] text-white/35">Live agent integration follows this UI layer</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
