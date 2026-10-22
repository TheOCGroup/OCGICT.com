/**
 * OCG Voice Runtime — browser inference engine for G (OCG LAB R&D).
 *
 * Original OCG code. Runs the Supertonic 3 ONNX graphs (third-party
 * weights, OpenRAIL-M — see docs/voice-evaluation/BROWSER-RUNTIME.md)
 * through ONNX Runtime Web (MIT). The inference procedure mirrors the
 * reference implementation's published pipeline:
 *   text -> unicode ids -> duration predictor -> text encoder
 *        -> flow-matching vector estimator (N steps) -> vocoder.
 * Design differences from the reference, deliberate: the latent noise
 * uses a seeded PRNG (reproducible runs) and the waveform is trimmed
 * to the predicted duration.
 *
 * No API keys or privileged functionality exist in this module; all
 * synthesis happens on the visitor's device.
 */
import * as ort from "onnxruntime-web";

export const ASSET_BASE_DEFAULT =
  "https://huggingface.co/Supertone/supertonic-3/resolve/main";

const MODEL_FILES = {
  dp: "onnx/duration_predictor.onnx",
  textEnc: "onnx/text_encoder.onnx",
  vectorEst: "onnx/vector_estimator.onnx",
  vocoder: "onnx/vocoder.onnx",
  ttsConfig: "onnx/tts.json",
  indexer: "onnx/unicode_indexer.json",
} as const;

type ModelKey = keyof typeof MODEL_FILES;

export interface EngineProgress {
  phase: "download" | "init";
  file: string;
  /** Bytes of the current asset received so far. */
  fileBytes: number;
  /** Total bytes of the current asset when the server reports it. */
  fileTotal?: number;
  /** Cumulative asset bytes received across the whole load. */
  loadedBytes: number;
}

async function fetchAsset(
  base: string,
  rel: string,
  cache: Cache | null,
  onChunk?: (fileBytes: number, fileTotal?: number) => void,
): Promise<{ buf: ArrayBuffer; fromCache: boolean }> {
  const url = `${base}/${rel}`;
  if (cache) {
    const hit = await cache.match(url);
    if (hit) return { buf: await hit.arrayBuffer(), fromCache: true };
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`asset fetch failed ${resp.status}: ${rel}`);
  let buf: ArrayBuffer;
  const total = Number(resp.headers.get("content-length")) || undefined;
  if (resp.body && typeof resp.body.getReader === "function") {
    const reader = resp.body.getReader();
    const parts: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) { parts.push(value); received += value.byteLength; onChunk?.(received, total); }
    }
    const merged = new Uint8Array(received);
    let off = 0;
    for (const p of parts) { merged.set(p, off); off += p.byteLength; }
    buf = merged.buffer;
  } else {
    buf = await resp.arrayBuffer();
    onChunk?.(buf.byteLength, total);
  }
  if (cache) {
    cache
      .put(url, new Response(buf.slice(0), { headers: { "content-type": "application/octet-stream" } }))
      .catch(() => {});
  }
  return { buf, fromCache: false };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianFactory(seed: number): () => number {
  const rand = mulberry32(seed);
  let spare: number | null = null;
  return function () {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0, v = 0, s = 0;
    do { u = rand() * 2 - 1; v = rand() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    return u * mul;
  };
}

const EMOJI_RE = new RegExp("[\\u{1F600}-\\u{1F64F}\\u{1F300}-\\u{1F5FF}\\u{1F680}-\\u{1F6FF}\\u{1F700}-\\u{1F77F}\\u{1F780}-\\u{1F7FF}\\u{1F800}-\\u{1F8FF}\\u{1F900}-\\u{1F9FF}\\u{1FA00}-\\u{1FA6F}\\u{1FA70}-\\u{1FAFF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F1E6}-\\u{1F1FF}]", "gu");
const SYMBOL_REPLACEMENTS: Record<string, string> = {
  "\u2013": "-", "\u2011": "-", "\u2014": "-", "\u00AF": " ", "_": " ",
  "\u201C": '"', "\u201D": '"', "\u2018": "'", "\u2019": "'", "\u00B4": "'", "`": "'",
  "[": " ", "]": " ", "|": " ", "/": " ", "#": " ", "\u2192": " ", "\u2190": " ",
};

/** Port of the reference UnicodeProcessor._preprocess_text. */
export function preprocessText(text: string, lang?: string): string {
  let t = text.normalize("NFKD");
  t = t.replace(EMOJI_RE, "");
  for (const [k, v] of Object.entries(SYMBOL_REPLACEMENTS)) t = t.split(k).join(v);
  t = t.replace(/[♥☆♡©\\]/g, "");
  t = t.replaceAll("@", " at ").replaceAll("e.g.,", "for example, ").replaceAll("i.e.,", "that is, ");
  t = t.replace(/ ,/g, ",").replace(/ \./g, ".").replace(/ !/g, "!").replace(/ \?/g, "?")
    .replace(/ ;/g, ";").replace(/ :/g, ":").replace(/ '/g, "'");
  t = t.replace(/(["'`])\1+/g, "$1");
  t = t.replace(/\s+/g, " ").trim();
  if (!/[.!?;:,'"')\]}…。」』】〉》›»]$/.test(t)) t += ".";
  if (lang) t = `<${lang}>${t}</${lang}>`;
  return t;
}

function flattenData(node: unknown, out: number[]): number[] {
  if (Array.isArray(node)) { for (const v of node) flattenData(v, out); }
  else out.push(node as number);
  return out;
}

export interface EngineLoadStats {
  assetBytes: number;
  fromCache: number;
  loadMs: number;
  initMs: number;
}

export interface VoiceStyle {
  ttl: ort.Tensor;
  dp: ort.Tensor;
}

export class SupertonicBrowserEngine {
  private sessions: Partial<Record<"dp" | "textEnc" | "vectorEst" | "vocoder", ort.InferenceSession>> = {};
  private cache: Cache | null = null;
  private cfg: any = null;
  private indexer: number[] = [];
  sampleRate = 44100;
  private baseChunk = 512;
  private compress = 6;
  private latentDim = 24;
  readonly totalSteps: number;
  readonly seed: number;
  ready = false;

  constructor(private opts: {
    assetBase?: string;
    providers?: string[];
    totalSteps?: number;
    seed?: number;
    /** Versioned cache namespace (per asset variant). */
    cacheName?: string;
    onProgress?: (e: EngineProgress) => void;
  } = {}) {
    this.totalSteps = opts.totalSteps ?? 8;
    this.seed = opts.seed ?? 1234;
  }

  private get assetBase(): string {
    return this.opts.assetBase || ASSET_BASE_DEFAULT;
  }

  async load(): Promise<EngineLoadStats> {
    const t0 = performance.now();
    this.cache = ("caches" in self)
      ? await caches.open(this.opts.cacheName ?? "ocg-voice-assets-v1")
      : null;
    const texts: Partial<Record<ModelKey, any>> = {};
    const bufs: Partial<Record<ModelKey, ArrayBuffer>> = {};
    let assetBytes = 0;
    let fromCache = 0;
    for (const [key, rel] of Object.entries(MODEL_FILES) as [ModelKey, string][]) {
      const base = assetBytes;
      const r = await fetchAsset(this.assetBase, rel, this.cache, (fileBytes, fileTotal) =>
        this.opts.onProgress?.({ phase: "download", file: rel, fileBytes, fileTotal, loadedBytes: base + fileBytes }));
      assetBytes += r.buf.byteLength;
      if (r.fromCache) fromCache += 1;
      if (rel.endsWith(".json")) texts[key] = JSON.parse(new TextDecoder().decode(r.buf));
      else bufs[key] = r.buf;
    }
    this.cfg = texts.ttsConfig;
    this.indexer = texts.indexer;
    this.sampleRate = this.cfg.ae.sample_rate;
    this.baseChunk = this.cfg.ae.base_chunk_size;
    this.compress = this.cfg.ttl.chunk_compress_factor;
    this.latentDim = this.cfg.ttl.latent_dim;
    const t1 = performance.now();
    this.opts.onProgress?.({ phase: "init", file: "", fileBytes: 0, loadedBytes: assetBytes });
    const sessionOpts = { executionProviders: this.opts.providers ?? ["wasm"] };
    this.sessions.dp = await ort.InferenceSession.create(bufs.dp!, sessionOpts);
    this.sessions.textEnc = await ort.InferenceSession.create(bufs.textEnc!, sessionOpts);
    this.sessions.vectorEst = await ort.InferenceSession.create(bufs.vectorEst!, sessionOpts);
    this.sessions.vocoder = await ort.InferenceSession.create(bufs.vocoder!, sessionOpts);
    this.ready = true;
    return { assetBytes, fromCache, loadMs: t1 - t0, initMs: performance.now() - t1 };
  }

  async loadStyle(name: string): Promise<VoiceStyle> {
    const { buf } = await fetchAsset(this.assetBase, `voice_styles/${name}.json`, this.cache);
    const raw = JSON.parse(new TextDecoder().decode(buf));
    const mk = (entry: { data: unknown; dims: number[] }) =>
      new ort.Tensor("float32", new Float32Array(flattenData(entry.data, [])), entry.dims);
    return { ttl: mk(raw.style_ttl), dp: mk(raw.style_dp) };
  }

  private textToIds(text: string, lang?: string) {
    const processed = preprocessText(text, lang);
    const chars = Array.from(processed);
    const ids = new BigInt64Array(chars.length);
    chars.forEach((ch, i) => { ids[i] = BigInt(this.indexer[ch.codePointAt(0)!] ?? -1); });
    const mask = new Float32Array(chars.length).fill(1);
    return {
      textIds: new ort.Tensor("int64", ids, [1, chars.length]),
      textMask: new ort.Tensor("float32", mask, [1, 1, chars.length]),
    };
  }

  async synthesize(
    text: string,
    style: VoiceStyle,
    opts: { lang?: string; speed?: number; seed?: number } = {},
  ): Promise<{ wav: Float32Array; durationSeconds: number; synthMs: number }> {
    if (!this.ready) throw new Error("engine not loaded");
    const t0 = performance.now();
    const { textIds, textMask } = this.textToIds(text, opts.lang ?? "en");
    const dpOut = await this.sessions.dp!.run({ text_ids: textIds, style_dp: style.dp, text_mask: textMask });
    const duration = (dpOut[Object.keys(dpOut)[0]].data as Float32Array)[0] / (opts.speed ?? 1.05);
    const encOut = await this.sessions.textEnc!.run({ text_ids: textIds, style_ttl: style.ttl, text_mask: textMask });
    const textEmb = encOut[Object.keys(encOut)[0]];

    const wavLen = Math.floor(duration * this.sampleRate);
    const chunk = this.baseChunk * this.compress;
    const latentLen = Math.ceil(wavLen / chunk);
    const latentChannels = this.latentDim * this.compress;
    const gauss = gaussianFactory((opts.seed ?? this.seed) >>> 0);
    const latentData = new Float32Array(latentChannels * latentLen);
    for (let i = 0; i < latentData.length; i++) latentData[i] = gauss();
    const latentMaskData = new Float32Array(latentLen).fill(1);
    let xt: ort.Tensor = new ort.Tensor("float32", latentData, [1, latentChannels, latentLen]);
    const latentMask = new ort.Tensor("float32", latentMaskData, [1, 1, latentLen]);
    const totalStep = new ort.Tensor("float32", new Float32Array([this.totalSteps]), [1]);
    for (let step = 0; step < this.totalSteps; step++) {
      const out = await this.sessions.vectorEst!.run({
        noisy_latent: xt, text_emb: textEmb, style_ttl: style.ttl,
        text_mask: textMask, latent_mask: latentMask,
        current_step: new ort.Tensor("float32", new Float32Array([step]), [1]),
        total_step: totalStep,
      });
      xt = out[Object.keys(out)[0]];
    }
    const vocOut = await this.sessions.vocoder!.run({ latent: xt });
    const wavFull = vocOut[Object.keys(vocOut)[0]].data as Float32Array;
    const wav = wavFull.slice(0, Math.min(wavLen, wavFull.length));
    return { wav, durationSeconds: wav.length / this.sampleRate, synthMs: performance.now() - t0 };
  }
}
