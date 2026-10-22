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
  it("guards the connect window against double-start and orphaned sessions", () => {
    expect(voiceModule).toContain("this.starting");
    expect(voiceModule).toContain("this.cancelled");
  });
});

describe("G Kokoro speech integration contract", () => {
  const experience = code;
  const kokoroModule = readFileSync(new URL("../voice/gKokoroSpeech.ts", import.meta.url), "utf8");
  it("probes the server gate and speaks through /api/g/tts, never directly to the service", () => {
    expect(kokoroModule).toContain("/api/g/tts");
    expect(kokoroModule).not.toContain("OCG_KOKORO_TTS_KEY");
    expect(experience).toContain("GKokoroSpeech");
    expect(experience).toContain("kokoroAvailable");
  });
  it("labels the shared-voice path in plain visitor language, distinctly from the basic fallback", () => {
    // TED ruling (2026-10-21): the engine's name never appears on the
    // visitor surface; the mode is "OCG voice (preview)".
    expect(experience).toContain("OCG voice (preview)");
    expect(experience).toContain("OCG voice ready (preview)");
    expect(experience).toContain("Basic browser voice");
    expect(experience).not.toContain("Kokoro voice ready");
    expect(experience).not.toContain("<strong>Kokoro voice:</strong>");
    expect(experience).not.toContain("(self-hosted, in evaluation)");
  });
  it("never swaps engines silently and never leaves dead air unexplained", () => {
    expect(experience).toContain("That reply used the basic browser voice");
    expect(experience).toContain("G is about to speak…");
  });
  it("stops Kokoro playback on every interrupt path (stop, typing, listening)", () => {
    expect(experience).toContain("stopAllSpeech");
    expect(kokoroModule).toContain("revokeObjectURL");
  });
});