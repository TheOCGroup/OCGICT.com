import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Mic, MicOff, ArrowRight, ShieldCheck, HelpCircle, FileText, CheckCircle2, User, RefreshCw, Layers } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  sender: "g" | "user";
  text: string;
  actionTag?: string;
  actionPayload?: any;
}

interface StructuredBriefing {
  investorStage: string;
  availableLiquidity: string;
  preferredStrategy: string;
  timeline: string;
  riskConsideration: string;
  summary: string;
}

export default function GExperience() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "g",
      text: "I am G — OCG's Investment Intelligence. Whether you're exploring your first flip, building a Wichita rental portfolio with BRRRR, or deciding how to deploy available capital safely, tell me what you're trying to accomplish.",
    },
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [briefing, setBriefing] = useState<StructuredBriefing | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const starterPrompts = [
    "I have $50k but I'm not sure which strategy fits me.",
    "Explain how the 70% rule works on a Wichita flip.",
    "Compare BRRRR vs Buy & Hold for cash flow.",
    "My family has an inherited house in Wichita we need to sell.",
    "How does OCG preserve investor liquidity on flips?"
  ];

  const handleSendMessage = (textToSend?: string) => {
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

    // Intelligent context-aware reasoning engine
    setTimeout(() => {
      let gResponse = "";
      let newBriefing: StructuredBriefing | null = null;
      const lower = query.toLowerCase();

      if (lower.includes("50k") || lower.includes("capital") || lower.includes("liquidity") || lower.includes("preserve")) {
        gResponse = "A common mistake is assuming that having $50,000 means spending $50,000 into a deal. For Fix & Flip opportunities, OCG structures lender capital for purchase and rehab when appropriate. Your $50k has higher strategic value as an emergency reserve buffer, lender confidence, and protection against timeline delays. DSCR and buy-and-hold strategies require capital differently (e.g. 20-25% down payment + closing costs).";
        newBriefing = {
          investorStage: "Active Capital / Evaluation Phase",
          availableLiquidity: "$50,000 Liquid Reserves",
          preferredStrategy: "Fix & Flip (Lender-Funded) or BRRRR Exploration",
          timeline: "30 - 90 Days",
          riskConsideration: "Preserve liquidity as contingency buffer against material/holding overruns.",
          summary: "Prospect has $50k available capital. Guided on OCG capital preservation philosophy (using lender debt for rehab/acquisition, keeping liquid capital as reserves)."
        };
      } else if (lower.includes("70%") || lower.includes("rule") || lower.includes("mao")) {
        gResponse = "The 70% Rule is an underwriting framework: MAO = (ARV × 70%) − Rehab. For instance, on a $240,000 Wichita ARV with a $45,000 rehab scope, your MAO is $123,000. That 30% gross margin buffer protects against holding interest, closing costs, and price adjustments. It is a decision guide, not a lender guarantee.";
      } else if (lower.includes("brrrr") || lower.includes("flip") || lower.includes("compare") || lower.includes("hold")) {
        gResponse = "Here is how to think about the distinction: Fix & Flip generates lump-sum capital and teaches transaction execution, but incurs short-term capital gains. BRRRR recycles that basis by refinancing into long-term DSCR debt once stabilized. If you're building capital first, a flip is often the pragmatic initial step. If you already have established capital, BRRRR or direct Buy & Hold builds long-term wealth.";
        newBriefing = {
          investorStage: "Strategy Exploration",
          availableLiquidity: "Undisclosed / Exploring Options",
          preferredStrategy: "BRRRR vs Fix & Flip Comparative Analysis",
          timeline: "60 - 180 Days",
          riskConsideration: "Refinance seasoning rules and DSCR debt service coverage thresholds in Wichita.",
          summary: "Prospect exploring trade-offs between cash creation (Flips) vs equity recycling (BRRRR)."
        };
      } else if (lower.includes("sell") || lower.includes("inherited") || lower.includes("mother") || lower.includes("house")) {
        gResponse = "I understand. Inherited properties and off-market transitions require a respectful, non-rushed approach. OCG reviews property condition, Sedgwick County public records, needed repairs, and your timeline to give you a clear, transparent assessment without high-pressure wholesaler tactics.";
        newBriefing = {
          investorStage: "Property Seller / Disposition",
          availableLiquidity: "N/A (Property Owner)",
          preferredStrategy: "Direct Acquisition / Preliminary Property Review",
          timeline: "Flexible / As Needed",
          riskConsideration: "Inherited estate timeline and condition scoping.",
          summary: "Homeowner or heir seeking transparent property evaluation without wholesaler games."
        };
      } else {
        gResponse = `Based on what you're asking about "${query}", OCG's methodology focuses on disciplined underwriting, micro-market comps in Wichita, and strategic renovation design. We believe technology should compress the tedious tasks so you and our team can focus on making high-conviction decisions.`;
      }

      // If we have enough context, guide toward human strategy session
      if (newBriefing) {
        setBriefing(newBriefing);
        gResponse += "\n\nI have generated a structured briefing of your situation. Rather than spending 45 minutes chatting with AI, the best next step is to schedule an OCG Strategy Session so Genaro and our team can review your specific opportunities.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "g",
          text: gResponse,
        },
      ]);
      setIsTyping(false);
    }, 850);
  };

  return (
    <section id="g" className="relative overflow-hidden bg-[#070A0F] py-24 md:py-32 border-y border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.15),transparent_40%)]" />

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
            G is trained across OCG's financing philosophy, Wichita housing stock, 70% rule underwriting, and investor diagnostics. Ask a question, explore a scenario, or start a preliminary property review.
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-start">
          {/* Conversational Terminal */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 md:p-7 shadow-2xl flex flex-col h-[560px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    G <span className="text-[10px] uppercase font-mono text-blue-400 px-2 py-0.5 bg-blue-950/80 rounded border border-blue-800/40">OCG Intelligence Core</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Context-Aware Real Estate Advisor</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  title={isVoiceActive ? "Mute Voice Engine" : "Enable Voice Simulation"}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                    isVoiceActive
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isVoiceActive ? <Mic size={14} /> : <MicOff size={14} />}
                  <span className="hidden sm:inline">{isVoiceActive ? "Voice Active" : "Voice Ready"}</span>
                </button>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-2">
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
                  <span>G is reasoning across OCG frameworks...</span>
                </div>
              )}
              <div ref={chatEndRef} />
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

          {/* Structured Briefing & Human Strategy Handoff */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <FileText size={14} /> Structured Handoff Briefing
                </span>
                <span className="text-[10px] font-mono text-slate-500">Live Intake</span>
              </div>

              {briefing ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Investor Classification</span>
                    <div className="font-semibold text-white">{briefing.investorStage}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Available Liquidity</span>
                    <div className="font-semibold text-emerald-400">{briefing.availableLiquidity}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Strategy Alignment</span>
                    <div className="font-semibold text-blue-300">{briefing.preferredStrategy}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Risk Note</span>
                    <div className="text-slate-300">{briefing.riskConsideration}</div>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Executive Summary</span>
                    <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">{briefing.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Bot size={28} className="mx-auto text-slate-600 opacity-60" />
                  <p className="text-xs">
                    Engage with G to automatically generate an executive strategy dossier for your appointment with Genaro and the OCG team.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-950"
                >
                  Book Your OCG Strategy Session <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-[11px] text-slate-500 leading-relaxed">
              <ShieldCheck size={14} className="text-blue-400 inline mr-1" />
              <strong>Professional Boundary Notice:</strong> G provides educational frameworks, property intelligence, and strategy exploration. G does not issue loan approvals, legal counsel, or certified structural appraisals. All transactions are reviewed and executed by OCG human leadership.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
