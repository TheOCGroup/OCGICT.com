import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression pin for the 2026-10-28 rate-limit repair: every Netlify
 * function that declares a platform rate limit must use the documented
 * aggregateBy array form ["ip", "domain"] (Netlify docs, rate-limiting).
 * The bare-string form shipped for months with no observed enforcement;
 * these tests fail if any function regresses to it or drops its limit.
 * Enforcement itself is proven by live isolated tests (see
 * FINAL-RELEASE-PACKAGE.md), not by this file.
 */
const FUNCTIONS_DIR = join(process.cwd(), "netlify", "functions");

const EXPECTED_LIMITS: Record<string, number> = {
  "g-chat.mts": 30,
  "g-lead.mts": 10,
  "g-tts-gemini.mts": 40,
  "g-tts.mts": 20,
  "g-voice-session.mts": 20,
  "seller-action.mts": 10,
  "seller-lookup.mts": 20,
  "seller-offer.mts": 10,
  "seller-suggestions.mts": 30,
};

function source(file: string): string {
  return readFileSync(join(FUNCTIONS_DIR, file), "utf8");
}

describe("platform rate-limit declarations", () => {
  it("no function uses the bare-string aggregateBy form", () => {
    for (const file of readdirSync(FUNCTIONS_DIR)) {
      if (!file.endsWith(".mts")) continue;
      expect(source(file), file).not.toMatch(/aggregateBy:\s*"/);
    }
  });

  it("every function declares the documented array form with its expected limit", () => {
    for (const [file, limit] of Object.entries(EXPECTED_LIMITS)) {
      const src = source(file);
      expect(src, file).toContain('aggregateBy: ["ip", "domain"]');
      expect(src, file).toContain(`windowLimit: ${limit}`);
      expect(src, file).toContain("windowSize: 60");
      expect(src, file).toContain('action: "rate_limit"');
    }
  });

  it("no function file is missing from the expected-limits table", () => {
    const files = readdirSync(FUNCTIONS_DIR).filter((f) => f.endsWith(".mts")).sort();
    expect(files).toEqual(Object.keys(EXPECTED_LIMITS).sort());
  });
});
