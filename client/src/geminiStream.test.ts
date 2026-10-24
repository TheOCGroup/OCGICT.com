/**
 * POC Gemini streaming tests: the SSE parser and WAV wrapper are the
 * two pure pieces of the server streaming path — pinned without network.
 */
import { describe, expect, it } from "vitest";
import {
  GeminiSseParser,
  pcmToWav,
  textDeltaFromGeminiJson,
  usageFromGeminiJson,
  POC_VOICE_CANDIDATES,
  POC_TTS_VOICE,
} from "../../server/services/geminiStream";

const sseEvent = (text: string) =>
  `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n`;

describe("textDeltaFromGeminiJson", () => {
  it("joins text parts and ignores non-text payloads", () => {
    expect(textDeltaFromGeminiJson({ candidates: [{ content: { parts: [{ text: "Hel" }, { text: "lo" }] } }] })).toBe("Hello");
    expect(textDeltaFromGeminiJson({})).toBe("");
    expect(textDeltaFromGeminiJson({ candidates: [{ content: { parts: [{ inlineData: {} }] } }] })).toBe("");
  });
});

describe("GeminiSseParser", () => {
  it("extracts deltas from complete lines", () => {
    const p = new GeminiSseParser();
    expect(p.push(sseEvent("Hello ") + sseEvent("there."))).toEqual(["Hello ", "there."]);
  });

  it("holds a line split across chunks", () => {
    const p = new GeminiSseParser();
    const wire = sseEvent("streamed");
    expect(p.push(wire.slice(0, 10))).toEqual([]);
    expect(p.push(wire.slice(10))).toEqual(["streamed"]);
  });

  it("skips blank lines, keep-alives and DONE", () => {
    const p = new GeminiSseParser();
    expect(p.push("\n: keep-alive\ndata: [DONE]\n")).toEqual([]);
  });
});

describe("usageFromGeminiJson", () => {
  it("extracts token usage from a final stream payload", () => {
    const u = usageFromGeminiJson({ usageMetadata: { promptTokenCount: 812, candidatesTokenCount: 41, totalTokenCount: 853 } });
    expect(u).toEqual({ promptTokens: 812, responseTokens: 41, totalTokens: 853 });
  });
  it("returns null when usage metadata is absent", () => {
    expect(usageFromGeminiJson({ candidates: [] })).toBeNull();
    expect(usageFromGeminiJson(null)).toBeNull();
  });
  it("the parser captures usage while still yielding deltas", () => {
    const p = new GeminiSseParser();
    const deltas = p.push('data: {"candidates":[{"content":{"parts":[{"text":"Hi"}]}}],"usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":2,"totalTokenCount":12}}\n\n');
    expect(deltas).toEqual(["Hi"]);
    expect(p.usage).toEqual({ promptTokens: 10, responseTokens: 2, totalTokens: 12 });
  });
});

describe("POC voice candidates", () => {
  it("the default voice is in the allowlist and all entries are non-empty", () => {
    expect(POC_VOICE_CANDIDATES).toContain(POC_TTS_VOICE);
    for (const v of POC_VOICE_CANDIDATES) expect(v.length).toBeGreaterThan(2);
  });
});

describe("pcmToWav", () => {
  it("writes a valid 44-byte PCM header", () => {
    const pcm = Buffer.alloc(4800, 1);
    const wav = pcmToWav(pcm, 24000);
    expect(wav.length).toBe(44 + 4800);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.readUInt32LE(24)).toBe(24000);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.readUInt32LE(40)).toBe(4800);
  });
});
