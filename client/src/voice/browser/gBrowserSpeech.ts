/**
 * G browser speech — the OCG Voice Runtime path (OCG LAB R&D).
 *
 * Synthesizes G's replies entirely on the visitor's device with the
 * Supertonic 3 model (voice M1, the founder's selected voice) through
 * the browser engine, then plays them sentence by sentence. The reply
 * text runs through the SAME certified expression layer as the server
 * path (planDelivery): spoken-form numbers and addresses, per-intent
 * pacing, real pauses — only the synthesis location changes.
 *
 * Stop semantics mirror the certified server path: stop() halts the
 * current segment immediately and cancels every queued segment before
 * listening can re-arm, so G never talks over the visitor.
 *
 * Prototype gating: this path activates only when explicitly enabled
 * (URL flag `?browserVoice=1` or localStorage `ocg-g-browser-voice=1`).
 * It is NOT wired into production behavior by default.
 */
import { planDelivery } from "../../../../server/voice/gExpression";


export interface BrowserSpeechEvents {
  onStart: () => void;
  onEnd: () => void;
  onError: (detail: string) => void;
}

export { browserVoiceFlagEnabled } from "./browserVoiceFlag";

/** Model assets are heavy (~398 MB) and inference must never block
 * the page: synthesis runs in a dedicated Web Worker (voiceWorker.ts).
 * The worker + engine are process-wide singletons shared by every
 * GBrowserSpeech instance. */
interface SynthResult { wav: Float32Array; durationSeconds: number; synthMs: number }

class WorkerSynth {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  sampleRate = 44100;
  private readyPromise: Promise<void> | null = null;

  private spawn(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("./voiceWorker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (ev: MessageEvent) => {
        const { id, ...rest } = ev.data as { id: number; type: string; message?: string };
        const p = this.pending.get(id);
        if (!p) return;
        this.pending.delete(id);
        if (rest.type === "error") p.reject(new Error(rest.message || "worker error"));
        else p.resolve(rest);
      };
      this.worker.onerror = (e) => {
        this.pending.forEach((p) => p.reject(new Error(`worker crashed: ${e.message || "unknown"}`)));
        this.pending.clear();
      };
    }
    return this.worker;
  }

  private call(msg: Record<string, unknown>): Promise<any> {
    const w = this.spawn();
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      w.postMessage({ id, ...msg });
    });
  }

  load(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = this.call({ type: "load" }).then((r) => { this.sampleRate = r.sampleRate ?? 44100; })
        .catch((err) => { this.readyPromise = null; throw err; });
    }
    return this.readyPromise;
  }

  async synthesize(text: string, opts: { lang: string; speed: number }): Promise<SynthResult> {
    const r = await this.call({ type: "synthesize", text, lang: opts.lang, speed: opts.speed });
    return { wav: r.wav as Float32Array, durationSeconds: r.durationSeconds, synthMs: r.synthMs };
  }
}

const sharedWorker = new WorkerSynth();

/** Test seam: when set, speak() uses this engine directly (no worker). */
let testEngine: { sampleRate: number; synthesize: (t: string, s: unknown, o: { lang: string; speed: number }) => Promise<SynthResult> } | null = null;
export function __setBrowserEngineForTests(engine: unknown, _style: unknown): void {
  testEngine = engine as typeof testEngine;
}

export class GBrowserSpeech {
  private ctx: AudioContext | null = null;
  private current: AudioBufferSourceNode | null = null;
  private generation = 0;

  /** Load model assets + the M1 style (in the worker). Idempotent. */
  prepare(): Promise<void> {
    if (testEngine) return Promise.resolve();
    return sharedWorker.load();
  }

  get ready(): boolean {
    return !!testEngine || !!sharedWorker;
  }

  private async synth(text: string, lang: string, speed: number): Promise<SynthResult> {
    if (testEngine) return testEngine.synthesize(text, {}, { lang, speed });
    return sharedWorker.synthesize(text, { lang, speed });
  }

  private get sampleRate(): number {
    return testEngine ? testEngine.sampleRate : sharedWorker.sampleRate;
  }

  async speak(
    text: string,
    opts: { lang?: string; intent?: string },
    events: BrowserSpeechEvents,
  ): Promise<void> {
    const gen = ++this.generation;
    try {
      await this.prepare();
    } catch (err) {
      if (gen === this.generation) events.onError(`browser voice unavailable: ${String(err).slice(0, 120)}`);
      return;
    }
    if (gen !== this.generation) return;
    const plan = planDelivery(text, { lang: opts.lang ?? "en", intent: opts.intent });
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") await this.ctx.resume().catch(() => {});
    let started = false;
    for (const segment of plan.segments) {
      if (gen !== this.generation) return;
      let result;
      try {
        result = await this.synth(segment.text, plan.lang, segment.speed);
      } catch (err) {
        if (gen === this.generation) events.onError(`browser synthesis failed: ${String(err).slice(0, 120)}`);
        return;
      }
      if (gen !== this.generation) return;
      const buffer = this.ctx.createBuffer(1, result.wav.length, this.sampleRate);
      buffer.copyToChannel(result.wav as Float32Array, 0);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      this.current = source;
      if (!started) { started = true; events.onStart(); }
      const ended = new Promise<void>((resolve) => { source.onended = () => resolve(); });
      source.start();
      await ended;
      this.current = null;
      if (segment.pauseAfterMs > 0 && gen === this.generation) {
        await new Promise((r) => setTimeout(r, segment.pauseAfterMs));
      }
    }
    if (gen === this.generation) events.onEnd();
  }

  /** Halt playback and cancel every queued segment, immediately. */
  stop(): void {
    this.generation += 1;
    if (this.current) {
      try { this.current.onended = null; this.current.stop(); } catch { /* already stopped */ }
      this.current = null;
    }
  }

  dispose(): void {
    this.stop();
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
  }
}
