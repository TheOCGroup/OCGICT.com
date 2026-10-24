/**
 * POC Gemini streaming tests: the SSE parser and WAV wrapper are the
 * two pure pieces of the server streaming path — pinned without network.
 */
import { describe, expect, it } from "vitest";
import {
  GeminiSseParser,
  pcmToWav,
  textDeltaFromGeminiJson,
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
