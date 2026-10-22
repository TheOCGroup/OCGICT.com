/**
 * OCG shared voice provider contract — VENDORED COPY.
 *
 * Canonical home: the standalone ocg-voice repository,
 * contracts/typescript/voiceProvider.ts (contract ocg-tts/v1). This
 * copy serves G's adapter in this repository; keep behavior in sync
 * with the canonical contract.
 *
 * The shape deliberately mirrors the provider-independent core TED's
 * experience already uses (voiceCore.ts: a VoiceProvider contract behind
 * a session object), so agent lanes can adopt this layer without
 * re-inventing lifecycle behavior: synthesis is modular and separate from
 * speech recognition, dialogue intelligence, endpointing, and barge-in —
 * those stay with each agent's existing session machinery.
 */

export interface SynthesisRequest {
  text: string;
  /** Voice id for the selected engine, e.g. "am_michael" (kokoro) or "M1" (supertonic). */
  voice: string;
  /** Service language: "en-us" | "es" (Kokoro lang codes); supertonic takes bare codes ("en", "es"). */
  lang: string;
  speed?: number;
  /**
   * Engine selection (ocg-tts/v1 extension): "kokoro" (default when
   * omitted) or "supertonic". The service validates voice + lang per
   * engine and fails closed on a mismatch.
   */
  engine?: string;
}

export interface SynthesisResult {
  /** Complete WAV payload (mono; 24 kHz kokoro, 44.1 kHz supertonic). */
  wav: ArrayBuffer;
  sampleRate: number;
  /** Server-reported generation seconds, when the provider supplies it. */
  genSeconds?: number;
  audioSeconds?: number;
  /** Engine that produced the audio, when the service reports it. */
  engine?: string;
  provider: string;
}

export interface VoiceProvider {
  readonly id: string;
  health(): Promise<{ ok: boolean; detail?: string }>;
  synthesize(req: SynthesisRequest): Promise<SynthesisResult>;
}

/**
 * HTTP client for the independently deployed OCG Kokoro TTS service
 * (services/kokoro-tts). The service key never reaches a browser; agents
 * call this provider from their server side only.
 */
export class KokoroHttpProvider implements VoiceProvider {
  readonly id = "kokoro-http";
  private baseUrl: string;
  private apiKey: string;
  private fetchFn: typeof fetch;

  constructor(opts: { baseUrl: string; apiKey: string; fetchFn?: typeof fetch }) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.fetchFn = opts.fetchFn ?? fetch;
  }

  static fromEnv(env: Record<string, string | undefined>): KokoroHttpProvider | null {
    const baseUrl = env.OCG_KOKORO_TTS_URL;
    const apiKey = env.OCG_KOKORO_TTS_KEY;
    if (!baseUrl || !apiKey) return null;
    return new KokoroHttpProvider({ baseUrl, apiKey });
  }

  async health(): Promise<{ ok: boolean; detail?: string }> {
    try {
      const res = await this.fetchFn(`${this.baseUrl}/health`);
      if (!res.ok) return { ok: false, detail: `health ${res.status}` };
      const data = (await res.json()) as { ok?: boolean };
      return { ok: data.ok === true };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : "unreachable" };
    }
  }

  async synthesize(req: SynthesisRequest): Promise<SynthesisResult> {
    const res = await this.fetchFn(`${this.baseUrl}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-OCG-TTS-Key": this.apiKey },
      body: JSON.stringify({
        text: req.text, voice: req.voice, lang: req.lang, speed: req.speed ?? 1.0,
        ...(req.engine ? { engine: req.engine } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Kokoro TTS failed (${res.status})`);
    }
    const wav = await res.arrayBuffer();
    const gen = Number(res.headers.get("x-ocg-gen-seconds"));
    const dur = Number(res.headers.get("x-ocg-audio-seconds"));
    const sr = Number(res.headers.get("x-ocg-sample-rate"));
    return {
      wav,
      sampleRate: Number.isFinite(sr) && sr > 0 ? sr : 24000,
      genSeconds: Number.isFinite(gen) ? gen : undefined,
      audioSeconds: Number.isFinite(dur) ? dur : undefined,
      engine: res.headers.get("x-ocg-engine") ?? undefined,
      provider: this.id,
    };
  }
}
