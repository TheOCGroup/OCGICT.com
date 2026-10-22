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
import { GBrowserSpeech, __setBrowserEngineForTests } from "./gBrowserSpeech";
import { browserVoiceFlagEnabled } from "./browserVoiceFlag";

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
