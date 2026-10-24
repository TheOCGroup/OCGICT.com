/**
 * POC Gemini streaming tests: the SSE parser and WAV wrapper are the
 * two pure pieces of the server streaming path — pinned without network.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiSseParser,
  pcmToWav,
  textDeltaFromGeminiJson,
  usageFromGeminiJson,
  POC_VOICE_CANDIDATES,
  POC_TTS_VOICE,
  POC_TTS_MODEL,
  effectiveTtsModel,
  extractSpeechPcm,
  synthesizeGeminiSpeech,
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

  it("the founder-selected default voice is Achird", () => {
    expect(POC_TTS_VOICE).toBe("Achird");
  });
});

describe("effectiveTtsModel", () => {
  it("defaults to the GA model and honors the GEMINI_TTS_MODEL override both ways", () => {
    const prev = process.env.GEMINI_TTS_MODEL;
    delete process.env.GEMINI_TTS_MODEL;
    expect(POC_TTS_MODEL).toBe("gemini-3.8-flash-tts");
    expect(effectiveTtsModel()).toBe("gemini-3.8-flash-tts");
    process.env.GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
    expect(effectiveTtsModel()).toBe("gemini-2.5-flash-preview-tts");
    process.env.GEMINI_TTS_MODEL = "  ";
    expect(effectiveTtsModel()).toBe(POC_TTS_MODEL);
    if (prev === undefined) delete process.env.GEMINI_TTS_MODEL;
    else process.env.GEMINI_TTS_MODEL = prev;
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

/** Build a WAV container like the GA TTS models return: fmt + data + a
 * trailing metadata chunk whose bytes must never reach the listener. */
function wavContainer(pcm: Buffer, trailingJunk = true): Buffer {
  const fmt = Buffer.alloc(16);
  fmt.writeUInt16LE(1, 0); // PCM
  fmt.writeUInt16LE(1, 2); // mono
  fmt.writeUInt32LE(24000, 4);
  fmt.writeUInt32LE(48000, 8);
  fmt.writeUInt16LE(2, 12);
  fmt.writeUInt16LE(16, 14);
  const chunk = (id: string, body: Buffer) => {
    const h = Buffer.alloc(8);
    h.write(id, 0, "ascii");
    h.writeUInt32LE(body.length, 4);
    return Buffer.concat([h, body, body.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
  };
  const body = Buffer.concat([
    Buffer.from("WAVE", "ascii"),
    chunk("fmt ", fmt),
    chunk("data", pcm),
    ...(trailingJunk ? [chunk("C2PA", Buffer.alloc(6064, 0x7f))] : []),
  ]);
  const head = Buffer.alloc(8);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
}

describe("extractSpeechPcm", () => {
  const speech = Buffer.alloc(4800);
  for (let i = 0; i < speech.length; i += 2) speech.writeInt16LE(1000, i);

  it("returns ONLY the data chunk of a WAV container (no header click, no metadata burst)", () => {
    const out = extractSpeechPcm(wavContainer(speech), "audio/wav");
    expect(out.sampleRate).toBe(24000);
    expect(out.pcm.equals(speech)).toBe(true);
  });

  it("passes raw L16 PCM through unchanged", () => {
    const out = extractSpeechPcm(speech, "audio/l16; rate=24000");
    expect(out.pcm.equals(speech)).toBe(true);
    expect(out.sampleRate).toBe(24000);
  });

  it("falls back to the raw payload when the container is corrupt", () => {
    const bad = wavContainer(speech);
    bad.writeUInt32LE(999999999, 40); // data chunk declares more bytes than exist
    const out = extractSpeechPcm(bad, "audio/wav");
    expect(out.pcm.equals(bad)).toBe(true);
  });
});

describe("synthesizeGeminiSpeech payload handling", () => {
  afterEach(() => vi.unstubAllGlobals());
  const speech = Buffer.alloc(2400);
  for (let i = 0; i < speech.length; i += 2) speech.writeInt16LE(-500, i);

  function stubFetch(payload: Buffer, mimeType: string) {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ inlineData: { mimeType, data: payload.toString("base64") } }] } },
        ],
      }),
    }));
  }

  it("strips a WAV container (GA models) down to clean speech PCM", async () => {
    stubFetch(wavContainer(speech), "audio/wav");
    const wav = await synthesizeGeminiSpeech("hello", "test-key");
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
    expect(wav.length).toBe(44 + speech.length);
    expect(wav.subarray(44).equals(speech)).toBe(true);
  });

  it("keeps raw PCM responses (preview model) byte-identical", async () => {
    stubFetch(speech, "audio/l16; rate=24000");
    const wav = await synthesizeGeminiSpeech("hello", "test-key");
    expect(wav.length).toBe(44 + speech.length);
    expect(wav.subarray(44).equals(speech)).toBe(true);
  });
});

describe("extractSpeechPcm — real GA payload fixture", () => {
  it("strips the container + C2PA chunk from a captured gemini-3.8-flash-tts response", async () => {
    // Captured 2026-10-24 from the live POC endpoint (Achird, Spanish line)
    // BEFORE the decoder fix: the raw Google payload — RIFF + fmt + data +
    // a 6,064-byte C2PA chunk. The expected speech is the data chunk only:
    // 328,320 bytes, sha256 pinned below.
    const { readFileSync } = await import("node:fs");
    const { createHash } = await import("node:crypto");
    const b64 = readFileSync(new URL("./fixtures/ga-tts-payload-es.b64.txt", import.meta.url), "utf8");
    const payload = Buffer.from(b64, "base64");
    expect(payload.toString("ascii", 0, 4)).toBe("RIFF");
    const out = extractSpeechPcm(payload, "audio/wav");
    expect(out.sampleRate).toBe(24000);
    expect(out.pcm.length).toBe(328320);
    expect(createHash("sha256").update(out.pcm).digest("hex")).toBe(
      "2016d37ae5ce629fbfbbc79fc4e3b81e64fa16c0d5bf875bbed410d021dabf88",
    );
    expect(out.pcm.includes(Buffer.from("C2PA", "ascii"))).toBe(false);
    expect(out.pcm.includes(Buffer.from("RIFF", "ascii"))).toBe(false);
  });
});
