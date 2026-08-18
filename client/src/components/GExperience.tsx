import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Mic, ArrowRight, ShieldCheck, FileText, CheckCircle2, User, Copy, Check, Info } from "lucide-react";
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

export default function GExperience() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "g",
      text: "I am G — OCG's Investment Intelligence. Whether you're exploring your first flip, building a Wichita rental portfolio with BRRRR, assessing a neighborhood like College Hill or Crown Heights, or deciding how to allocate capital safely, tell me what you're trying to accomplish.",
    },
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<boolean>(false);
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
    if (messages.length > 1 || isTyping) {
      scrollToChatBottom();
    }
  }, [messages, isTyping]);

  const starterPrompts = [
    "I have $50k but I'm not sure which strategy fits me.",
    "Show me how the 70% rule works on a $300k Wichita flip.",
    "Tell me about investing in College Hill vs Crown Heights.",
    "My family has an inherited house in Wichita we need to sell.",
    "How does OCG preserve investor liquidity on flips?"
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
      // 1. Attempt Server-Side G Intelligence Gateway
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
        console.warn("Gateway endpoint unreachable, using local intelligence engine fallback:", networkErr);
      }

      // 2. Local Fallback if Gateway did not respond
      if (!replyText) {
        const localResponse = processGDialogue(query, messages);
        replyText = localResponse.messageText;
        if (localResponse.action) {
          actionInvocation = localResponse.action;
        }
        if (localResponse.generatedBrief) {
          generatedBrief = localResponse.generatedBrief;
        }
      }

      // 3. Execute Tool Action via Registry
      if (actionInvocation) {
        const execResult = GActionRegistry.execute(actionInvocation);
        if (execResult.message) {
          setActiveActionNotice(execResult.message);
          setTimeout(() => setActiveActionNotice(null), 5000);
        }
      }

      // 4. Update and Persist Strategy Brief
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
    <section id="g" className="relative overflow-hidden bg-[#070A0F] py-24 md:py-32 border-y border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.15),transparent_40%)] pointer-events-none" />

      <div className="container relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <Bot size={15} /> G — OCG Investment Intelligence
          </div>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
            Not a chatbot.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              An intelligent gateway into OCG.
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-slate-400 leading-relaxed">
            G is trained across OCG's financing philosophy, Wichita housing stock, 70% rule underwriting, and investor diagnostics. Ask a question, explore a scenario, or generate a canonical OCG Strategy Brief.
          </p>
        </div>

        {/* Starter Prompts Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {starterPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-300 hover:border-blue-500/40 hover:bg-slate-900 hover:text-white transition-all text-left"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Website Action Trigger Banner (when tool is executed) */}
        {activeActionNotice && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/60 px-4 py-2 text-xs text-blue-200 shadow-lg animate-pulse">
            <Sparkles size={14} className="text-blue-400" />
            <span><strong>G Action Executed:</strong> {activeActionNotice}</span>
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-start">
          {/* Conversational Terminal */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 md:p-7 shadow-2xl flex flex-col h-[580px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    G <span className="text-[10px] uppercase font-mono text-blue-400 px-2 py-0.5 bg-blue-950/80 rounded border border-blue-800/40">OCG Gateway Core</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Context-Aware Real Estate & Underwriting System</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVoiceNotice(!voiceNotice)}
                  title="Voice capability preview status"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Mic size={13} className="text-slate-500" />
                  <span>Voice (Preview Staging)</span>
                </button>
              </div>
            </div>

            {/* Voice Notice Banner (when clicked) */}
            {voiceNotice && (
              <div className="my-2 rounded-xl border border-blue-500/30 bg-blue-950/40 p-3 text-[11px] text-blue-200 flex items-center justify-between">
                <span>
                  <strong>Staging Notice:</strong> Provider-agnostic streaming voice architecture (STT/TTS) is specified in documentation. Full interactive text intelligence and website-action dispatching are operational below.
                </span>
                <button onClick={() => setVoiceNotice(false)} className="text-blue-400 font-bold ml-2">✕</button>
              </div>
            )}

            {/* Chat Thread */}
            <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto py-5 space-y-4 pr-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "g" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-950 border border-blue-800/40 text-blue-400 text-xs font-bold">
                      G
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed whitespace-pre-line ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none font-medium shadow-md"
                        : "bg-slate-900/90 text-slate-200 border border-slate-800/80 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 text-xs">
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-950 text-blue-400">
                    <Bot size={14} />
                  </div>
                  <span>G Gateway is reasoning across OCG underwriting models and Wichita intelligence...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
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
                placeholder="Ask about 70% rule, Wichita neighborhoods, capital allocation, or selling..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs md:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-all shadow-md shadow-blue-950"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Canonical OCG Strategy Brief with Certainty Badges */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <FileText size={14} /> OCG Strategy Brief
                </span>
                {briefing && (
                  <button
                    onClick={copyBriefJson}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition-all"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? "Copied JSON" : "Copy Brief"}</span>
                  </button>
                )}
              </div>

              {briefing ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Investor Stage</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      {briefing.clientContext.investorStage.value}
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900">
                        {briefing.clientContext.investorStage.certainty}
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Available Liquidity</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      {briefing.clientContext.availableLiquidityTier.value}
                      <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">
                        {briefing.clientContext.availableLiquidityTier.certainty}
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Strategy Fit</span>
                    <span className="font-semibold text-blue-300 flex items-center gap-1">
                      {briefing.strategyExploration.primaryFit.value}
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900">
                        {briefing.strategyExploration.primaryFit.certainty}
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Timeline</span>
                    <span className="text-slate-200">{briefing.strategyExploration.timeline.value}</span>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 space-y-1">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Executive Summary</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {briefing.executiveIntelligence.gConversationSummary}
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-blue-400" />
                    Structured Brief Persisted (ID: {briefing.id.slice(0, 14)}...)
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Bot size={28} className="mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs leading-relaxed">
                    Chat with G to generate an executive **OCG Strategy Brief** structured for our acquisition and underwriting team.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={bookingProvider.getBookingUrl(briefing || undefined)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-950"
                >
                  Book Your OCG Strategy Session <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-[11px] text-slate-500 leading-relaxed">
              <ShieldCheck size={14} className="text-blue-400 inline mr-1" />
              <strong>Professional Boundary Notice:</strong> G provides educational frameworks, property intelligence, and strategy exploration. G does not issue loan approvals, legal counsel, or certified appraisals. All transactions are reviewed and executed by OCG human leadership.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
