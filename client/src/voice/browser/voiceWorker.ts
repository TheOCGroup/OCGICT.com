/**
 * OCG Voice Runtime — inference worker.
 *
 * All ONNX work happens here, off the website's main thread, so
 * synthesis can never freeze G's interface. The worker owns the
 * engine and the M1 style; the page side (gBrowserSpeech) sends text
 * and receives raw audio buffers back (transferred, not copied).
 *
 * Protocol:
 *   in : { id, type: "init", assetBase?, cacheName?, providers?, numThreads? }
 *        { id, type: "load" }
 *        { id, type: "synthesize", text, lang, speed }
 *   out: { id, type: "ready", sampleRate, providersUsed }
 *        { id, type: "audio", wav, durationSeconds, synthMs }
 *        { id, type: "error", message }
 *        { type: "progress", phase, file, fileBytes, fileTotal?, loadedBytes }
 *
 * Provider fallback: if session creation fails with the requested
 * providers (e.g. WebGPU present but unusable), the load retries once
 * on plain WASM and reports what actually runs.
 */
import * as ort from "onnxruntime-web";
import { SupertonicBrowserEngine, type VoiceStyle } from "./supertonicEngine";

interface WorkerConfig {
  assetBase?: string;
  cacheName?: string;
  providers?: string[];
  numThreads?: number;
  styleName?: string;
}

let config: WorkerConfig = {};
let engine: SupertonicBrowserEngine | null = null;
let style: VoiceStyle | null = null;
let loading: Promise<void> | null = null;
let providersUsed: string[] = ["wasm"];

async function buildEngine(providers: string[]): Promise<void> {
  engine = new SupertonicBrowserEngine({
    assetBase: config.assetBase,
    cacheName: config.cacheName,
    providers,
    onProgress: (e) => (self as any).postMessage({ type: "progress", ...e }),
  });
  await engine.load();
  style = await engine.loadStyle(config.styleName ?? "M1");
  providersUsed = providers;
}

function ensureLoaded(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      const requested = config.providers ?? ["wasm"];
      try {
        await buildEngine(requested);
      } catch (err) {
        if (requested.includes("webgpu")) {
          // Safe fallback: rebuild on WASM only.
          await buildEngine(["wasm"]);
        } else {
          throw err;
        }
      }
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

self.onmessage = async (ev: MessageEvent) => {
  const msg = ev.data as { id: number; type: string; text?: string; lang?: string; speed?: number } & WorkerConfig;
  try {
    if (msg.type === "init") {
      config = {
        assetBase: msg.assetBase,
        cacheName: msg.cacheName,
        providers: msg.providers,
        numThreads: msg.numThreads,
        styleName: msg.styleName,
      };
      if (msg.numThreads && msg.numThreads > 1) {
        try { (ort as any).env.wasm.numThreads = msg.numThreads; } catch { /* single-thread env */ }
      }
      (self as any).postMessage({ id: msg.id, type: "inited" });
      return;
    }
    if (msg.type === "load") {
      await ensureLoaded();
      (self as any).postMessage({ id: msg.id, type: "ready", sampleRate: engine!.sampleRate, providersUsed });
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
