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

export function GExperience({ embedded = false, active = true }: { embedded?: boolean; active?: boolean } = {}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "g",
      text: "Hi, I'm G, The OC Group's AI guide. I can help you explore selling a property, plan an investment, understand renovation and financing, or simply learn what we do. What can I help you with today?",
    },
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [includeConversation, setIncludeConversation] = useState(false);
  const lastInquiry = [...messages].reverse().find(m => m.sender === "user")?.text?.trim() || "";
  const emailSubject = "OCG website conversation follow-up";
  const conversationSummary = messages.slice(1).slice(-12)
    .map(m => `${m.sender === "user" ? "Visitor" : "G"}: ${m.text}`).join("\n\n");
  const emailBody = includeConversation && conversationSummary
    ? `Hello OCG,\n\nI'd like someone to follow up with me. I've included part of my conversation with G below.\n\nName:\nPreferred contact method:\n\nConversation:\n${conversationSummary}\n\nPlease review and contact me.\n`
    : `Hello OCG,\n\nI'd like someone to contact me.\n\nName:\nPreferred contact method:\nReason for inquiry: ${lastInquiry.slice(0, 600)}\n`;
  const emailHref = `mailto:theocgroupict@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<boolean>(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Voice is off');
  const recognitionRef = useRef<any>(null);
  const voiceEnabledRef = useRef(false);
  const activeSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSessionRef = useRef(0);
  const requestPendingRef = useRef(false);
  const [activeActionNotice, setActiveActionNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [briefing, setBriefing] = useState<IOCGStrategyBrief | null>(null);
  const [sessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const bookingProvider = getActiveBookingProvider();

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!active) {
      voiceSessionRef.current += 1;
      voiceEnabledRef.current = false;
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      window.speechSynthesis?.cancel();
      activeSpeechRef.current = null;
      setListening(false);
      setVoiceStatus("Voice paused");
    }
  }, [active]);

  const stopVoice = () => {
    voiceSessionRef.current += 1;
    voiceEnabledRef.current = false;
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel();
    activeSpeechRef.current = null;
    recognitionRef.current = null;
    setListening(false);
    setVoiceStatus("Voice stopped");
  };

  const speakReply = (text: string) => {
    if (!voiceEnabledRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const session = voiceSessionRef.current;
    const speech = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, 'a link').replace(/[*_#`]/g, ''));
    speech.lang = "en-US";
    speech.rate = 1.05;
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("en") && /natural|neural/i.test(v.name));
    if (voice) speech.voice = voice;
    speech.onstart = () => setVoiceStatus("G is speaking — tap Talk to interrupt");
    activeSpeechRef.current = speech;
    speech.onend = () => {
      if (activeSpeechRef.current !== speech || !voiceEnabledRef.current || voiceSessionRef.current !== session) return;
      activeSpeechRef.current = null;
      setVoiceStatus("G finished. Listening for your next question...");
      startListening();
    };
    speech.onerror = () => {
      if (activeSpeechRef.current === speech) {
        activeSpeechRef.current = null;
        setVoiceStatus("Speech playback unavailable. Tap Talk to G to continue.");
      }
    };
    window.speechSynthesis.speak(speech);
  };

  const startListening = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus("Voice recognition is not supported here. Try Chrome or Edge.");
      return;
    }
    voiceSessionRef.current += 1;
    const session = voiceSessionRef.current;
    activeSpeechRef.current = null;
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort?.();
    voiceEnabledRef.current = true;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { if (voiceSessionRef.current !== session) return; setListening(true); setVoiceStatus("Listening — speak now"); };
    recognition.onend = () => { if (recognitionRef.current === recognition && voiceSessionRef.current === session) setListening(false); };
    recognition.onerror = (error: any) => {
      if (recognitionRef.current !== recognition || voiceSessionRef.current !== session) return;
      setListening(false);
      if (error.error === "not-allowed" || error.error === "service-not-allowed") {
        voiceEnabledRef.current = false;
        setVoiceStatus("Please allow microphone access. Tap Talk to G to retry.");
      } else {
        setVoiceStatus("Could not hear you. Tap Talk to G to try again.");
      }
    };
    recognition.onresult = (event: any) => {
      if (recognitionRef.current !== recognition || !voiceEnabledRef.current || voiceSessionRef.current !== session) return;
      const spoken = event.results?.[0]?.[0]?.transcript?.trim();
      setListening(false);
      if (spoken) void handleSendMessage(spoken);
    };
    try { recognition.start(); } catch { voiceEnabledRef.current = false; setVoiceStatus("Microphone unavailable. Tap Talk to G to retry."); }
  };

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
    "I want help selling a property.",
    "I want to evaluate an investment property.",
    "Tell me how The OC Group can help me."
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputVal;
    if (!query.trim() || query.length > 4000 || requestPendingRef.current) return;
    requestPendingRef.current = true;

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
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        let res: Response;
        try {
          res = await fetch("/api/g/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              sessionId,
              message: query,
              history: messages.slice(-16).map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text.slice(0, 4000),
              })),
            }),
          });
        } finally {
          clearTimeout(timeout);
        }
        if (!res.ok) {
          throw new Error(res.status === 429 ? "Too many messages. Please try again shortly." : "G is temporarily unavailable. Please try again.");
        }
        const data = await res.json();
        if (typeof data.replyText !== "string" || !data.replyText.trim()) {
          throw new Error("G did not return a usable response. Please try again.");
        }
        replyText = data.replyText;
        actionInvocation = data.action;
        generatedBrief = data.strategyBrief;
      } catch (gatewayError) {
        // Do not silently generate a fabricated financial analysis or claim a request was submitted.
        replyText = gatewayError instanceof Error && /Too many messages/.test(gatewayError.message)
          ? gatewayError.message
          : "I'm having trouble connecting right now. Please try again, or use the Sell or Contact page to reach The OC Group.";
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
      speakReply(replyText);
    } finally {
      requestPendingRef.current = false;
      setIsTyping(false);
    }
  };

  const copyBriefJson = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(JSON.stringify(briefing, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-[#090e19] text-slate-100">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" ref={chatScrollContainerRef} role="log" aria-label="Conversation with G" aria-live="polite">
          {messages.length === 1 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 pb-8 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/15 blur-xl" />
                <div className="relative h-12 w-12 rounded-full border border-sky-300/40 bg-[radial-gradient(circle_at_30%_25%,#bce9ff_0%,#5d9bf9_22%,#283eae_55%,#070d2b_100%)] shadow-[0_0_30px_rgba(70,145,255,.35)]" />
              </div>
              <p className="text-sm font-medium text-slate-300">What can I help you with?</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Sell a property", "Explore an investment", "About OCG"].map((label, i) => (
                  <button key={label} onClick={() => handleSendMessage(starterPrompts[i])} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:border-sky-400/50 hover:bg-white/10">{label}</button>
                ))}
              </div>
            </div>
          )}
          {messages.length > 1 && messages.slice(1).map(m => (
            <div key={m.id} className={m.sender === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={m.sender === "user" ? "max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-blue-600/90 px-4 py-3 text-sm leading-relaxed text-white" : "max-w-[95%] whitespace-pre-wrap px-1 py-2 text-sm leading-relaxed text-slate-200"}>{m.text}</div>
            </div>
          ))}
          {isTyping && <div className="px-1 text-xs text-sky-300" role="status">G is responding…</div>}
        </div>
        {activeActionNotice && <div className="px-5 py-2 text-xs text-sky-200" role="status">{activeActionNotice}</div>}
        <div className="shrink-0 border-t border-white/10 bg-[#0c1423] px-3 pb-3 pt-3">
          <form onSubmit={e => { e.preventDefault(); void handleSendMessage(); }} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#162136] p-2 focus-within:border-sky-400/60">
            <button type="button" onClick={listening ? stopVoice : startListening} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${listening ? "bg-sky-500 text-white animate-pulse" : "text-sky-200 hover:bg-white/10"}`} aria-label={listening ? "Stop listening" : "Talk to G"} title={listening ? "Stop listening" : "Talk to G"}><Mic size={18} /></button>
            <input value={inputVal} onChange={e => setInputVal(e.target.value)} maxLength={4000} aria-label="Message G" placeholder="Message G..." className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-slate-400" />
            <button type="submit" disabled={!inputVal.trim() || isTyping} aria-label="Send message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-35"><Send size={17}/></button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
            <span role="status" className="truncate">{listening ? "Listening…" : voiceStatus === "Voice paused" || voiceStatus === "Voice is off" ? "Voice available" : voiceStatus}</span>
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" onClick={stopVoice} className="hover:text-white">Mute</button>
              <a href={emailHref} className="text-sky-300 hover:text-sky-100">Contact OCG</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section id={embedded ? undefined : "g"} className={embedded ? "relative overflow-hidden bg-[#070A0F] py-5" : "relative overflow-hidden bg-[#070A0F] py-24 md:py-32 border-y border-slate-800"}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.15),transparent_40%)] pointer-events-none" />

      <div className="container relative z-10">
        <div className={embedded ? "hidden" : "max-w-3xl"}>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <Bot size={15} /> G — OCG Investment Intelligence
          </div>
          <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
            Meet G.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              Your guide to what comes next.
            </span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-slate-400 leading-relaxed">
            Ask G about selling, investing, renovations, financing coordination, or how The OC Group works. Get practical guidance, explore options, and find the right next step.
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

        <div className={embedded ? "mt-4 grid gap-5 lg:grid-cols-[1.3fr_0.7fr] items-start" : "mt-6 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-start"}>
          {/* G interactive agent console */}
          <div className="rounded-[2rem] border border-blue-400/30 bg-gradient-to-b from-[#13284a] via-[#0b1e37] to-[#071426] p-5 md:p-7 shadow-2xl shadow-blue-950/50 flex flex-col min-h-[580px]">
            <div className="mb-5 flex flex-col items-center gap-3 rounded-[1.7rem] border border-blue-300/20 bg-gradient-to-br from-blue-600/20 via-sky-400/10 to-transparent px-5 py-6 text-center">
              <button type="button" onClick={listening ? stopVoice : startListening} aria-label="Activate G voice" className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-sky-300/70 bg-gradient-to-br from-blue-400 via-blue-600 to-[#052355] shadow-[0_0_45px_rgba(59,130,246,0.45)] transition-transform hover:scale-105 ${listening ? "animate-pulse" : ""}`}>
                <span className="absolute inset-2 rounded-full border border-white/30" />
                <span className="relative text-5xl font-black tracking-tight text-white drop-shadow-lg">G</span>
              </button>
              <div className="text-lg font-bold text-white">Let's figure it out together.</div>
              <p className="max-w-sm text-sm leading-relaxed text-blue-100/80">Selling a home? Exploring your next investment? Just curious? I'm here to help.</p>
              <div className="text-xs font-semibold uppercase tracking-widest text-sky-300">{listening ? "Listening to you" : isTyping ? "Thinking through your question" : "Tap G to speak"}</div>
            </div>
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
                <button type="button" onClick={startListening} title="Talk to G and interrupt speech" className="flex items-center gap-2 rounded-lg bg-blue-600 border border-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                  <Mic size={15} /><span>{listening ? "Listening…" : "Talk to G"}</span>
                </button>
                <button type="button" onClick={stopVoice} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-white hover:bg-slate-700">Stop voice</button>
              </div>
            </div>

            {/* Voice Notice Banner (when clicked) */}
            {voiceNotice && (
              <div className="my-2 rounded-xl border border-blue-500/30 bg-blue-950/40 p-3 text-[11px] text-blue-200 flex items-center justify-between">
                <span>
                  <strong>Browser voice:</strong> Tap Talk to G and allow microphone access. G will speak replies using available browser voices. Tap Talk again to interrupt. Chrome or Edge recommended.
                </span>
                <button onClick={() => setVoiceNotice(false)} className="text-blue-400 font-bold ml-2">✕</button>
              </div>
            )}

            <div role="status" aria-live="polite" className="mt-2 text-xs text-blue-300">{voiceStatus}</div>
            {/* Conversation activity */}
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
                  <span>G is working on your answer...</span>
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
                placeholder="Tell G what you need, or tap the microphone..."
                maxLength={4000}
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
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-blue-200/10 pt-4">
              <span className="mr-1 text-xs font-medium text-blue-100/70">Want a person to follow up?</span>
              <a href={emailHref} className="rounded-full border border-sky-400/50 bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/30">Email The OC Group</a>
              <Link href="/sell" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">Selling a property</Link>
              <Link href="/contact" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">Investor or general inquiry</Link>
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs text-blue-100/80">
              <input type="checkbox" checked={includeConversation} onChange={e => setIncludeConversation(e.target.checked)} className="mt-0.5 accent-blue-400" />
              Include the last 12 conversation messages in my email (review before sending)
            </label>
            <p className="mt-2 text-[11px] text-blue-100/60">Your most recent question is included in the email draft, so you don't have to repeat it. Nothing is automatically sent to OCG; review before sending.</p>
          </div>

          {/* Canonical OCG Strategy Brief with Certainty Badges */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <FileText size={14} /> Your next steps
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    POWERED BY OCG LAB
                  </span>
                </div>
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
