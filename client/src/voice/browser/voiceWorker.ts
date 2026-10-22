/**
 * OCG Voice Runtime — inference worker.
 *
 * All ONNX work happens here, off the website's main thread, so
 * synthesis can never freeze G's interface. The worker owns the
 * engine and the M1 style; the page side (gBrowserSpeech) sends text
 * and receives raw audio buffers back (transferred, not copied).
 *
 * Protocol:
 *   in : { id, type: "load" }
 *        { id, type: "synthesize", text, lang, speed }
 *   out: { id, type: "ready", sampleRate }
 *        { id, type: "audio", wav, durationSeconds, synthMs }
 *        { id, type: "error", message }
 */
import { SupertonicBrowserEngine, type VoiceStyle } from "./supertonicEngine";

let engine: SupertonicBrowserEngine | null = null;
let style: VoiceStyle | null = null;
let loading: Promise<void> | null = null;

function ensureLoaded(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      engine = new SupertonicBrowserEngine();
      await engine.load();
      style = await engine.loadStyle("M1");
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

self.onmessage = async (ev: MessageEvent) => {
  const msg = ev.data as { id: number; type: string; text?: string; lang?: string; speed?: number };
  try {
    if (msg.type === "load") {
      await ensureLoaded();
      (self as any).postMessage({ id: msg.id, type: "ready", sampleRate: engine!.sampleRate });
      return;
    }
    if (msg.type === "synthesize") {
      await ensureLoaded();
      const r = await engine!.synthesize(msg.text!, style!, { lang: msg.lang ?? "en", speed: msg.speed ?? 1.0 });
      (self as any).postMessage(
        { id: msg.id, type: "audio", wav: r.wav, durationSeconds: r.durationSeconds, synthMs: r.synthMs },
        [r.wav.buffer],
      );
      return;
    }
    (self as any).postMessage({ id: msg.id, type: "error", message: `unknown message type ${msg.type}` });
  } catch (err) {
    (self as any).postMessage({ id: msg.id, type: "error", message: String(err).slice(0, 300) });
  }
};
