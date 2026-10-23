import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Mic, MicOff, PhoneOff, ArrowRight, ShieldCheck, FileText, CheckCircle2, User, Copy, Check, Info } from "lucide-react";
import { Link } from "wouter";
import { GActionRegistry } from "@/intelligence/actionRegistry";
import { processGDialogue } from "@/intelligence/gActionDispatcher";
import { persistStrategyBrief } from "@/lib/persistence";
import { getActiveBookingProvider } from "@/lib/booking";
import { GRealtimeVoice, fetchVoiceConfig, type GRealtimeState, type VoiceConfig } from "@/voice/gRealtimeVoice";
import { GKokoroSpeech } from "@/voice/gKokoroSpeech";
import { browserVoiceFlagEnabled } from "@/voice/browser/browserVoiceFlag";
import type { GBrowserSpeech } from "@/voice/browser/gBrowserSpeech";
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
  const [voiceDiag, setVoiceDiag] = useState('');
  const recognitionRef = useRef<any>(null);
  const voiceEnabledRef = useRef(false);
  const activeSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceSessionRef = useRef(0);
  const requestPendingRef = useRef(false);
  const voiceLocaleRef = useRef("en-US");
  const [activeActionNotice, setActiveActionNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [briefing, setBriefing] = useState<IOCGStrategyBrief | null>(null);
  const [sessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const bookingProvider = getActiveBookingProvider();

  // ── Realtime voice (Vapi Web) ──────────────────────────────────────────
  // Realtime is the primary voice when the server enables it; the browser
  // speech path below remains as a clearly labeled basic fallback.
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [rtState, setRtState] = useState<GRealtimeState>("idle");
  const [rtDetail, setRtDetail] = useState<string>("");
  const [rtMuted, setRtMuted] = useState(false);
  const [useFallbackVoice, setUseFallbackVoice] = useState(false);
  const rtRef = useRef<GRealtimeVoice | null>(null);
  const realtimeAvailable = !!voiceConfig?.enabled && !useFallbackVoice;

  // ── Kokoro speech (shared self-hosted TTS) ────────────────────────────
  // When the server enables it, spoken replies come from OCG's own Kokoro
  // service instead of the browser's built-in speech. Probed once; any
  // failure falls back per-reply to the labeled basic browser voice.
  const [kokoroAvailable, setKokoroAvailable] = useState(false);
  const kokoroRef = useRef<GKokoroSpeech | null>(null);
  // OCG Voice Runtime (browser inference) — prototype, flag-gated only.
  const browserSpeechRef = useRef<GBrowserSpeech | null>(null);
  const browserVoiceOn = browserVoiceFlagEnabled();
  const [browserVoiceState, setBrowserVoiceState] = useState<"idle" | "preparing" | "ready">("idle");
  const browserReadyRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    GKokoroSpeech.probe(controller.signal).then(setKokoroAvailable).catch(() => setKokoroAvailable(false));
    return () => controller.abort();
  }, []);

  const stopAllSpeech = () => {
    disarmBargeIn();
    window.speechSynthesis?.cancel();
    activeSpeechRef.current = null;
    kokoroRef.current?.stop();
    browserSpeechRef.current?.stop();
  };

  /* ---- Voice barge-in (Seller Trust Engine P0) --------------------
   * A mic monitor watches ONLY while G is speaking. When it confirms
   * the visitor is talking, playback stops through the same path as
   * the Stop button and recognition opens so the interruption is
   * heard. If the mic is unavailable, nothing else changes. */
  const bargeInRef = useRef<import("@/voice/browser/bargeIn").BargeInMonitor | null>(null);
  const armBargeIn = () => { bargeInRef.current?.arm(); };
  const disarmBargeIn = () => { bargeInRef.current?.disarm(); };
  const speakingStatus = () =>
    bargeInRef.current?.hasMic
      ? "G is speaking — just start talking to interrupt"
      : "G is speaking — tap Talk to interrupt";
  const handleBargeInInterrupt = () => {
    if (!voiceEnabledRef.current) return;
    disarmBargeIn();
    stopAllSpeech();
    setVoiceStatus("I heard you — go ahead, I'm listening");
    if (new URLSearchParams(window.location.search).has("bargeInDebug")) {
      const w = window as unknown as { __ocgBargeInLog?: Array<{ atMs: number }> };
      w.__ocgBargeInLog = [...(w.__ocgBargeInLog ?? []), { atMs: performance.now() }];
    }
    startListening();
  };
  const ensureBargeIn = async () => {
    if (bargeInRef.current) return;
    try {
      const mod = await import("@/voice/browser/bargeIn");
      if (bargeInRef.current) return;
      const monitor = new mod.BargeInMonitor({
        onInterrupt: () => handleBargeInInterrupt(),
        playbackLevel: () => browserSpeechRef.current?.getOutputLevel() ?? 0,
      });
      bargeInRef.current = monitor;
      await monitor.start();
    } catch {
      /* Barge-in unavailable on this device/browser; manual stop and
         tap-to-talk continue to work exactly as before. */
    }
  };
  const rtActive = rtState === "connecting" || rtState === "listening" || rtState === "thinking" || rtState === "speaking";

  useEffect(() => {
    const controller = new AbortController();
    fetchVoiceConfig(controller.signal)
      .then(setVoiceConfig)
      .catch(() => setVoiceConfig({ enabled: false, mode: "browser-fallback", reason: "Voice status unavailable." }));
    return () => controller.abort();
  }, []);

  const startRealtimeVoice = async () => {
    stopVoice();
    if (!rtRef.current) rtRef.current = new GRealtimeVoice();
    try {
      await rtRef.current.start({
        onState: (state, detail) => {
          setRtState(state);
          if (detail) setRtDetail(detail);
          if (state === "ended") setRtDetail("Voice conversation ended. Text chat is ready.");
        },
        onTranscript: (role, text) => {
          setMessages((prev) => [
            ...prev,
            { id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender: role === "user" ? "user" : "g", text },
          ]);
        },
        onPartialTranscript: (text) => setRtDetail(text),
      });
    } catch {
      // onState("error") already surfaced the reason; offer the fallback.
    }
  };

  const stopRealtimeVoice = () => {
    rtRef.current?.stop();
    setRtState("ended");
    setRtDetail("Voice conversation ended. Text chat is ready.");
  };

  const toggleRtMute = () => {
    const next = !rtMuted;
    setRtMuted(next);
    rtRef.current?.setMuted(next);
  };

  const rtStatusText = (): string | null => {
    if (!realtimeAvailable && !rtActive) return null;
    switch (rtState) {
      case "connecting": return "Connecting to G…";
      case "listening": return rtMuted ? "Muted — G can't hear you" : "Listening — speak now. You can interrupt G by talking.";
      case "thinking": return "G is thinking…";
      case "speaking": return "G is speaking — just start talking to interrupt";
      case "ended": return rtDetail || "Voice conversation ended. Text chat is ready.";
      case "error": return rtDetail || "Voice ran into a problem. Text chat is ready.";
      default: return null;
    }
  };

  // ── Lead follow-up card ────────────────────────────────────────────────
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadRole, setLeadRole] = useState("general");
  const [leadAddress, setLeadAddress] = useState("");
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadStatus, setLeadStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [leadReference, setLeadReference] = useState("");
  const leadReferenceRef = useRef("");

  const openLeadCard = () => {
    if (!leadReferenceRef.current) {
      leadReferenceRef.current = `G-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    setLeadStatus("idle");
    setLeadOpen(true);
  };

  const submitLead = async () => {
    if (leadStatus === "sending") return;
    setLeadStatus("sending");
    const summary = messages.slice(-12)
      .map(m => `${m.sender === "user" ? "Visitor" : "G"}: ${m.text.slice(0, 500)}`)
      .join("\n")
      .slice(0, 4000);
    try {
      const res = await fetch("/api/g/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadEmail.trim(),
          phone: leadPhone.trim(),
          role: leadRole,
          address: leadAddress.trim(),
          summary,
          consent: leadConsent,
          reference: leadReferenceRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "We could not save your request.");
      setLeadReference(data.reference || leadReferenceRef.current);
      setLeadStatus("sent");
    } catch {
      setLeadStatus("error");
    }
  };

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel();
    kokoroRef.current?.stop();
    rtRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!active) {
      voiceSessionRef.current += 1;
      voiceEnabledRef.current = false;
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      stopAllSpeech();
      bargeInRef.current?.stop();
      bargeInRef.current = null;
      rtRef.current?.stop();
      if (rtState !== "idle") setRtState("idle");
      setListening(false);
      setVoiceStatus("Voice paused");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const stopVoice = () => {
    voiceSessionRef.current += 1;
    voiceEnabledRef.current = false;
    recognitionRef.current?.abort?.();
    stopAllSpeech();
    bargeInRef.current?.stop();
    bargeInRef.current = null;
    recognitionRef.current = null;
    setListening(false);
    setVoiceStatus("Voice stopped");
  };

  // Construct the on-device voice provider once (dynamic import keeps
  // the inference library out of the default bundle). Used by the
  // speak path AND by a warmup when voice mode starts, so the one-time
  // model download overlaps the conversation instead of blocking the
  // first spoken reply (P0 repair).
  const ensureBrowserSpeech = async (): Promise<GBrowserSpeech> => {
    if (browserSpeechRef.current) return browserSpeechRef.current;
    const mod = await import("@/voice/browser/gBrowserSpeech");
    const prof = await import("@/voice/browser/deviceProfile");
    const vv = await import("@/voice/browser/voiceVariant");
    const variant = vv.resolveVoiceVariant();
    const profile = prof.selectDeviceProfile({
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGB: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
      mobileUserAgent: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
      crossOriginIsolated: (self as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated === true,
      webgpuAdapter: await prof.probeWebGPU(),
    });
    let lastShownMB = -1;
    const provider = new mod.GBrowserSpeech({
      providers: profile.providers,
      numThreads: profile.numThreads,
      assetBase: variant.assetBase,
      cacheName: variant.cacheName,
      variantLabel: variant.label,
      styleName: variant.styleName,
      onReady: (info) => {
        browserReadyRef.current = true;
        setBrowserVoiceState("ready");
        setVoiceDiag(`${info.variantLabel ?? "M1"} · ${info.providersUsed.includes("webgpu") ? "WebGPU" : "WASM"}`);
      },
      onProgress: (e) => {
        if (!voiceEnabledRef.current) return;
        if (e.phase === "init") {
          setVoiceStatus(`Preparing G's voice… (${variant.label})`);
          return;
        }
        const mb = Math.floor(e.loadedBytes / 1_000_000);
        if (mb !== lastShownMB) {
          lastShownMB = mb;
          setVoiceStatus(`Downloading G's voice model — ${variant.label} · ${mb} MB received (one-time)`);
        }
      },
    });
    browserSpeechRef.current = provider;
    setBrowserVoiceState("preparing");
    return provider;
  };

  const speakReply = (text: string, emotion?: string) => {
    // Realtime voice speaks through its own session; never double-speak.
    if (rtRef.current?.isActive) return;
    if (!voiceEnabledRef.current) return;
    stopAllSpeech();
    const session = voiceSessionRef.current;
    const clean = text.replace(/https?:\/\/\S+/g, 'a link').replace(/[*_#`]/g, '').trim();
    // Speak a concise first turn; leave full details visible in chat.
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const spoken = sentences.slice(0, 3).join(" ").trim().slice(0, 500);
    const spanishReply = /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00bf\u00a1]|\b(?:hola|gracias|usted|propiedad|inversi\u00f3n|necesita|ayudarle|quieres|puedo|podemos|buenos|buenas|vender|comprar)\b/i.test(spoken);

    // OCG Voice Runtime prototype: on-device Supertonic M1, only when
    // the explicit browserVoice flag is on. Any failure falls through to
    // the normal cascade below (server voice, then basic browser voice).
    if (browserVoiceOn) {
      setVoiceStatus("G is about to speak…");
      // Fall through for this reply only — the server/basic paths take
      // it from here, with the standard notice. Used by BOTH the
      // provider's onError and any failure around it (chunk load,
      // construction) so no failure class can strand the reply.
      const fallThrough = (reason: "error" | "preparing" = "error") => {
        if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
        const notice = reason === "preparing"
          ? "That reply used the basic browser voice while the main voice finishes preparing"
          : "That reply used the basic browser voice — the main voice had a hiccup";
        if (kokoroAvailable) {
          if (!kokoroRef.current) kokoroRef.current = new GKokoroSpeech();
          void kokoroRef.current.speak(spoken, spanishReply ? "es" : "en", {
            onStart: () => { armBargeIn(); setVoiceStatus(speakingStatus()); },
            onEnd: () => {
              disarmBargeIn();
              if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
              setVoiceStatus("Listening for your reply");
              startListening();
            },
            onError: () => {
              if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
              speakWithBrowserVoice(spoken, session, "That reply used the basic browser voice — the main voice had a hiccup");
            },
          }, { expressive: true, emotion });
        } else {
          speakWithBrowserVoice(spoken, session, notice);
        }
      };
      let started = false;
      let fellThrough = false;
      const doFallThrough = (reason: "error" | "preparing") => {
        if (fellThrough) return;
        fellThrough = true;
        fallThrough(reason);
      };
      // First-audio deadline (P0 repair): never leave the visitor in
      // silence while the on-device voice downloads or starts. If G
      // has not begun speaking within the deadline, THIS reply goes to
      // the fallback cascade with an honest notice; the engine keeps
      // preparing in the background and takes over from the next reply.
      // The deadline applies only while the engine is NOT ready: once
      // warm, synthesis is bounded by the worker-call timeouts, and a
      // slow-but-working engine must not be cut off mid-synthesis.
      const deadline = browserReadyRef.current ? null : setTimeout(() => {
        if (!started && !fellThrough) {
          browserSpeechRef.current?.stop();
          doFallThrough("preparing");
        }
      }, 15000);
      const clearDeadline = () => { if (deadline) clearDeadline(); };
      void (async () => {
        const provider = await ensureBrowserSpeech();
        if (!voiceEnabledRef.current || voiceSessionRef.current !== session) { clearDeadline(); return; }
        await provider.speak(spoken, { lang: spanishReply ? "es" : "en", emotion }, {
          onStart: () => { started = true; clearDeadline(); armBargeIn(); setVoiceStatus(speakingStatus()); },
          onEnd: () => {
            clearDeadline();
            disarmBargeIn();
            if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
            setVoiceStatus("Listening for your reply");
            startListening();
          },
          onError: () => { clearDeadline(); doFallThrough("error"); },
        });
      })().catch(() => { clearDeadline(); doFallThrough("error"); });
      return;
    }

    // Preferred spoken path: OCG's own Kokoro voice service, when the
    // server has it enabled. Any failure falls back to the basic browser
    // voice for this reply only.
    if (kokoroAvailable) {
      if (!kokoroRef.current) kokoroRef.current = new GKokoroSpeech();
      // Synthesis + fetch take a moment; never leave dead air unexplained.
      setVoiceStatus("G is about to speak…");
      void kokoroRef.current.speak(spoken, spanishReply ? "es" : "en", {
        onStart: () => { armBargeIn(); setVoiceStatus(speakingStatus()); },
        onEnd: () => {
          disarmBargeIn();
          if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
          setVoiceStatus("Listening for your reply");
          startListening();
        },
        onError: () => {
          if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
          // Never swap engines silently: the visitor is told this reply
          // is coming from the basic browser voice instead.
          speakWithBrowserVoice(spoken, session, "That reply used the basic browser voice — the main voice had a hiccup");
        },
      }, { expressive: true, emotion });
      return;
    }
    speakWithBrowserVoice(spoken, session);
  };

  const waitForVoices = (timeoutMs: number): Promise<SpeechSynthesisVoice[]> => new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial.length > 0) { resolve(initial); return; }
    let done = false;
    const finish = () => { if (done) return; done = true; resolve(synth.getVoices()); };
    const onChange = () => { synth.removeEventListener?.("voiceschanged", onChange); finish(); };
    synth.addEventListener?.("voiceschanged", onChange);
    setTimeout(finish, timeoutMs);
  });

  const speakWithBrowserVoice = (spoken: string, session: number, startNotice?: string) => {
    if (!voiceEnabledRef.current || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    void (async () => { try {
    const speech = new SpeechSynthesisUtterance(spoken);
    // Pick the output language from G's actual reply, not the user's last language.
    // Otherwise an English reply can accidentally inherit a Spanish synthesizer.
    const spanish = /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00bf\u00a1]|\b(?:hola|gracias|usted|propiedad|inversi\u00f3n|necesita|ayudarle|quieres|puedo|podemos|buenos|buenas|vender|comprar)\b/i.test(spoken);
    const locale = spanish ? "es-US" : "en-US";
    speech.lang = locale;
    speech.rate = 1.0;
    speech.pitch = 1.0;
    // Do not select an arbitrary browser voice: natural/neural does not indicate gender.
    // Browser TTS offers no reliable gender property. Permit only explicitly identified
    // male voice names; otherwise do not synthesize a potentially female voice.
    const availableVoices = await waitForVoices(1200);
    if (!voiceEnabledRef.current || voiceSessionRef.current !== session) return;
    const matching = availableVoices
      .filter(v => v.lang.toLowerCase().startsWith(locale.slice(0, 2).toLowerCase()))
      .filter(v => !/\bfemale\b|\bmujer\b/i.test(v.name));
    // Explicitly male-identified voices only: known male voice names
    // (Microsoft, macOS, Google) or a name that itself says "male".
    // Never substitute an unidentified or female-identified voice.
    const maleEnglish = /\b(?:guy|davis|andrew|brian|tony|ryan|david|james|alex|daniel|fred|aaron|tom|christopher|george|arthur|richard)\b/i;
    const maleSpanish = /\b(?:jorge|alvaro|\u00e1lvaro|diego|pablo|raul|ra\u00fal|carlos|enrique|juan|miguel|fernando)\b/i;
    const maleName = locale.startsWith("es") ? maleSpanish : maleEnglish;
    const isMale = (v: SpeechSynthesisVoice) => maleName.test(v.name) || /\bmale\b/i.test(v.name);
    const voice = matching.find(v => isMale(v)
      && v.lang.toLowerCase() === locale.toLowerCase())
      || matching.find(v => isMale(v));
    if (!voice) {
      setVoiceStatus("No identified male voice is available. Listening remains available; text chat is ready.");
      // A missing TTS voice must not terminate the hands-free listening session.
      startListening();
      return;
    }
    voiceLocaleRef.current = voice.lang;
    speech.voice = voice;
    speech.onstart = () => { armBargeIn(); setVoiceStatus(startNotice ?? speakingStatus()); };
    activeSpeechRef.current = speech;
    speech.onend = () => {
      disarmBargeIn();
      if (activeSpeechRef.current !== speech || !voiceEnabledRef.current || voiceSessionRef.current !== session) return;
      activeSpeechRef.current = null;
      // Re-arm the microphone after a completed spoken reply.
      setVoiceStatus("Listening for your reply");
      startListening();
    };
    speech.onerror = () => {
      disarmBargeIn();
      if (activeSpeechRef.current === speech) {
        activeSpeechRef.current = null;
        if (voiceEnabledRef.current && voiceSessionRef.current === session) {
          setVoiceStatus("Speech playback unavailable. Listening for your reply.");
          startListening();
        }
      }
    };
    window.speechSynthesis.speak(speech);
    } catch {
      // A platform quirk in the basic voice must never strand the
      // session in silence: surface it and keep listening.
      if (voiceEnabledRef.current && voiceSessionRef.current === session) {
        setVoiceStatus("Speech playback unavailable. Listening for your reply.");
        startListening();
      }
    } })();
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
    kokoroRef.current?.stop();
    recognitionRef.current?.abort?.();
    voiceEnabledRef.current = true;
    void ensureBargeIn();
    // Warm the on-device voice in the background (P0 repair): the
    // one-time download/init overlaps listening and the gateway reply
    // instead of blocking the first spoken answer.
    if (browserVoiceOn) {
      void ensureBrowserSpeech()
        .then((provider) => provider.prepare())
        .catch(() => { /* the speak path surfaces failures honestly */ });
    }
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = voiceLocaleRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { if (voiceSessionRef.current !== session) return; setListening(true); setVoiceStatus("Listening — speak now"); };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition || voiceSessionRef.current !== session) return;
      setListening(false);
      recognitionRef.current = null;
      if (voiceEnabledRef.current && !requestPendingRef.current) setVoiceStatus("Tap Talk to G to continue");
    };
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
      if (spoken) {
        if (/[¿¡ñáéíóú]|\b(?:hola|gracias|buenas|quiero|necesito|casa|propiedad|vender|comprar)\b/i.test(spoken)) voiceLocaleRef.current = "es-US";
        recognition.stop();
        recognitionRef.current = null;
        setVoiceStatus("G is preparing a reply");
        void handleSendMessage(spoken);
      }
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
      let replyEmotion: string | undefined;

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
        replyEmotion = typeof data?.delivery?.emotion === "string" ? data.delivery.emotion : undefined;
      } catch (gatewayError) {
        // Do not silently generate a fabricated financial analysis or claim a request was submitted.
        replyText = gatewayError instanceof Error && /Too many messages/.test(gatewayError.message)
          ? gatewayError.message
          : "I'm having trouble connecting right now. Please try again, or use the Sell or Contact page to reach The OC Group.";
      }

      // 3. Execute Tool Action via Registry
      if (actionInvocation) {
        // An explicit Contact handoff keeps a short, local summary for form review.
        // No network submission or CRM record is created here.
        if (actionInvocation.actionId === "NAVIGATE" && actionInvocation.payload?.path === "/contact") {
          try {
            const summary = [...messages.slice(-10), userMsg, { id: "handoff-reply", sender: "g" as const, text: replyText }]
              .map(m => (m.sender === "user" ? "Visitor: " : "G: ") + m.text.slice(0, 500))
              .join("\n").slice(0, 2400);
            sessionStorage.setItem("ocg:g-contact-handoff", JSON.stringify({
              timestamp: Date.now(), summary
            }));
          } catch { /* session storage may be unavailable */ }
        }
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
      speakReply(replyText, replyEmotion);
    } finally {
      requestPendingRef.current = false;
      setIsTyping(false);
    }
  };

  const renderLeadCard = () => {
    if (!leadOpen) return null;
    if (leadStatus === "sent") {
      return (
        <div className="mx-3 mb-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100" role="status">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />
            <div>
              <p className="font-semibold text-white">The OC Group received your request.</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
                Your reference is <span className="font-mono">{leadReference}</span>. OCG reviews website requests
                directly — this is not an appointment confirmation. You can also call (720) 620-9929.
              </p>
              <button type="button" onClick={() => setLeadOpen(false)} className="mt-2 text-xs font-semibold text-emerald-200 underline">Done</button>
            </div>
          </div>
        </div>
      );
    }
    const inputCls = "w-full rounded-lg border border-white/15 bg-[#162136] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60";
    return (
      <div className="mx-3 mb-3 rounded-2xl border border-sky-400/30 bg-[#0c1423] p-4" role="dialog" aria-label="Request a follow-up from The OC Group">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Have The OC Group contact you</p>
          <button type="button" onClick={() => setLeadOpen(false)} aria-label="Close follow-up form" className="text-slate-400 hover:text-white">✕</button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          G will include a short summary of this conversation. Nothing is sent until you submit — and you'll get a reference once OCG's inbox has it.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Full name *" aria-label="Full name" className={inputCls} maxLength={120} />
          <input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="Phone" aria-label="Phone" type="tel" className={inputCls} maxLength={40} />
          <input value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="Email" aria-label="Email" type="email" className={inputCls} maxLength={200} />
          <select value={leadRole} onChange={e => setLeadRole(e.target.value)} aria-label="I am a" className={inputCls}>
            <option value="general">General inquiry</option>
            <option value="seller">Selling a property</option>
            <option value="investor">Investor</option>
            <option value="buyer">Buyer</option>
            <option value="financing">Financing partner</option>
          </select>
          <input value={leadAddress} onChange={e => setLeadAddress(e.target.value)} placeholder="Property address (optional)" aria-label="Property address" className={`${inputCls} sm:col-span-2`} maxLength={300} />
        </div>
        <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-300">
          <input type="checkbox" checked={leadConsent} onChange={e => setLeadConsent(e.target.checked)} className="mt-0.5 accent-sky-400" />
          <span>I authorize The OC Group to receive my information and the conversation summary, and to contact me about my inquiry. *</span>
        </label>
        {leadStatus === "error" && (
          <p role="alert" className="mt-2 text-xs text-amber-300">
            We couldn't save your request — nothing was recorded. Your details are still here; please try again, or{" "}
            <a href={emailHref} className="underline">email The OC Group</a> instead.
          </p>
        )}
        <button
          type="button"
          onClick={submitLead}
          disabled={leadStatus === "sending" || !leadName.trim() || (!leadEmail.trim() && !leadPhone.trim()) || !leadConsent}
          className="mt-3 w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-40"
        >
          {leadStatus === "sending" ? "Sending to OCG…" : "Send my request to OCG"}
        </button>
      </div>
    );
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
          {renderLeadCard()}
          <form onSubmit={e => { e.preventDefault(); void handleSendMessage(); }} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[#162136] p-2 focus-within:border-sky-400/60">
            {realtimeAvailable ? (
              <button type="button" onClick={rtActive ? stopRealtimeVoice : () => void startRealtimeVoice()} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${rtActive ? "bg-red-500 text-white" : "text-sky-200 hover:bg-white/10"}`} aria-label={rtActive ? "End voice conversation" : "Talk to G"} title={rtActive ? "End voice conversation" : "Talk to G"}>{rtActive ? <PhoneOff size={17} /> : <Mic size={18} />}</button>
            ) : (
              <button type="button" onClick={listening ? stopVoice : startListening} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${listening ? "bg-sky-500 text-white animate-pulse" : "text-sky-200 hover:bg-white/10"}`} aria-label={listening ? "Stop listening" : "Talk to G"} title={listening ? "Stop listening" : "Talk to G"}><Mic size={18} /></button>
            )}
            <input value={inputVal} onChange={e => { if (activeSpeechRef.current || kokoroRef.current?.isPlaying) { stopAllSpeech(); setVoiceStatus("Interrupted"); } setInputVal(e.target.value); }} maxLength={4000} aria-label="Message G" placeholder="Message G..." className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-slate-400" />
            <button type="submit" disabled={!inputVal.trim() || isTyping} aria-label="Send message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-35"><Send size={17}/></button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
            <span role="status" className="truncate">{rtStatusText() ?? (listening ? "Listening…" : voiceStatus === "Voice paused" || voiceStatus === "Voice is off" ? (realtimeAvailable ? "Realtime voice ready" : kokoroAvailable ? "OCG voice ready (preview)" : browserVoiceOn ? (browserVoiceState === "ready" ? "OCG voice ready (on-device)" : "OCG voice (on-device) — tap Talk to G") : "Basic browser voice ready") : voiceStatus)}</span>
            <div className="flex shrink-0 items-center gap-3">
              {rtActive ? (
                <button type="button" onClick={toggleRtMute} className="hover:text-white" aria-label={rtMuted ? "Unmute microphone" : "Mute microphone"}>{rtMuted ? "Unmute" : "Mute"}</button>
              ) : (
                <button type="button" onClick={stopVoice} className="hover:text-white">Stop voice</button>
              )}
              <button type="button" onClick={openLeadCard} className="text-sky-300 hover:text-sky-100">Have OCG contact me</button>
            </div>
          </div>
          <p className="mt-1 px-1 text-[10px] text-slate-500">{realtimeAvailable ? "Realtime voice — talk naturally, interrupt anytime." : kokoroAvailable ? "OCG voice (preview) — our own voice, still being tested. Text chat is fully available." : browserVoiceOn ? "OCG voice runs on your device — the first use downloads the voice model once. Text chat is fully available." : "Basic browser voice — text chat is fully available."}</p>
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
              <button type="button" onClick={realtimeAvailable ? (rtActive ? stopRealtimeVoice : () => void startRealtimeVoice()) : (listening ? stopVoice : startListening)} aria-label={rtActive ? "End voice conversation" : "Activate G voice"} className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-sky-300/70 bg-gradient-to-br from-blue-400 via-blue-600 to-[#052355] shadow-[0_0_45px_rgba(59,130,246,0.45)] transition-transform hover:scale-105 ${listening || rtState === "listening" || rtState === "speaking" ? "animate-pulse" : ""}`}>
                <span className="absolute inset-2 rounded-full border border-white/30" />
                <span className="relative text-5xl font-black tracking-tight text-white drop-shadow-lg">G</span>
              </button>
              <div className="text-lg font-bold text-white">Let's figure it out together.</div>
              <p className="max-w-sm text-sm leading-relaxed text-blue-100/80">Selling a home? Exploring your next investment? Just curious? I'm here to help.</p>
              <div className="text-xs font-semibold uppercase tracking-widest text-sky-300">{rtStatusText() ?? (listening ? "Listening to you" : isTyping ? "Thinking through your question" : rtActive ? "Voice on" : "Tap G to speak")}</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-blue-200/60">{realtimeAvailable ? "Realtime voice" : kokoroAvailable ? "OCG voice — preview" : browserVoiceOn ? "OCG voice — on-device" : "Basic browser voice"}</div>
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
                {realtimeAvailable ? (
                  <>
                    <button type="button" onClick={rtActive ? stopRealtimeVoice : () => void startRealtimeVoice()} title={rtActive ? "End voice conversation" : "Talk to G — you can interrupt by speaking"} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-white ${rtActive ? "bg-red-600 border-red-500 hover:bg-red-500" : "bg-blue-600 border-blue-500 hover:bg-blue-500"}`}>
                      {rtActive ? <PhoneOff size={15} /> : <Mic size={15} />}<span>{rtActive ? "End voice" : "Talk to G"}</span>
                    </button>
                    {rtActive && (
                      <button type="button" onClick={toggleRtMute} aria-label={rtMuted ? "Unmute microphone" : "Mute microphone"} className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white hover:bg-slate-700">
                        {rtMuted ? <Mic size={15} /> : <MicOff size={15} />}<span>{rtMuted ? "Unmute" : "Mute"}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button type="button" onClick={startListening} title="Talk to G and interrupt speech" className="flex items-center gap-2 rounded-lg bg-blue-600 border border-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                      <Mic size={15} /><span>{listening ? "Listening…" : "Talk to G"}</span>
                    </button>
                    <button type="button" onClick={stopVoice} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-white hover:bg-slate-700">Stop voice</button>
                  </>
                )}
              </div>
            </div>

            {/* Voice mode notice — always honest about which voice is live */}
            {voiceConfig && (
              <div className="my-2 rounded-xl border border-blue-500/30 bg-blue-950/40 p-3 text-[11px] text-blue-200">
                {realtimeAvailable ? (
                  <span><strong>Realtime voice:</strong> Tap Talk to G and allow microphone access. Talk naturally — you can interrupt G mid-sentence, and G follows English or Spanish.</span>
                ) : kokoroAvailable ? (
                  <span><strong>OCG voice (preview):</strong> G's replies are spoken in our own voice instead of your browser's built-in speech. We're still testing it, so it may change. Tap Talk to G and allow microphone access; tap Talk again to interrupt. English and Spanish are both supported. Text chat works fully either way.</span>
                ) : (
                  <span><strong>Basic browser voice:</strong> Realtime voice isn't enabled on this site yet, so G uses your browser's built-in speech. Tap Talk to G and allow microphone access; tap Talk again to interrupt. Chrome or Edge recommended. Text chat works fully either way.</span>
                )}
              </div>
            )}
            {rtState === "error" && (
              <div className="my-2 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-[11px] text-amber-200" role="alert">
                <span>{rtDetail || "Realtime voice ran into a problem."} You can retry, or use the basic browser voice instead.</span>
                <button type="button" onClick={() => { setUseFallbackVoice(true); setRtState("idle"); }} className="ml-2 shrink-0 font-bold text-amber-100 underline">Use basic voice</button>
              </div>
            )}

            <div role="status" aria-live="polite" className="mt-2 text-xs text-blue-300">{rtStatusText() ?? voiceStatus}</div>
            {browserVoiceOn && voiceDiag && (
              <div className="mt-1 text-[11px] text-blue-200/60">Voice engine: {voiceDiag} · on-device</div>
            )}
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
                onChange={(e) => { if (activeSpeechRef.current || kokoroRef.current?.isPlaying) { stopAllSpeech(); setVoiceStatus("Interrupted"); } setInputVal(e.target.value); }}
                placeholder="Tell G what you need, or tap the microphone..."
                maxLength={4000}
                aria-label="Message G"
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
            <div className="mt-4">{renderLeadCard()}</div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-blue-200/10 pt-4">
              <span className="mr-1 text-xs font-medium text-blue-100/70">Want a person to follow up?</span>
              <button type="button" onClick={openLeadCard} className="rounded-full border border-sky-400/50 bg-sky-500/15 px-4 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/30">Have OCG contact me</button>
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
