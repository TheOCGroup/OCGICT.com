import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Home, MessageCircle, Mic, Send, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GExperience } from "./GExperience";

interface GMessage {
  id: string;
  sender: "g" | "user";
  text: string;
}

export function PersistentG() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `g-site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState<GMessage[]>([
    { id: "intro", sender: "g", text: "Hi, I’m G — The OC Group’s AI real estate intelligence agent. I can help you explore an investment, understand our services, or start evaluating a Wichita property you may want to sell." },
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
    if (location.startsWith("/sell")) return {
      topic: "seller property evaluation",
      nudge: "Selling a property? Give me the address. I’ll guide you while OCG researches it in the background.",
    };
    if (location.startsWith("/invest") || location.startsWith("/services") || location.startsWith("/strategies")) return {
      topic: "investment and consulting services",
      nudge: "Evaluating an investment? Ask me about acquisition, renovation, financing, or Wichita strategy.",
    };
    if (location.startsWith("/about")) return {
      topic: "The OC Group and its approach",
      nudge: "I’m G. I can show you how The OC Group combines acquisitions, renovation strategy, consulting, and AI.",
    };
    return {
      topic: "The OC Group",
      nudge: "Hi, I’m G. Ask me about a property, an investment, or how The OC Group works.",
    };
  }, [location]);

  useEffect(() => {
    if (location.startsWith("/admin")) return;
    setShowNudge(false);
    const timer = window.setTimeout(() => setShowNudge(true), 1800);
    return () => window.clearTimeout(timer);
  }, [location]);

  if (location.startsWith("/admin")) return null;

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isTyping) return;
    setShowNudge(false);
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text }]);
    setIsTyping(true);
    try {
      const res = await fetch("/api/g/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          context: { page: location, topic: pageContext.topic },
          history: messages.map((m) => ({ role: m.sender === "g" ? "assistant" : "user", content: m.text })),
        }),
      });
      const data = res.ok ? await res.json() : null;
      const reply = data?.replyText || "I can help with that. If this is about selling a property, give me the address and I’ll guide you into the property evaluation flow.";
      setMessages((prev) => [...prev, { id: `g-${Date.now()}`, sender: "g", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `g-${Date.now()}`, sender: "g", text: "I’m still here. The live intelligence gateway is unavailable for a moment, but I can take you directly into the property evaluation or investment experience." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showNudge && !open && (
          <motion.button
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            onClick={() => { setOpen(true); setShowNudge(false); }}
            className="hidden sm:block fixed bottom-24 right-4 z-[88] max-w-[330px] rounded-2xl border border-amber-300/25 bg-[#07101d]/96 p-4 text-left shadow-2xl shadow-black/50 backdrop-blur-xl sm:right-6"
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300"><Sparkles size={12} /> G is available</div>
            <p className="text-xs leading-relaxed text-slate-200">{pageContext.nudge}</p>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(
          <motion.aside
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.97 }}
            aria-hidden={!open}
            inert={!open}
            transition={{ duration: 0.22 }}
            className={`fixed inset-x-2 top-2 bottom-20 z-[90] flex flex-col sm:inset-x-auto sm:top-4 sm:bottom-20 sm:right-6 sm:w-[min(980px,calc(100vw-3rem))] flex flex-col overflow-hidden rounded-[28px] border border-amber-400/25 bg-[#07101d]/97 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:right-6 ${open ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-[#0d1a2c] to-[#09111d] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div animate={reduceMotion ? undefined : { boxShadow: ["0 0 0 0 rgba(245,158,11,.18)", "0 0 0 10px rgba(245,158,11,0)", "0 0 0 0 rgba(245,158,11,0)"] }} transition={{ duration: 2.4, repeat: Infinity }} className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-br from-slate-950 to-blue-950 text-2xl font-black text-amber-300">G</motion.div>
                  <div><div className="flex items-center gap-2 text-sm font-black text-white">G <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Online</span></div><div className="text-[11px] text-slate-400">OCG AI Real Estate Intelligence</div></div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close G"><X size={18} /></button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#070A0F]">
              <GExperience embedded active={open} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="fixed bottom-4 right-4 z-[89] sm:right-6">
        <button onClick={() => { setOpen((v) => !v); setShowNudge(false); }} className="group flex items-center gap-3 rounded-full border border-amber-400/30 bg-[#08111d]/95 py-2 pl-2 pr-4 text-left shadow-2xl shadow-black/50 backdrop-blur-xl hover:border-amber-300/50">
          <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }} className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/40 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-xl font-black text-amber-300">G</motion.div>
          <div className="hidden sm:block"><div className="text-xs font-black text-white">Hi, I’m G.</div><div className="text-[10px] text-slate-400">Ask me about a property or OCG.</div></div>
          {open ? <ChevronDown size={15} className="text-slate-500" /> : <MessageCircle size={15} className="text-amber-300" />}
        </button>
      </motion.div>
    </>
  );
}
