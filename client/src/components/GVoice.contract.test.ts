import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const code = readFileSync(new URL("./GExperience.tsx", import.meta.url), "utf8");
describe("G voice fail-closed contract", () => {
  it("never falls back to an arbitrary locale voice", () => {
    expect(code).toContain("maleName.test(v.name)");
    expect(code).not.toMatch(/\|\| matching\[0\]/);
    expect(code).not.toMatch(/\|\| matching.find\(v => v.lang.toLowerCase\(\) === locale.toLowerCase\(\)\)/);
  });
  it("does not speak when no recognized male voice exists", () => {
    expect(code).toMatch(/if \(!voice\) \{[\s\S]*?return;[\s\S]*?\}\s*voiceLocaleRef/);
  });
  it("rearms microphone when no TTS voice is available", () => {
    expect(code).toMatch(/if \(!voice\) \{[\s\S]*?startListening\(\);[\s\S]*?return;/);
  });
  it("retains click to interrupt and microphone rearm behavior", () => {
    expect(code).toContain("window.speechSynthesis.speak(speech)");
    expect(code).toContain("startListening();");
  });
});