import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Home, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";

interface GMessage {
  id: string;
  sender: "g" | "user";
  text: string;
}

const starterPrompts = {
  sell: [
    "I want to sell a Wichita property.",
    "What happens after I enter my address?",
  ],
  invest: [
    "Help me evaluate an investment opportunity.",
    "Which OCG strategy fits my goals?",
  ],
  default: [
    "What can OCG help me with?",
    "I have a property I want to evaluate.",
  ],
};

export function PersistentG() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `g-site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<GMessage[]>([
    {
      id: "intro",
      sender: "g",
      text: "Hi, I’m G — OCG’s real estate intelligence guide. Give me an address, an investment question, or tell me what you’re trying to accomplish. I’ll help you find the right next move.",
    },
  ]);

  useEffect(() => {
    const openG = () => {
      setOpen(true);
      setShowNudge(false);
    };
    window.addEventListener("ocg:open-g", openG);
    return () => window.removeEventListener("ocg:open-g", openG);
  }, []);

  const pageContext = useMemo(() => {
    if (location.startsWith("/sell")) {
      return {
        key: "sell" as const,
        topic: "seller property evaluation",
        eyebrow: "Selling a Wichita property?",
        nudge: "Give me the address. I’ll guide you through the property review and explain what OCG can evaluate before a walkthrough.",
      };
    }

    if (location.startsWith("/invest") || location.startsWith("/services") || location.startsWith("/strategies")) {
      return {
        key: "invest" as const,
        topic: "investment and consulting services",
        eyebrow: "Evaluating an investment?",
        nudge: "Ask me about acquisition, renovation, financing, BRRRR, flips, holds, or Wichita market strategy.",
      };
    }

    return {
      key: "default" as const,
      topic: location.startsWith("/about") ? "The OC Group and its approach" : "The OC Group",
      eyebrow: "Need a starting point?",
      nudge: "Ask me about a property, an investment, selling to OCG, or how our process works.",
    };
  }, [location]);

  useEffect(() => {
    if (location.startsWith("/admin")) return;
    setShowNudge(false);
    const timer = window.setTimeout(() => setShowNudge(true), 2600);
    return () => window.clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 180);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isTyping, open]);

  if (location.startsWith("/admin")) return null;

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isTyping) return;

    setShowNudge(false);
    setInput("");
    const userMessage: GMessage = { id: `u-${Date.now()}`, sender: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/g/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          context: { page: location, topic: pageContext.topic },
          history: [...messages, userMessage].map((m) => ({
            role: m.sender === "g" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });

      const data = res.ok ? await res.json() : null;
      const reply = data?.replyText ||
        "I can still guide you from here. If this is about a property, send me the address. If it’s an investment decision, tell me the goal, budget, and strategy you’re considering.";

      setMessages((prev) => [...prev, { id: `g-${Date.now()}`, sender: "g", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          sender: "g",
          text: "My live intelligence connection is temporarily unavailable. You can still start a property review or explore OCG’s investment process below.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showNudge && !open && (
          <motion.button
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              setOpen(true);
              setShowNudge(false);
            }}
            className="fixed bottom-24 right-4 z-[88] max-w-[340px] overflow-hidden rounded-[22px] border border-blue-300/20 bg-[#07101d]/96 p-4 text-left shadow-2xl shadow-black/50 backdrop-blur-2xl sm:right-6"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
              <Sparkles size={12} /> {pageContext.eyebrow}
            </div>
            <p className="text-xs leading-5 text-slate-200">{pageContext.nudge}</p>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            className="fixed bottom-24 right-4 z-[90] flex max-h-[min(720px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-[460px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#07101d]/98 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:right-6"
            aria-label="G — OCG real estate intelligence"
          >
            <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.22),transparent_45%),linear-gradient(135deg,#0c1727,#07101d)] p-5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 0 rgba(96,165,250,.18)", "0 0 0 11px rgba(96,165,250,0)", "0 0 0 0 rgba(96,165,250,0)"] }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-300/35 bg-gradient-to-br from-[#05080e] via-blue-950 to-[#07101d] text-2xl font-black text-blue-200"
                  >
                    G
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-black text-white">
                      G
                      <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                        Available
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">OCG Real Estate Intelligence</div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Close G"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-4 max-w-sm text-xs leading-5 text-slate-300">
                Property questions, investment strategy, seller guidance, and OCG process — one conversation.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      m.sender === "user"
                        ? "rounded-br-md bg-blue-500 text-white shadow-lg shadow-blue-950/30"
                        : "rounded-bl-md border border-white/10 bg-white/[0.045] text-slate-200"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="grid gap-2 pt-1">
                  {starterPrompts[pageContext.key].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-xs font-semibold leading-5 text-slate-300 transition-all hover:border-blue-300/30 hover:bg-blue-400/[0.06] hover:text-white"
                    >
                      <span>{prompt}</span>
                      <ArrowRight size={13} className="shrink-0 text-blue-300 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className="flex items-center gap-2 px-1 py-2 text-xs text-slate-500">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}>●</motion.span>
                  G is working through your question…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 bg-black/10 p-4">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Link
                  href="/sell"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 bg-blue-400/[0.07] px-3 py-2.5 text-xs font-bold text-blue-100 transition-colors hover:bg-blue-400/[0.12]"
                >
                  <Home size={14} /> Property Review
                </Link>
                <Link
                  href="/invest"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Investment Options
                </Link>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/85 p-2 focus-within:border-blue-300/30"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask G about a property or investment…"
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-600"
                  aria-label="Message G"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="rounded-xl bg-blue-500 p-2.5 text-white transition-all hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Send message to G"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="mt-2.5 px-1 text-[9px] leading-4 text-slate-600">
                Property and investment guidance is preliminary until OCG verifies source data, condition, financing, and walkthrough findings.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="fixed bottom-4 right-4 z-[89] sm:right-6"
      >
        <button
          onClick={() => {
            setOpen((v) => !v);
            setShowNudge(false);
          }}
          className="group flex items-center gap-3 rounded-full border border-blue-300/20 bg-[#07101d]/95 py-2 pl-2 pr-4 text-left shadow-2xl shadow-black/50 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-blue-300/40"
          aria-label={open ? "Close G" : "Talk to G"}
        >
          <motion.div
            animate={{ scale: [1, 1.035, 1] }}
            transition={{ duration: 3.2, repeat: Infinity }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-300/30 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-xl font-black text-blue-200"
          >
            G
          </motion.div>
          <div className="hidden sm:block">
            <div className="text-xs font-black text-white">Talk to G</div>
            <div className="text-[10px] text-slate-400">Property + investment intelligence</div>
          </div>
          {open ? <ChevronDown size={15} className="text-slate-500" /> : <MessageCircle size={15} className="text-blue-300" />}
        </button>
      </motion.div>
    </>
  );
}
