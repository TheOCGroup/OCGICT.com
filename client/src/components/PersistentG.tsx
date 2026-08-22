import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Home, MessageCircle, Mic, Send, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "wouter";

interface GMessage {
  id: string;
  sender: "g" | "user";
  text: string;
}

export function PersistentG() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `g-site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [messages, setMessages] = useState<GMessage[]>([
    { id: "intro", sender: "g", text: "Hi, I’m G — The OC Group’s AI real estate intelligence agent. I can help you explore an investment, understand our services, or start evaluating a Wichita property you may want to sell." },
  ]);

  useEffect(() => {
    const openG = () => setOpen(true);
    window.addEventListener("ocg:open-g", openG);
    return () => window.removeEventListener("ocg:open-g", openG);
  }, []);

  const pageContext = useMemo(() => {
    if (location.startsWith("/sell")) return "seller property evaluation";
    if (location.startsWith("/invest") || location.startsWith("/services")) return "investment and consulting services";
    if (location.startsWith("/about")) return "The OC Group and its approach";
    return "The OC Group";
  }, [location]);

  if (location.startsWith("/admin")) return null;

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text) return;
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
          context: { page: location, topic: pageContext },
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
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-24 right-4 z-[90] w-[calc(100vw-2rem)] max-w-[430px] overflow-hidden rounded-[28px] border border-amber-400/25 bg-[#07101d]/96 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:right-6"
          >
            <div className="border-b border-white/10 bg-gradient-to-r from-[#0d1a2c] to-[#09111d] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ boxShadow: ["0 0 0 0 rgba(245,158,11,.18)", "0 0 0 10px rgba(245,158,11,0)", "0 0 0 0 rgba(245,158,11,0)"] }} transition={{ duration: 2.4, repeat: Infinity }} className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-br from-slate-950 to-blue-950 text-2xl font-black text-amber-300">G</motion.div>
                  <div><div className="flex items-center gap-2 text-sm font-black text-white">G <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Online</span></div><div className="text-[11px] text-slate-400">OCG AI Real Estate Intelligence</div></div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close G"><X size={18} /></button>
              </div>
            </div>
            <div className="max-h-[410px] space-y-3 overflow-y-auto p-4">
              {messages.map((m) => <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.sender === "user" ? "bg-amber-500 text-slate-950" : "border border-white/10 bg-white/5 text-slate-200"}`}>{m.text}</div></div>)}
              {isTyping && <div className="text-xs text-slate-500">G is thinking…</div>}
            </div>
            <div className="border-t border-white/10 p-4">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Link href="/sell" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/15"><Home size={14} /> Get My Offer</Link>
                <button onClick={() => send("Tell me what The OC Group can do for me.")} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-bold text-slate-200 hover:bg-white/10"><Sparkles size={14} /> Ask G</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-2">
                <button type="button" className="rounded-xl p-2 text-slate-500" title="Voice experience preview"><Mic size={17} /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask G anything…" className="min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-slate-600" />
                <button type="submit" disabled={!input.trim()} className="rounded-xl bg-amber-500 p-2.5 text-slate-950 disabled:opacity-40"><Send size={16} /></button>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="fixed bottom-4 right-4 z-[89] sm:right-6">
        <button onClick={() => setOpen((v) => !v)} className="group flex items-center gap-3 rounded-full border border-amber-400/30 bg-[#08111d]/95 py-2 pl-2 pr-4 text-left shadow-2xl shadow-black/50 backdrop-blur-xl hover:border-amber-300/50">
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }} className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/40 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-xl font-black text-amber-300">G</motion.div>
          <div className="hidden sm:block"><div className="text-xs font-black text-white">Hi, I’m G.</div><div className="text-[10px] text-slate-400">Ask me about a property or OCG.</div></div>
          {open ? <ChevronDown size={15} className="text-slate-500" /> : <MessageCircle size={15} className="text-amber-300" />}
        </button>
      </motion.div>
    </>
  );
}
