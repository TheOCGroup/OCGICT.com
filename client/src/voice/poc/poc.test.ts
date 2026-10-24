/**
 * POC sentence segmenter tests: the segmenter decides when streamed
 * tokens become speakable sentences — it is the first-audio latency
 * mechanism of the Option C POC, so its incremental behavior is pinned
 * exactly (segments emit mid-stream, never wait for the full reply).
 */
import { describe, expect, it } from "vitest";
import { SentenceSegmenter } from "./sentenceSplit";

describe("SentenceSegmenter", () => {
  it("emits a sentence as soon as its ender + whitespace arrive", () => {
    const s = new SentenceSegmenter();
    expect(s.push("We buy houses in any condition")).toEqual([]);
    expect(s.push(". ")).toEqual(["We buy houses in any condition."]);
    expect(s.push("What condition is yours in?")).toEqual([]);
    expect(s.flush()).toBe("What condition is yours in?");
  });

  it("handles token-sized deltas without splitting words", () => {
    const s = new SentenceSegmenter();
    const out: string[] = [];
    for (const tok of ["Hola", ", ", "¿en", " qué", " le", " puedo", " ayudar", " hoy", "? ", "Cuénteme", " más", "."]) {
      out.push(...s.push(tok));
    }
    expect(out).toEqual(["Hola, ¿en qué le puedo ayudar hoy?"]);
    expect(s.flush()).toBe("Cuénteme más.");
  });

  it("cuts an over-long sentence at clause boundaries", () => {
    const s = new SentenceSegmenter({ softCap: 60 });
    const long = "We look at recent comparable sales in your neighborhood, the repairs the home needs, and the real costs of holding it";
    const out = s.push(long);
    expect(out.length).toBe(2);
    expect(out.every((seg) => seg.endsWith(",") && seg.length <= 60)).toBe(true);
    expect(s.flush()).toBe("and the real costs of holding it");
  });

  it("does not emit tiny fragments as sentences", () => {
    const s = new SentenceSegmenter();
    expect(s.push("No. ")).toEqual([]);
    expect(s.flush()).toBe("No.");
  });

  it("flush on empty buffer returns null", () => {
    const s = new SentenceSegmenter();
    expect(s.flush()).toBeNull();
  });
});
