/**
 * OCG Voice Runtime tests.
 *
 * preprocessText expectations are the REFERENCE implementation's own
 * outputs (Python supertonic core.UnicodeProcessor._preprocess_text,
 * captured 2026-10-22) — the browser port must match them exactly.
 * GBrowserSpeech tests run against a fake engine + fake AudioContext
 * (no model downloads in unit tests).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { preprocessText } from "./supertonicEngine";

describe("GExperience wiring — no failure class strands a reply (QUINCEY D1)", () => {
  it("the browser-voice IIFE catches chunk-load failures into the cascade", () => {
    const src = readFileSync(new URL("../../components/GExperience.tsx", import.meta.url), "utf8");
    const block = src.slice(src.indexOf("if (browserVoiceOn)"), src.indexOf("// Preferred spoken path"));
    expect(block).toContain("const fallThrough = () => {");
    expect(block).toContain("onError: fallThrough,");
    expect(block).toContain("})().catch(() => { fallThrough(); });");
  });
});
import { GBrowserSpeech, __setBrowserEngineForTests, withOpenerSplit } from "./gBrowserSpeech";
import { browserVoiceFlagEnabled } from "./browserVoiceFlag";
import { selectDeviceProfile } from "./deviceProfile";
import { resolveVoiceVariant, VOICE_VARIANTS } from "./voiceVariant";

describe("resolveVoiceVariant — fp32 default, balanced on explicit selection", () => {
  const store = (v: string | null) => ({ getItem: (_k: string) => v });
  it("defaults to fp32 with the certified v1 cache", () => {
    const v = resolveVoiceVariant({ search: "" }, store(null));
    expect(v.key).toBe("fp32");
    expect(v.cacheName).toBe("ocg-voice-assets-v1");
    expect(v.assetBase).toBeUndefined();
  });
  it("selects balanced via query param or localStorage, with its own cache", () => {
    expect(resolveVoiceVariant({ search: "?voiceVariant=balanced" }, store(null)).key).toBe("balanced");
    expect(resolveVoiceVariant({ search: "" }, store("balanced")).key).toBe("balanced");
    const b = VOICE_VARIANTS.balanced;
    expect(b.assetBase).toBe("/voice-models/balanced");
    expect(b.cacheName).toBe("ocg-voice-assets-balanced-v2");
  });
  it("ignores unknown values", () => {
    expect(resolveVoiceVariant({ search: "?voiceVariant=turbo" }, store("turbo")).key).toBe("fp32");
  });
});

describe("withOpenerSplit — first-audio refinement", () => {
  const seg = (text: string, pauseAfterMs = 300) => ({ text, speed: 1.0, pauseAfterMs });
  it("splits a long opening segment at a clause boundary, preserving all words", () => {
    const long = "Hi, I'm G with The OC Group here in Wichita, and I can help you buy or sell a home, whenever you're ready to talk.";
    const out = withOpenerSplit([seg(long), seg("Second sentence.")]);
    expect(out.length).toBe(3);
    expect(out[0].text).toBe("Hi, I'm G with The OC Group here in Wichita,");
    expect(out[0].pauseAfterMs).toBe(120);
    expect(out[1].text + " " + out[2].text).toContain("whenever you're ready to talk.");
    expect(out.map((s) => s.text).join(" ")).toBe([long, "Second sentence."].join(" "));
  });
  it("leaves short openings and boundary-less text untouched", () => {
    const short = [seg("Hello there, welcome in.")];
    expect(withOpenerSplit(short)).toBe(short);
    const noBoundary = [seg("A very long single clause without any punctuation marks inside it at all whatsoever really quite long indeed yes")];
    expect(withOpenerSplit(noBoundary)).toBe(noBoundary);
  });
});

describe("selectDeviceProfile — adaptive configuration", () => {
  it("prefers webgpu with wasm fallback and caps threads at 4 when isolated", () => {
    const p = selectDeviceProfile({ hardwareConcurrency: 16, deviceMemoryGB: 8, crossOriginIsolated: true, webgpuAdapter: true });
    expect(p.providers).toEqual(["webgpu", "wasm"]);
    expect(p.numThreads).toBe(4);
    expect(p.constrained).toBe(false);
  });
  it("stays single-threaded without cross-origin isolation", () => {
    const p = selectDeviceProfile({ hardwareConcurrency: 8, crossOriginIsolated: false, webgpuAdapter: false });
    expect(p.providers).toEqual(["wasm"]);
    expect(p.numThreads).toBe(1);
  });
  it("flags low-memory mobile as constrained without reducing quality knobs", () => {
    const p = selectDeviceProfile({ hardwareConcurrency: 4, deviceMemoryGB: 2, mobileUserAgent: true });
    expect(p.constrained).toBe(true);
  });
});

describe("browserVoiceFlagEnabled — explicit values only", () => {
  it("accepts ?browserVoice and ?browserVoice=1, rejects ?browserVoice=0", () => {
    const set = (search: string) => vi.stubGlobal("location", new URL(`http://localhost/${search}`));
    try {
      set("?browserVoice");
      expect(browserVoiceFlagEnabled()).toBe(true);
      set("?browserVoice=1");
      expect(browserVoiceFlagEnabled()).toBe(true);
      set("?browserVoice=0");
      expect(browserVoiceFlagEnabled()).toBe(false);
      set("");
      expect(browserVoiceFlagEnabled()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("preprocessText — parity with the reference implementation", () => {
  it("wraps with the language tag and appends a final period", () => {
    expect(preprocessText("Hello, I'm G with OCG. Thanks for stopping by", "en")).toBe(
      "<en>Hello, I'm G with OCG. Thanks for stopping by.</en>");
  });
  it("collapses duplicate quotes and whitespace", () => {
    expect(preprocessText('He said "hello"  twice', "en")).toBe('<en>He said "hello" twice.</en>');
  });
  it("removes emoji", () => {
    expect(preprocessText("Great news 😀 for your home!", "en")).toBe("<en>Great news for your home!</en>");
  });
  it("expands e.g. and i.e.", () => {
    expect(preprocessText("See e.g., the listing, i.e., the one on Main St.", "en")).toBe(
      "<en>See for example, the listing, that is, the one on Main St.</en>");
  });
  it("maps em/en dashes to hyphen", () => {
    expect(preprocessText("well—known rates – today", "en")).toBe("<en>well-known rates - today.</en>");
  });
  it("NFKD-decomposes Spanish accents and keeps inverted punctuation", () => {
    expect(preprocessText("¡Hola! ¿Cómo estás? El precio es $310,000.", "es")).toBe(
      "<es>¡Hola! ¿Cómo estás? El precio es $310,000.</es>");
  });
});

class FakeSource {
  onended: (() => void) | null = null;
  buffer: unknown = null;
  connect() {}
  start() { queueMicrotask(() => this.onended?.()); }
  stop() { this.onended = null; }
}
class FakeCtx {
  state = "running";
  destination = {};
  createBuffer(_ch: number, len: number) {
    return { copyToChannel: () => {}, length: len };
  }
  createBufferSource() { return new FakeSource(); }
  async resume() {}
  async close() {}
}

describe("GBrowserSpeech — playback + stop semantics with a fake engine", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", FakeCtx);
  });

  function makeSpeech() {
    const events = { onStart: vi.fn(), onEnd: vi.fn(), onError: vi.fn() };
    const speech = new GBrowserSpeech();
    const synth = vi.fn(async (text: string) => ({
      wav: new Float32Array(4410), durationSeconds: 0.1, synthMs: 1,
    }));
    __setBrowserEngineForTests({ ready: true, sampleRate: 44100, synthesize: synth }, {});
    return { speech, events, synth };
  }

  it("speaks every planned segment and fires onStart/onEnd once", async () => {
    const { speech, events, synth } = makeSpeech();
    await speech.speak("First point here. Second point follows.", { lang: "en" }, events);
    expect(synth.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(events.onStart).toHaveBeenCalledTimes(1);
    expect(events.onEnd).toHaveBeenCalledTimes(1);
    expect(events.onError).not.toHaveBeenCalled();
  });

  it("stop() cancels remaining segments — nothing plays after stop", async () => {
    const { speech, events, synth } = makeSpeech();
    const p = speech.speak("One segment here. Two follows now. Three ends it.", { lang: "en" }, events);
    speech.stop();
    await p;
    // Synthesis may have been in flight for one segment, but onEnd must
    // not fire and no further segments may start after the stop.
    expect(events.onEnd).not.toHaveBeenCalled();
    const callsAtStop = synth.mock.calls.length;
    await new Promise((r) => setTimeout(r, 10));
    expect(synth.mock.calls.length).toBe(callsAtStop);
  });

  it("stop() during ACTIVE playback settles the speak() promise (QUINCEY D2)", async () => {
    // A source that never ends on its own: without the stop race, the
    // speak() promise would hang forever after stop() nulls onended.
    class HeldSource {
      onended: (() => void) | null = null;
      buffer: unknown = null;
      connect() {}
      start() { /* held: never ends */ }
      stop() { /* onended was already nulled by the provider */ }
    }
    vi.stubGlobal("AudioContext", class extends FakeCtx {
      createBufferSource() { return new HeldSource(); }
    });
    const { speech, events } = makeSpeech();
    let settled = false;
    const p = speech.speak("A single held segment.", { lang: "en" }, events)
      .then(() => { settled = true; });
    await new Promise((r) => setTimeout(r, 25));
    expect(events.onStart).toHaveBeenCalledTimes(1);
    speech.stop();
    await Promise.race([p, new Promise((r) => setTimeout(r, 250))]);
    expect(settled).toBe(true);
    expect(events.onEnd).not.toHaveBeenCalled();
  });

  it("lookahead: the next segment synthesizes while the current one plays", async () => {
    class HeldSource {
      onended: (() => void) | null = null;
      buffer: unknown = null;
      connect() {}
      start() { /* held: playback in progress */ }
      stop() {}
    }
    vi.stubGlobal("AudioContext", class extends FakeCtx {
      createBufferSource() { return new HeldSource(); }
    });
    const { speech, events, synth } = makeSpeech();
    const p = speech.speak("First segment here. Second segment follows.", { lang: "en" }, events);
    await new Promise((r) => setTimeout(r, 30));
    // Segment 1 is still "playing" (held), yet segment 2's synthesis
    // must already have been requested.
    expect(events.onStart).toHaveBeenCalledTimes(1);
    expect(synth.mock.calls.length).toBe(2);
    speech.stop();
    await p;
    expect(events.onEnd).not.toHaveBeenCalled();
  });

  it("reports onError (not silence) when synthesis fails", async () => {
    const { speech, events } = makeSpeech();
    __setBrowserEngineForTests({
      ready: true, sampleRate: 44100,
      synthesize: vi.fn(async () => { throw new Error("boom"); }),
    }, {});
    await speech.speak("Hello there.", { lang: "en" }, events);
    expect(events.onError).toHaveBeenCalledTimes(1);
    expect(events.onEnd).not.toHaveBeenCalled();
  });
});
