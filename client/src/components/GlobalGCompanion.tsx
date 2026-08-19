import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Send, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GActionRegistry } from "@/intelligence/actionRegistry";
import { processGDialogue } from "@/intelligence/gActionDispatcher";
import { IGActionInvocation } from "../../../shared/contracts";

type GContext = {
  label: string;
  prompt: string;
  suggestions: string[];
};

type MiniMessage = {
  role: "user" | "assistant";
  content: string;
};

type GPageState = {
  selectedStrategy?: string;
  selectedProperty?: string;
  calculator?: Record<string, number>;
  sellerStep?: number;
  visitorType?: string;
};

const CONTEXT: Record<string, GContext> = {
  "/invest": {
    label: "Investment strategy",
    prompt: "Comparing strategies? I can help you pressure-test Flip, BRRRR, Buy + Hold, or an undecided path.",
    suggestions: ["Which strategy fits me?", "Flip vs. BRRRR", "How much cash should I keep?"],
  },
  "/strategies": {
    label: "Strategy selection",
    prompt: "Tell me your goal, timeline, and capital position. I’ll help narrow the strategy without forcing a premature choice.",
    suggestions: ["Show me the trade-offs", "What should I finance?", "I’m not sure yet"],
  },
  "/sell": {
    label: "Property review",
    prompt: "If you have a property in mind, I can explain the review process and help you decide what OCG needs next.",
    suggestions: ["How does the review work?", "What if it needs repairs?", "Do I need to clean it out?"],
  },
  "/submit-deal": {
    label: "Property intake",
    prompt: "I can explain any step in the property intake without making you restart or repeat what you already shared.",
    suggestions: ["What happens next?", "Why do you need this?", "Can I skip something?"],
  },
  "/how-ocg-works": {
    label: "How OCG works",
    prompt: "Want the short version of HUNTER, VICTOR, PIPER, or how human judgment fits into the process?",
    suggestions: ["What does HUNTER do?", "What does VICTOR analyze?", "What does PIPER handle?"],
  },
  "/about": {
    label: "OCG story",
    prompt: "Curious why a real-estate company started building its own AI systems? I can walk you through the operating problem behind it.",
    suggestions: ["Why did OCG build AI?", "Who is behind OCG?", "What is OCG LAB?"],
  },
  "/contact": {
    label: "Next step",
    prompt: "Not sure which conversation you need? I can route you toward investing, selling, lending, partnership, or OCG LAB.",
    suggestions: ["I want to invest", "I need to sell", "I want to partner"],
  },
  "/ocg-lab": {
    label: "Technology behind OCG",
    prompt: "You’re looking behind the curtain. I can explain what OCG LAB builds and how it connects back to real operating problems.",
    suggestions: ["Who built G?", "What does OCG LAB make?", "Can this work for my business?"],
  },
  "/lab-report": {
    label: "The Lab Report",
    prompt: "Want the practical version of what matters in AI? I can point you to the topics most relevant to your business or curiosity.",
    suggestions: ["What should I know?", "What’s worth testing?", "How do I subscribe?"],
  },
};

function GMark({ state = "idle" }: { state?: "idle" | "active" | "thinking" }) {
  const pulse = state === "thinking" ? "animate-pulse" : state === "active" ? "scale-[1.03]" : "";
  return (
    <div className={`relative flex h-11 w-11 items-center justify-center transition-transform duration-300 ${pulse}`} aria-hidden="true">
      <span className="absolute inset-0 rounded-[16px] border border-blue-300/25 bg-gradient-to-br from-[#111827] via-[#172554] to-[#2563EB] shadow-lg shadow-blue-950/40" />
      <span className="absolute inset-[5px] rounded-[12px] border border-white/10" />
      <span className="relative text-xl font-black tracking-[-0.08em] text-white">G</span>
      <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${state === "thinking" ? "bg-white" : "bg-blue-300"} shadow-[0_0_14px_rgba(96,165,250,0.9)]`} />
    </div>
  );
}

export function GlobalGCompanion() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<MiniMessage[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [pageState, setPageState] = useState<GPageState>({});
  const [sessionId] = useState(() => `global_g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const abortRef = useRef<AbortController | null>(null);

  const context = useMemo(() => {
    if (location.startsWith("/admin")) return null;
    return CONTEXT[location] ?? {
      label: "OCG guide",
      prompt: "I know where you are on the site. Ask me what matters here, compare options, or let me point you to the right next step.",
      suggestions: ["What should I look at here?", "How can OCG help?", "Show me the next step"],
    };
  }, [location]);

  useEffect(() => {
    setPageState({});
  }, [location]);

  useEffect(() => {
    const handlePageContext = (event: Event) => {
      const detail = (event as CustomEvent<GPageState>).detail;
      if (!detail || typeof detail !== "object") return;
      setPageState((current) => ({ ...current, ...detail }));
    };

    window.addEventListener("ocg:g-context", handlePageContext as EventListener);
    return () => window.removeEventListener("ocg:g-context", handlePageContext as EventListener);
  }, []);

  if (!context) return null;

  async function askG(question: string) {
    if (!context) return;
    const trimmed = question.trim();
    if (!trimmed || thinking) return;

    const userMessage: MiniMessage = { role: "user", content: trimmed };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setThinking(true);
    setActionNotice(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let reply = "";
    let action: IGActionInvocation | undefined;

    try {
      const response = await fetch("/api/g/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          history: messages,
          clientContext: {
            route: location,
            section: context.label,
            ...pageState,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        reply = data.replyText || "";
        action = data.action;
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.warn("G gateway unavailable; using local fallback", error);
    }

    if (!reply) {
      const fallback = processGDialogue(trimmed, messages.map((message, index) => ({
        id: String(index),
        sender: message.role === "user" ? "user" : "g",
        text: message.content,
      })));
      reply = fallback.messageText;
      action = fallback.action;
    }

    if (action) {
      const result = GActionRegistry.execute(action);
      if (result.message) setActionNotice(result.message);
    }

    setMessages((current) => [...current, { role: "assistant", content: reply }]);
    setThinking(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void askG(input);
  }

  function close() {
    abortRef.current?.abort();
    setThinking(false);
    setOpen(false);
  }

  const latestAnswer = [...messages].reverse().find((message) => message.role === "assistant")?.content;
  const contextDetail = pageState.selectedStrategy ? ` · ${pageState.selectedStrategy}` : "";

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="w-[min(410px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-blue-500/20 bg-[#0A0F18]/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">
              <Sparkles size={13} />
              <span>{context.label}{contextDetail}</span>
            </div>
            <button type="button" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Close G">
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <GMark state={thinking ? "thinking" : messages.length ? "active" : "idle"} />
              <div>
                <div className="font-extrabold tracking-tight">G</div>
                <div className="text-[11px] text-slate-400">Here with you on {context.label.toLowerCase()}</div>
              </div>
            </div>

            {!messages.length && <p className="text-sm leading-relaxed text-slate-200">{context.prompt}</p>}

            {latestAnswer && (
              <div className="max-h-44 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-sm leading-relaxed text-slate-200">
                {latestAnswer}
              </div>
            )}

            {thinking && <div className="mt-3 text-xs text-blue-300">G is working through that…</div>}
            {actionNotice && <div className="mt-3 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[11px] text-blue-200">{actionNotice}</div>}

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Suggested questions for G">
              {context.suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void askG(suggestion)} disabled={thinking} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-blue-400/30 hover:text-white disabled:opacity-50">
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-4 flex gap-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask G about what you're looking at…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-400/40 focus:outline-none" />
              <button type="submit" disabled={!input.trim() || thinking} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-40" aria-label="Send to G">
                <Send size={15} />
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[10px] leading-relaxed text-slate-500">G stays quiet until invited and keeps this session as you move around the site.</p>
              <Link href="/#g" onClick={() => setOpen(false)} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 hover:text-blue-200">
                Full G <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} className="group relative flex h-14 w-14 items-center justify-center rounded-[18px] border border-blue-400/25 bg-[#0D1320] text-white shadow-xl shadow-blue-950/40 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A0F]" aria-label={open ? "Close G" : "Open G"} aria-expanded={open}>
        <span className="absolute inset-0 rounded-[18px] bg-blue-500/10 opacity-70 blur-md transition group-hover:opacity-100" aria-hidden="true" />
        <GMark state={open ? "active" : "idle"} />
      </button>
    </div>
  );
}
