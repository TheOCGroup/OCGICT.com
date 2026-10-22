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
import { preprocessText } from "./supertonicEngine";
import { GBrowserSpeech, __setBrowserEngineForTests } from "./gBrowserSpeech";

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
