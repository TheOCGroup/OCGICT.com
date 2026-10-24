/**
 * G POC — real streaming access to Google Gemini for the architecture-reset
 * proof of concept (Option C). Two capabilities the current stack lacks:
 *
 * 1. TRUE token streaming for chat (streamGenerateContent?alt=sse). The
 *    existing providers' generateStream() awaits the full completion and
 *    then drips words — simulated streaming that makes first-audio latency
 *    >= full generation + full synthesis for every reply.
 * 2. Server-side neural TTS (gemini-2.5-flash-preview-tts) returning WAV
 *    per sentence, so speech no longer depends on a 182 MB on-device model
 *    download or the visitor's CPU.
 *
 * Used only behind the existing paid-approval gate + budget meter in the
 * Netlify functions; the API key never leaves the server.
 */
import { G_SYSTEM_INSTRUCTION } from "./gIntelligenceGateway.js";

export const POC_CHAT_MODEL = "gemini-3.8-flash";
export const POC_TTS_MODEL = "gemini-2.5-flash-preview-tts";
/** G's voice, selected by the founder on 2026-10-24 from the six-voice
 * listening comparison (greeting / fees / Spanish lines). */
export const POC_TTS_VOICE = "Achird";

/** Male voice candidates from the founder's listening comparison (Gemini
 * TTS prebuilt voices). The TTS endpoint accepts a voice ONLY from this
 * allowlist; anything else falls back to POC_TTS_VOICE. */
export const POC_VOICE_CANDIDATES = [
  "Charon", // informative
  "Orus", // firm
  "Iapetus", // clear
  "Umbriel", // easy-going
  "Achird", // friendly — founder-selected default (2026-10-24)
  "Sadaltager", // knowledgeable
  "Algieba", // smooth
  "Puck", // upbeat
] as const;

/** Token usage reported by Gemini on a streamed reply (present on the
 * final SSE payloads). Used for measured — not estimated — cost review. */
export interface PocUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}

export function usageFromGeminiJson(payload: any): PocUsage | null {
  const u = payload?.usageMetadata;
  if (!u || typeof u.totalTokenCount !== "number") return null;
  return {
    promptTokens: typeof u.promptTokenCount === "number" ? u.promptTokenCount : 0,
    responseTokens: typeof u.candidatesTokenCount === "number" ? u.candidatesTokenCount : 0,
    totalTokens: u.totalTokenCount,
  };
}

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Appended to G's system instruction on the streamed path only: replies
 * are spoken aloud sentence by sentence as they are generated. */
export const POC_VOICE_ADDENDUM = `

STREAMED VOICE MODE: Your reply will be spoken aloud, sentence by sentence, as you generate it. Keep the whole reply to one or two short sentences unless the visitor asks for detail. Never address the visitor by a personal name unless they have given that name in this conversation. Do not use lists, headings, markdown, or any formatting — plain spoken sentences only.`;

export interface PocHistoryItem {
  role: "user" | "assistant";
  content: string;
}

function contentsFor(history: PocHistoryItem[], message: string) {
  return [
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];
}

/** Extract the text delta from one parsed Gemini SSE JSON payload. */
export function textDeltaFromGeminiJson(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  let out = "";
  for (const p of parts) if (typeof p?.text === "string") out += p.text;
  return out;
}

/**
 * Incremental parser for Gemini's SSE stream: feed raw decoded chunks,
 * get back the text deltas completed by that chunk. Pure and synchronous
 * so it is unit-testable without network.
 */
export class GeminiSseParser {
  private buffer = "";
  /** Latest usageMetadata seen in the stream, if any. */
  usage: PocUsage | null = null;

  push(chunk: string): string[] {
    this.buffer += chunk;
    const deltas: string[] = [];
    let idx: number;
    while ((idx = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const usage = usageFromGeminiJson(parsed);
        if (usage) this.usage = usage;
        const delta = textDeltaFromGeminiJson(parsed);
        if (delta) deltas.push(delta);
      } catch {
        /* a partial JSON line is held by the buffer split above; a
           malformed complete line is skipped, never fatal */
      }
    }
    return deltas;
  }
}

/** Stream a conversational reply from Gemini, yielding true token deltas. */
export async function* streamGeminiTokens(opts: {
  history: PocHistoryItem[];
  message: string;
  apiKey: string;
  model?: string;
  signal?: AbortSignal;
  /** Called once at stream end with the provider-reported token usage. */
  onUsage?: (usage: PocUsage) => void;
}): AsyncGenerator<string> {
  const model = opts.model || process.env.GEMINI_MODEL || POC_CHAT_MODEL;
  const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": opts.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: G_SYSTEM_INSTRUCTION + POC_VOICE_ADDENDUM }] },
      contents: contentsFor(opts.history, opts.message),
      generationConfig: { temperature: 0.35, maxOutputTokens: 640 },
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Gemini stream request failed (HTTP ${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = new GeminiSseParser();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const deltas = parser.push(decoder.decode(value, { stream: true }));
    for (const d of deltas) yield d;
  }
  if (parser.usage && opts.onUsage) {
    try { opts.onUsage(parser.usage); } catch { /* telemetry never breaks a reply */ }
  }
}

/** Wrap raw 16-bit mono PCM in a minimal WAV container. */
export function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Synthesize one sentence with Gemini TTS. Returns a WAV buffer.
 * The TTS model detects the text's language itself; the same voice is
 * used for English and Spanish in the POC.
 */
export async function synthesizeGeminiSpeech(
  text: string,
  apiKey: string,
  opts: { voice?: string; signal?: AbortSignal } = {},
): Promise<Buffer> {
  const res = await fetch(`${API_BASE}/${POC_TTS_MODEL}:generateContent`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: opts.voice || POC_TTS_VOICE },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini TTS request failed (HTTP ${res.status})`);
  }
  const data: any = await res.json();
  const inline = data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData)?.inlineData;
  if (!inline?.data) throw new Error("Gemini TTS returned no audio data");
  const rateMatch = /rate=(\d+)/.exec(String(inline.mimeType || ""));
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  return pcmToWav(Buffer.from(inline.data, "base64"), sampleRate);
}
