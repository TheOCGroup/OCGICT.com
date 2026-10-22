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
import { SupertonicBrowserEngine, type VoiceStyle } from "./supertonicEngine";

export interface BrowserSpeechEvents {
  onStart: () => void;
  onEnd: () => void;
  onError: (detail: string) => void;
}

export { browserVoiceFlagEnabled } from "./browserVoiceFlag";

/** Model assets are heavy (~398 MB): engine + style are process-wide
 * singletons, shared by every GBrowserSpeech instance. */
let sharedEngine: SupertonicBrowserEngine | null = null;
let sharedStyle: VoiceStyle | null = null;
let sharedPreparing: Promise<void> | null = null;

function prepareShared(): Promise<void> {
  if (!sharedPreparing) {
    sharedPreparing = (async () => {
      sharedEngine = new SupertonicBrowserEngine();
      await sharedEngine.load();
      sharedStyle = await sharedEngine.loadStyle("M1");
    })().catch((err) => {
      sharedPreparing = null;
      throw err;
    });
  }
  return sharedPreparing;
}

/** Test seam: substitute the shared engine/style without downloads. */
export function __setBrowserEngineForTests(engine: unknown, style: unknown): void {
  sharedEngine = engine as SupertonicBrowserEngine;
  sharedStyle = style as VoiceStyle;
  sharedPreparing = Promise.resolve();
}

export class GBrowserSpeech {
  private ctx: AudioContext | null = null;
  private current: AudioBufferSourceNode | null = null;
  private generation = 0;

  /** Load model assets + the M1 style. Idempotent; safe to call early. */
  prepare(): Promise<void> {
    return prepareShared();
  }

  get ready(): boolean {
    return !!sharedEngine?.ready && !!sharedStyle;
  }

  async speak(
    text: string,
    opts: { lang?: string; intent?: string },
    events: BrowserSpeechEvents,
  ): Promise<void> {
    const gen = ++this.generation;
    try {
      await prepareShared();
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
        result = await sharedEngine!.synthesize(segment.text, sharedStyle!, {
          lang: plan.lang, speed: segment.speed,
        });
      } catch (err) {
        if (gen === this.generation) events.onError(`browser synthesis failed: ${String(err).slice(0, 120)}`);
        return;
      }
      if (gen !== this.generation) return;
      const buffer = this.ctx.createBuffer(1, result.wav.length, sharedEngine!.sampleRate);
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
