import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, ArrowRight, ShieldCheck, FileText, CheckCircle2, User, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { GActionRegistry } from "@/intelligence/actionRegistry";
import { processGDialogue } from "@/intelligence/gActionDispatcher";
import { persistStrategyBrief } from "@/lib/persistence";
import { getActiveBookingProvider } from "@/lib/booking";
import { IOCGStrategyBrief, IGActionInvocation } from "../../../shared/contracts";

interface Message {
  id: string;
  sender: "g" | "user";
  text: string;
}

export function GExperience() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "g",
      text: "I’m G. Tell me what you’re trying to do with a Wichita property or investment. Give me the facts and numbers you already know; I’ll separate what is known from what still needs to be verified.",
    },
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeActionNotice, setActiveActionNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [briefing, setBriefing] = useState<IOCGStrategyBrief | null>(null);
  const [sessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const bookingProvider = getActiveBookingProvider();

  const scrollToChatBottom = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 1 || isTyping) scrollToChatBottom();
  }, [messages, isTyping]);

  const starterPrompts = [
    "I have $50k available. What should I think through before choosing a strategy?",
    "ARV $300k, rehab $55k. Show me the 70% screen.",
    "What should I verify before buying in College Hill?",
    "My family has an inherited house in Wichita we may sell.",
    "How should I think about reserves on a flip?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal("");
    setIsTyping(true);

    try {
      let replyText = "";
      let actionInvocation: IGActionInvocation | undefined;
      let generatedBrief: IOCGStrategyBrief | undefined;

      try {
        const res = await fetch("/api/g/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message: query,
            history: messages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          replyText = data.replyText;
          actionInvocation = data.action;
          generatedBrief = data.strategyBrief;
        }
      } catch (networkErr) {
        console.warn("G gateway unavailable; using conservative local fallback:", networkErr);
      }

      if (!replyText) {
        const localResponse = processGDialogue(query, messages);
        replyText = localResponse.messageText;
        actionInvocation = localResponse.action;
        generatedBrief = localResponse.generatedBrief;
      }

      if (actionInvocation) {
        const execResult = GActionRegistry.execute(actionInvocation);
        if (execResult.message) {
          setActiveActionNotice(execResult.message);
          setTimeout(() => setActiveActionNotice(null), 5000);
        }
      }

      if (generatedBrief) {
        setBriefing(generatedBrief);
        await persistStrategyBrief(generatedBrief);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "g",
          text: replyText,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyBriefJson = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(JSON.stringify(briefing, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="g" className="relative overflow-hidden border-y border-slate-800 bg-[#070A0F] py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.15),transparent_40%)]" />

      <div className="container relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <Bot size={15} /> G — OCG Real Estate Intelligence
          </div>
          <h2 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
            Start with the question.<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">Get to the decision that matters.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 md:text-base">
            G works from OCG’s real-estate frameworks and the information available in your conversation. It can explain strategy, run deterministic math from stated assumptions, identify missing inputs, and move you into the right OCG path without pretending unverified property or market data is known.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-left text-xs text-slate-300 transition-all hover:border-blue-500/40 hover:bg-slate-900 hover:text-white"
            >
              “{prompt}”
            </button>
          ))}
        </div>

        {activeActionNotice && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/60 px-4 py-2 text-xs text-blue-200 shadow-lg">
            <Sparkles size={14} className="text-blue-400" />
            <span>{activeActionNotice}</span>
          </div>
        )}

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="flex h-[580px] flex-col rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl md:p-7">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-600/20 text-blue-400">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    G <span className="rounded border border-blue-800/40 bg-blue-950/80 px-2 py-0.5 font-mono text-[10px] uppercase text-blue-400">OCG</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Real-estate questions, assumptions, and decision support</div>
                </div>
              </div>
            </div>

            <div ref={chatScrollContainerRef} className="flex-1 space-y-4 overflow-y-auto py-5 pr-2">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.sender === "g" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-800/40 bg-blue-950 text-xs font-bold text-blue-400">G</div>
                  )}
                  <div className={`max-w-[82%] whitespace-pre-line rounded-2xl p-4 text-xs leading-relaxed md:text-sm ${m.sender === "user" ? "rounded-tr-none bg-blue-600 font-medium text-white shadow-md" : "rounded-tl-none border border-slate-800/80 bg-slate-900/90 text-slate-200"}`}>
                    {m.text}
                  </div>
                  {m.sender === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-300"><User size={14} /></div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs italic text-slate-400">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-950 text-blue-400"><Bot size={14} /></div>
                  <span>G is checking the information, assumptions, and missing inputs…</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-4"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about a property, strategy, financing assumption, or sale…"
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none md:text-sm"
              />
              <button type="submit" disabled={!inputVal.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-950 transition-all hover:bg-blue-500 disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>
          </div>

          <div className="space-y-5">
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400"><FileText size={14} /> OCG Strategy Brief</span>
                {briefing && (
                  <button onClick={copyBriefJson} className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-400 transition-all hover:text-white">
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>

              {briefing ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Investor Stage</span>
                    <span className="flex items-center gap-1 text-right font-semibold text-white">{briefing.clientContext.investorStage.value}<span className="rounded border border-blue-900 bg-blue-950/80 px-1.5 py-0.5 font-mono text-[9px] text-blue-400">{briefing.clientContext.investorStage.certainty}</span></span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Stated Liquidity</span>
                    <span className="flex items-center gap-1 text-right font-semibold text-emerald-400">{briefing.clientContext.availableLiquidityTier.value}<span className="rounded border border-emerald-900/60 bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400/80">{briefing.clientContext.availableLiquidityTier.certainty}</span></span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Strategy Fit</span>
                    <span className="flex items-center gap-1 text-right font-semibold text-blue-300">{briefing.strategyExploration.primaryFit.value}<span className="rounded border border-blue-900 bg-blue-950/80 px-1.5 py-0.5 font-mono text-[9px] text-blue-400">{briefing.strategyExploration.primaryFit.certainty}</span></span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Timeline</span>
                    <span className="text-right text-slate-200">{briefing.strategyExploration.timeline.value}</span>
                  </div>
                  <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-900 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Summary</span>
                    <p className="text-[11px] leading-relaxed text-slate-300">{briefing.executiveIntelligence.gConversationSummary}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500"><CheckCircle2 size={12} className="text-blue-400" /> Draft brief created from this conversation</div>
                </div>
              ) : (
                <div className="space-y-2 py-8 text-center text-slate-500">
                  <Bot size={28} className="mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs leading-relaxed">When you provide enough real inputs, G can organize them into a draft OCG strategy brief without filling missing financial facts with guesses.</p>
                </div>
              )}

              <div className="pt-2">
                <Link href={bookingProvider.getBookingUrl(briefing || undefined)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-950 transition-all hover:from-blue-500 hover:to-indigo-500">
                  Book OCG Strategy Session <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck size={14} className="mr-1 inline text-blue-400" />
              <strong>Decision boundary:</strong> G can explain frameworks and calculations from stated assumptions, but it does not replace property verification, lender underwriting, legal/tax professionals, title review, contractor inspection, or a certified appraisal.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
