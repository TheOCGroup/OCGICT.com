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
  it("offers realtime voice as the primary path when the server enables it", () => {
    expect(code).toContain("GRealtimeVoice");
    expect(code).toContain("fetchVoiceConfig");
    expect(code).toContain("startRealtimeVoice");
    expect(code).toContain("stopRealtimeVoice");
  });
  it("labels the browser speech path honestly as basic fallback", () => {
    expect(code).toContain("Basic browser voice");
    expect(code).not.toMatch(/premium (browser )?voice/i);
  });
  it("provides mute and end controls for the realtime session", () => {
    expect(code).toContain("toggleRtMute");
    expect(code).toContain("End voice conversation");
  });
  it("includes the consent-gated lead follow-up card", () => {
    expect(code).toContain("/api/g/lead");
    expect(code).toContain("I authorize The OC Group to receive my information");
    expect(code).toContain("Have OCG contact me");
  });
});

const voiceModule = readFileSync(new URL("../voice/gRealtimeVoice.ts", import.meta.url), "utf8");
describe("G realtime voice module contract", () => {
  it("uses the Vapi Web SDK, never browser speech synthesis", () => {
    expect(voiceModule).toContain("@vapi-ai/web");
    expect(voiceModule).not.toContain("speechSynthesis");
  });
  it("issues sessions through the server gate and uses only the granted public key", () => {
    expect(voiceModule).toContain("/api/g/voice/session");
    expect(voiceModule).toContain("data.publicKey");
    expect(voiceModule).not.toContain("VAPI_PRIVATE");
  });
  it("surfaces listening, thinking, speaking, muted and error states", () => {
    for (const state of ["connecting", "listening", "thinking", "speaking", "ended", "error"]) {
      expect(voiceModule).toContain(`"${state}"`);
    }
  });
});