import { useMemo, useState } from "react";
import { Bot, ChevronRight, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const CONTEXT: Record<string, { label: string; prompt: string; cta: string }> = {
  "/invest": {
    label: "Investment strategy",
    prompt: "Comparing strategies? I can help you pressure-test Flip, BRRRR, Buy + Hold, or an undecided path.",
    cta: "Ask G about strategy",
  },
  "/strategies": {
    label: "Strategy selection",
    prompt: "Tell me your goal, timeline, and capital position. I’ll help narrow the strategy without forcing a premature choice.",
    cta: "Build my strategy brief",
  },
  "/sell": {
    label: "Property review",
    prompt: "Have a property in mind? I can explain the review process, likely questions, and what happens before any preliminary range is shown.",
    cta: "Talk through the property",
  },
  "/submit-deal": {
    label: "Property intake",
    prompt: "I can help explain any step in the property intake without making you restart or repeat context.",
    cta: "Ask G about this step",
  },
  "/how-ocg-works": {
    label: "How OCG works",
    prompt: "Want the short version of HUNTER, VICTOR, PIPER, or how human judgment fits into the process?",
    cta: "Show me the system",
  },
  "/about": {
    label: "OCG story",
    prompt: "Curious why a real-estate company started building its own AI systems? I can walk you through the operating problem behind it.",
    cta: "Ask G why OCG built AI",
  },
  "/contact": {
    label: "Next step",
    prompt: "Not sure which conversation you need? I can route you toward investing, selling, lending, partnership, or OCG LAB.",
    cta: "Help me choose",
  },
};

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
      }
    );
  }, [location]);

  if (!context) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[80] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-blue-500/25 bg-[#0A0F18]/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
              <Sparkles size={14} />
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
            <div className="mb-3 flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-[#111827] to-[#1D4ED8]/60 shadow-lg shadow-blue-950/50">
                <span className="absolute inset-1 rounded-xl border border-white/10 animate-pulse" aria-hidden="true" />
                <Bot size={21} className="relative text-blue-100" />
              </div>
              <div>
                <div className="font-extrabold tracking-tight">G</div>
                <div className="text-[11px] text-slate-400">Context-aware OCG guide</div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-200">{context.prompt}</p>

            <Link
              href="/#g"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-600/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-blue-200 transition hover:bg-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>{context.cta}</span>
              <ChevronRight size={15} />
            </Link>

            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
              G stays quiet unless you open him. Voice remains a staging preview unless explicitly labeled live.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB] text-white shadow-xl shadow-blue-950/50 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A0F]"
        aria-label={open ? "Close G" : "Open G"}
        aria-expanded={open}
      >
        <span className="absolute inset-1 rounded-xl border border-white/10 opacity-80 transition group-hover:opacity-100" aria-hidden="true" />
        <span className="absolute inset-0 rounded-2xl bg-blue-400/10 blur-md animate-pulse" aria-hidden="true" />
        <Bot size={23} className="relative" />
      </button>
    </div>
  );
}
