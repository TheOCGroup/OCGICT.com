/**
 * G realtime voice — Vapi Web SDK session controller.
 *
 * G's realtime voice runs on the same provider and conversational layer as
 * the other OCG agents (see docs/g-vapi-assistant.json): Deepgram Flux
 * Multilingual transcription with automatic language detection, LiveKit
 * endpointing, and server-configured interruption. This module only manages
 * the browser session: states, mute, live transcripts, and clean recovery.
 * It never holds a private key; sessions are issued by /api/g/voice/session
 * after the server-side budget gate admits them.
 */

export type GRealtimeState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "ended"
  | "error";

export interface GRealtimeEvents {
  onState: (state: GRealtimeState, detail?: string) => void;
  onTranscript: (role: "user" | "assistant", text: string) => void;
  onPartialTranscript?: (text: string) => void;
  onVolume?: (level: number) => void;
}

export interface VoiceConfig {
  enabled: boolean;
  reason?: string;
  maxDurationSeconds?: number;
  mode: string;
}

export async function fetchVoiceConfig(signal?: AbortSignal): Promise<VoiceConfig> {
  const res = await fetch("/api/g/voice/session", { method: "GET", signal });
  if (!res.ok) throw new Error("Voice status unavailable");
  return (await res.json()) as VoiceConfig;
}

interface SessionGrant {
  publicKey: string;
  assistantId: string;
  maxDurationSeconds: number;
}

export class GRealtimeVoice {
  private vapi: any = null;
  private events: GRealtimeEvents | null = null;
  private muted = false;
  private active = false;
  private starting = false;
  private cancelled = false;

  get isActive(): boolean {
    return this.active;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  async start(events: GRealtimeEvents): Promise<void> {
    // Guard the whole connect window, not just the live call: a second
    // start (or a stop) during "connecting" must not orphan a session.
    if (this.active || this.starting) return;
    this.starting = true;
    this.cancelled = false;
    this.events = events;
    events.onState("connecting");

    let grant: SessionGrant;
    try {
      const res = await fetch("/api/g/voice/session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.publicKey || !data.assistantId) {
        throw new Error(data.error || "Realtime voice is unavailable right now.");
      }
      grant = data as SessionGrant;
    } catch (err) {
      this.starting = false;
      events.onState("error", err instanceof Error ? err.message : "Realtime voice is unavailable right now.");
      throw err;
    }
    if (this.cancelled) {
      this.starting = false;
      events.onState("ended");
      return;
    }

    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(grant.publicKey);
      this.vapi = vapi;

      vapi.on("call-start", () => {
        this.starting = false;
        if (this.cancelled) {
          try { vapi.stop(); } catch { /* already stopping */ }
          events.onState("ended");
          return;
        }
        this.active = true;
        events.onState("listening");
      });
      vapi.on("call-end", () => {
        this.active = false;
        this.starting = false;
        events.onState("ended");
      });
      vapi.on("speech-start", () => events.onState("speaking"));
      vapi.on("speech-end", () => {
        if (this.active) events.onState("listening");
      });
      vapi.on("volume-level", (level: number) => events.onVolume?.(level));
      vapi.on("message", (message: any) => {
        if (message?.type !== "transcript") return;
        const text = typeof message.transcript === "string" ? message.transcript.trim() : "";
        if (!text) return;
        if (message.transcriptType === "final") {
          if (message.role === "user") {
            events.onState("thinking");
            events.onTranscript("user", text);
          } else if (message.role === "assistant") {
            events.onTranscript("assistant", text);
          }
        } else if (message.role === "user") {
          events.onPartialTranscript?.(text);
        }
      });
      vapi.on("error", (err: any) => {
        this.active = false;
        this.starting = false;
        const detail =
          typeof err?.message === "string" && err.message
            ? err.message
            : "The voice connection ran into a problem.";
        events.onState("error", detail);
      });

      await vapi.start(grant.assistantId);
      this.starting = false;
      if (this.cancelled) {
        try { vapi.stop(); } catch { /* already stopping */ }
        this.active = false;
        events.onState("ended");
      }
    } catch (err) {
      this.active = false;
      this.starting = false;
      this.vapi = null;
      events.onState(
        "error",
        err instanceof Error ? err.message : "Microphone or connection problem. Text chat is ready.",
      );
      throw err;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      this.vapi?.setMuted(muted);
    } catch {
      /* SDK may reject before call start; the flag still records intent */
    }
    if (this.active) {
      this.events?.onState("listening", muted ? "muted" : "unmuted");
    }
  }

  stop(): void {
    // Mark cancellation first so an in-flight start() aborts instead of
    // leaving an orphaned session behind.
    this.cancelled = true;
    try {
      this.vapi?.stop();
    } catch {
      /* already stopped */
    }
    this.active = false;
    this.starting = false;
    this.vapi = null;
  }
}
