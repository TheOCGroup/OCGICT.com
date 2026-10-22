import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  classifyIntent,
  normalizeSpokenText,
  numberToWordsEN,
  numberToWordsES,
  ordinalToWordsEN,
  planDelivery,
} from "../../server/voice/gExpression";
import { parseWavPcm, stitchWavs } from "../../server/voice/wavStitch";
// @ts-ignore - Node ESM handler under test
import ttsHandler from "../../netlify/functions/g-tts.mts";

describe("number words", () => {
  it("renders English numbers the way people say them", () => {
    expect(numberToWordsEN(0)).toBe("zero");
    expect(numberToWordsEN(23)).toBe("twenty-three");
    expect(numberToWordsEN(196)).toBe("one hundred ninety-six");
    expect(numberToWordsEN(1250)).toBe("one thousand two hundred fifty");
    expect(numberToWordsEN(285000)).toBe("two hundred eighty-five thousand");
    expect(numberToWordsEN(310000)).toBe("three hundred ten thousand");
    expect(ordinalToWordsEN(1)).toBe("first");
    expect(ordinalToWordsEN(3)).toBe("third");
    expect(ordinalToWordsEN(34)).toBe("thirty-fourth");
  });

  it("renders Spanish numbers the way people say them", () => {
    expect(numberToWordsES(0)).toBe("cero");
    expect(numberToWordsES(23)).toBe("veintitrés");
    expect(numberToWordsES(100)).toBe("cien");
    expect(numberToWordsES(196)).toBe("ciento noventa y seis");
    expect(numberToWordsES(1000)).toBe("mil");
    expect(numberToWordsES(285000)).toBe("doscientos ochenta y cinco mil");
  });
});

describe("spoken-text normalization (English)", () => {
  it("speaks currency, addresses, and stats accurately", () => {
    const spoken = normalizeSpokenText(
      "Homes like yours on W. 34th St. have sold between $285,000 and $310,000 this year. That's about $196 per square foot, and the average time on market was 23 days.",
      "en",
    );
    expect(spoken).toContain("West thirty-fourth Street");
    expect(spoken).toContain("two hundred eighty-five thousand dollars");
    expect(spoken).toContain("three hundred ten thousand dollars");
    expect(spoken).toContain("one hundred ninety-six dollars per square foot");
    expect(spoken).toContain("twenty-three days");
    expect(spoken).not.toMatch(/\d/);
    expect(spoken).not.toContain("$");
  });

  it("speaks phone numbers digit by digit, in groups", () => {
    expect(normalizeSpokenText("Call us at (316) 555-0134 anytime.", "en")).toContain(
      "three one six, five five five, zero one three four",
    );
  });

  it("speaks percents, decimals, times, cents, and years", () => {
    expect(normalizeSpokenText("Rates near 12.5% this year", "en")).toContain("twelve point five percent");
    expect(normalizeSpokenText("It is $99.50 total", "en")).toContain("ninety-nine dollars and fifty cents");
    expect(normalizeSpokenText("We will call at 3:30 PM", "en")).toContain("three thirty PM");
    expect(normalizeSpokenText("We will call at 3:00 PM", "en")).toContain("three PM");
    expect(normalizeSpokenText("New for 2026", "en")).toContain("twenty twenty-six");
  });

  it("never injects performance directions or bracketed text", () => {
    const plan = planDelivery("Hello there. How can I help?", { lang: "en" });
    expect(plan.spokenText).not.toMatch(/\[|\]/);
    expect(plan.spokenText).not.toMatch(/whisper|emphasis|sigh/i);
  });
});

describe("spoken-text normalization (Spanish)", () => {
  it("speaks currency and counts in Spanish words", () => {
    const spoken = normalizeSpokenText(
      "Casas como la suya se han vendido entre $285,000 y $310,000 este año, un promedio de 23 días en el mercado.",
      "es",
    );
    expect(spoken).toContain("doscientos ochenta y cinco mil dólares");
    expect(spoken).toContain("trescientos diez mil dólares");
    expect(spoken).toContain("veintitrés días");
    expect(spoken).not.toMatch(/\d/);
  });

  it("speaks percents in Spanish", () => {
    expect(normalizeSpokenText("La tasa es 12.5% anual", "es")).toContain("doce punto cinco por ciento");
  });
});

describe("intent classification", () => {
  it("classifies G's conversational shapes", () => {
    expect(classifyIntent("Hi, I'm G with The OC Group. What can I do for you today?")).toBe("greeting");
    expect(classifyIntent("And roughly when are you hoping to sell?")).toBe("question");
    expect(classifyIntent(
      "Here's how it works. We compare recent sales near your home and give you a realistic price range. It takes about a day, and there is no obligation.",
    )).toBe("explanation");
    expect(classifyIntent("Perfect — you're all set. We'll reach out within one business day.")).toBe("confirmation");
    expect(classifyIntent(
      "I understand — selling after a loss in the family is a lot to carry. There's no rush at all.",
    )).toBe("sensitive");
    expect(classifyIntent("Thanks for stopping by. Have a great day!")).toBe("closing");
    expect(classifyIntent("We serve buyers and sellers across Wichita.")).toBe("statement");
  });

  it("honors an explicit intent hint and ignores a bogus one", () => {
    expect(classifyIntent("Whatever this says?", "sensitive")).toBe("sensitive");
    expect(classifyIntent("Whatever this says?", "bogus")).toBe("question");
  });
});

describe("delivery plans", () => {
  it("paces intents differently: sensitive slowest, confirmation briefest", () => {
    const sensitive = planDelivery("I understand. There's no rush at all. We can go at your pace.", { lang: "en" });
    const confirm = planDelivery("Perfect — you're all set. We'll reach out soon.", { lang: "en" });
    const explain = planDelivery("Here's how it works. We compare sales. Then we talk price.", { lang: "en" });
    expect(sensitive.intent).toBe("sensitive");
    expect(sensitive.segments[0].speed).toBeLessThan(confirm.segments[0].speed);
    expect(sensitive.segments[0].pauseAfterMs).toBeGreaterThan(explain.segments[0].pauseAfterMs);
    expect(confirm.segments[0].pauseAfterMs).toBeLessThan(explain.segments[0].pauseAfterMs);
    // The last segment never carries a trailing pause.
    for (const p of [sensitive, confirm, explain]) {
      expect(p.segments[p.segments.length - 1].pauseAfterMs).toBe(0);
    }
    // Explanation opens slightly slower than it continues.
    expect(explain.segments[0].speed).toBeLessThan(explain.segments[1].speed);
  });

  it("plans Spanish replies with the Spanish normalizer", () => {
    const plan = planDelivery("Hola, soy G. ¿En qué puedo ayudarle hoy?", { lang: "es" });
    expect(plan.lang).toBe("es");
    expect(plan.intent).toBe("greeting");
    expect(plan.segments.length).toBeGreaterThan(0);
  });

  it("keeps every speed inside the restrained band", () => {
    const texts = [
      "Hi there.", "Why is that?", "One. Two. Three. Four.", "Perfect — you're all set.",
      "I'm so sorry for your loss. There's no rush at all.", "Thanks for stopping by, have a great day!",
    ];
    for (const t of texts) {
      for (const seg of planDelivery(t, { lang: "en" }).segments) {
        expect(seg.speed).toBeGreaterThanOrEqual(0.9);
        expect(seg.speed).toBeLessThanOrEqual(1.05);
      }
    }
  });
});

function makeWav(samples: number[], sampleRate = 24000): ArrayBuffer {
  const buf = new Uint8Array(44 + samples.length * 2);
  const v = new DataView(buf.buffer);
  const put = (off: number, s: string) => { for (let i = 0; i < s.length; i++) buf[off + i] = s.charCodeAt(i); };
  put(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); put(8, "WAVE");
  put(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  put(36, "data"); v.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, s, true));
  return buf.buffer as ArrayBuffer;
}

describe("WAV stitching", () => {
  it("concatenates segments with real silence between them", () => {
    const a = makeWav([1000, 1000, 1000]);
    const b = makeWav([2000, 2000]);
    const out = stitchWavs([
      { wav: a, pauseAfterMs: 100 },
      { wav: b, pauseAfterMs: 0 },
    ]);
    const parsed = parseWavPcm(new Uint8Array(out.wav));
    const silence = Math.round(0.1 * 24000);
    expect(parsed.sampleRate).toBe(24000);
    expect(parsed.pcm.length).toBe(3 + silence + 2);
    expect(Array.from(parsed.pcm.slice(0, 3))).toEqual([1000, 1000, 1000]);
    expect(parsed.pcm[3]).toBe(0);
    expect(parsed.pcm[3 + silence - 1]).toBe(0);
    expect(Array.from(parsed.pcm.slice(3 + silence))).toEqual([2000, 2000]);
    expect(out.audioSeconds).toBeCloseTo((3 + silence + 2) / 24000, 6);
  });

  it("refuses mismatched sample rates and non-WAV payloads", () => {
    expect(() => stitchWavs([
      { wav: makeWav([1], 24000), pauseAfterMs: 0 },
      { wav: makeWav([1], 16000), pauseAfterMs: 0 },
    ])).toThrow(/sample rate/);
    expect(() => parseWavPcm(new Uint8Array([1, 2, 3, 4]))).toThrow(/not a WAV/);
  });
});

describe("g-tts expressive path gates", () => {
  const KEYS = ["OCG_G_KOKORO_TTS_ENABLED", "OCG_KOKORO_TTS_URL", "OCG_KOKORO_TTS_KEY"] as const;
  let saved: Record<string, string | undefined>;
  beforeEach(() => {
    saved = {};
    for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("expressive POST is metered exactly like the plain path (fails closed without a meter)", async () => {
    process.env.OCG_G_KOKORO_TTS_ENABLED = "true";
    process.env.OCG_KOKORO_TTS_URL = "http://tts.local";
    process.env.OCG_KOKORO_TTS_KEY = "k";
    const res = await ttsHandler(new Request("https://example.invalid/api/g/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello there.", expressive: true, intent: "greeting" }),
    }));
    expect(res.status).toBe(503);
  });

  it("expressive POST refuses while the rollout flag is off", async () => {
    process.env.OCG_KOKORO_TTS_URL = "http://tts.local";
    process.env.OCG_KOKORO_TTS_KEY = "k";
    const res = await ttsHandler(new Request("https://example.invalid/api/g/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello there.", expressive: true }),
    }));
    expect(res.status).toBe(503);
  });
});
