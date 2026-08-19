import { useMemo, useState } from "react";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";

type GContext = {
  label: string;
  prompt: string;
  cta: string;
  suggestions: string[];
};

const CONTEXT: Record<string, GContext> = {
  "/invest": {
    label: "Investment strategy",
    prompt: "Comparing strategies? I can help you pressure-test Flip, BRRRR, Buy + Hold, or an undecided path.",
    cta: "Ask G about strategy",
    suggestions: ["Which strategy fits me?", "Flip vs. BRRRR", "How much cash should I keep?"],
  },
  "/strategies": {
    label: "Strategy selection",
    prompt: "Tell me your goal, timeline, and capital position. I’ll help narrow the strategy without forcing a premature choice.",
    cta: "Build my strategy brief",
    suggestions: ["Show me the trade-offs", "What should I finance?", "I’m not sure yet"],
  },
  "/sell": {
    label: "Property review",
    prompt: "If you have a property in mind, I can explain the review process and help you decide what OCG needs next.",
    cta: "Talk through the property",
    suggestions: ["How does the review work?", "What if it needs repairs?", "Do I need to clean it out?"],
  },
  "/submit-deal": {
    label: "Property intake",
    prompt: "I can explain any step in the property intake without making you restart or repeat what you already shared.",
    cta: "Ask G about this step",
    suggestions: ["What happens next?", "Why do you need this?", "Can I skip something?"],
  },
  "/how-ocg-works": {
    label: "How OCG works",
    prompt: "Want the short version of HUNTER, VICTOR, PIPER, or how human judgment fits into the process?",
    cta: "Show me the system",
    suggestions: ["What does HUNTER do?", "What does VICTOR analyze?", "What does PIPER handle?"],
  },
  "/about": {
    label: "OCG story",
    prompt: "Curious why a real-estate company started building its own AI systems? I can walk you through the operating problem behind it.",
    cta: "Ask G why OCG built AI",
    suggestions: ["Why did OCG build AI?", "Who is behind OCG?", "What is OCG LAB?"],
  },
  "/contact": {
    label: "Next step",
    prompt: "Not sure which conversation you need? I can route you toward investing, selling, lending, partnership, or OCG LAB.",
    cta: "Help me choose",
    suggestions: ["I want to invest", "I need to sell", "I want to partner"],
  },
  "/ocg-lab": {
    label: "Technology behind OCG",
    prompt: "You’re looking behind the curtain. I can explain what OCG LAB builds and how the technology connects back to real operating problems.",
    cta: "Explore with G",
    suggestions: ["Who built G?", "What does OCG LAB make?", "Can this work for my business?"],
  },
  "/lab-report": {
    label: "The Lab Report",
    prompt: "Want the practical version of what matters in AI? I can point you to the topics most relevant to your business or curiosity.",
    cta: "Ask G what matters",
    suggestions: ["What should I know?", "What’s worth testing?", "How do I subscribe?"],
  },
};

function GMark({ active = false }: { active?: boolean }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center" aria-hidden="true">
      <span className={`absolute inset-0 rounded-[16px] border border-blue-300/25 bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB] shadow-lg shadow-blue-950/40 ${active ? "animate-pulse" : ""}`} />
      <span className="absolute inset-[5px] rounded-[12px] border border-white/10" />
      <span className="relative text-xl font-black tracking-[-0.08em] text-white">G</span>
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(96,165,250,0.9)]" />
    </div>
  );
}

export function GlobalGCompanion() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const context = useMemo(() => {
    if (location.startsWith("/admin")) return null;
    return (
      CONTEXT[location] ?? {
        label: "OCG guide",
        prompt: "I know where you are on the site. Ask me what matters here, compare options, or let me point you to the right next step.",
        cta: "Talk to G",
        suggestions: ["What should I look at here?", "How can OCG help?", "Show me the next step"],
      }
    );
  }, [location]);

  if (!context) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-blue-500/20 bg-[#0A0F18]/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">
              <Sparkles size={13} />
              <span>{context.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Close G"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="mb-4 flex items-center gap-3">
              <GMark active />
              <div>
                <div className="font-extrabold tracking-tight">G</div>
                <div className="text-[11px] text-slate-400">Your contextual OCG companion</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-200">{context.prompt}</p>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested questions for G">
              {context.suggestions.map((suggestion) => (
                <span
                  key={suggestion}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-slate-300"
                >
                  {suggestion}
                </span>
              ))}
            </div>

            <Link
              href="/#g"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-600/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-blue-200 transition hover:bg-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>{context.cta}</span>
              <ChevronRight size={15} />
            </Link>

            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
              G stays quiet unless invited. He keeps the page context so you do not have to start over. Voice remains a staging preview unless explicitly labeled live.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-[18px] border border-blue-400/25 bg-[#0D1320] text-white shadow-xl shadow-blue-950/40 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A0F]"
        aria-label={open ? "Close G" : "Open G"}
        aria-expanded={open}
      >
        <span className="absolute inset-0 rounded-[18px] bg-blue-500/10 opacity-70 blur-md transition group-hover:opacity-100" aria-hidden="true" />
        <GMark active={open} />
      </button>
    </div>
  );
}
