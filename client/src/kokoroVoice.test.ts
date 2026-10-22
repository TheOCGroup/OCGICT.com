import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_VOICE_PROFILES, auditionVoiceIds, profileFor, rolloutEnabled, voiceForLanguage } from "../../server/voice/profiles";
import { KokoroHttpProvider } from "../../server/voice/voiceProvider";
import { dailyLimit } from "../../server/services/gBudget";
// @ts-ignore - Node ESM handler under test
import ttsHandler from "../../netlify/functions/g-tts.mts";

describe("shared agent voice profiles", () => {
  it("defines exactly the five OCG agents with distinct primary voices", () => {
    const ids = Object.keys(AGENT_VOICE_PROFILES).sort();
    expect(ids).toEqual(["aiden", "g", "orion", "piper", "ted"]);
    const primaries = Object.values(AGENT_VOICE_PROFILES).map((p) => p.enVoice);
    expect(new Set(primaries).size).toBe(5);
  });

  it("matches the founder's audition table", () => {
    expect(profileFor("g")).toMatchObject({ enVoice: "am_michael", enAlternate: "am_adam", esVoice: "em_alex" });
    expect(profileFor("aiden")).toMatchObject({ enVoice: "am_adam", enAlternate: "am_michael" });
    expect(profileFor("piper")).toMatchObject({ enVoice: "af_heart", enAlternate: "af_bella", esVoice: "ef_dora" });
    expect(profileFor("ted")).toMatchObject({ enVoice: "am_eric", enAlternate: "am_michael" });
    expect(profileFor("orion")).toMatchObject({ enVoice: "am_puck", enAlternate: "am_liam" });
    expect(auditionVoiceIds()).toEqual(
      ["af_bella", "af_heart", "am_adam", "am_eric", "am_liam", "am_michael", "am_puck", "ef_dora", "em_alex"].sort(),
    );
  });

  it("keeps every rollout flag off unless explicitly enabled per agent", () => {
    for (const p of Object.values(AGENT_VOICE_PROFILES)) {
      expect(rolloutEnabled(p, {})).toBe(false);
      expect(rolloutEnabled(p, { [p.rolloutEnv]: "yes" })).toBe(false);
    }
    expect(rolloutEnabled(profileFor("g")!, { OCG_G_KOKORO_TTS_ENABLED: "true" })).toBe(true);
    // One agent's flag never enables another agent.
    expect(rolloutEnabled(profileFor("aiden")!, { OCG_G_KOKORO_TTS_ENABLED: "true" })).toBe(false);
  });

  it("routes Spanish to the Spanish voice and everything else to the EN primary", () => {
    const g = profileFor("g")!;
    expect(voiceForLanguage(g, "es")).toEqual({ voice: "em_alex", serviceLang: "es" });
    expect(voiceForLanguage(g, "es-MX")).toEqual({ voice: "em_alex", serviceLang: "es" });
    expect(voiceForLanguage(g, "en")).toEqual({ voice: "am_michael", serviceLang: "en-us" });
    expect(voiceForLanguage(profileFor("piper")!, "es")).toEqual({ voice: "ef_dora", serviceLang: "es" });
  });

  it("meters Kokoro synthesis under its own capped budget kind", () => {
    expect(dailyLimit("tts", {})).toBe(300);
    expect(dailyLimit("tts", { OCG_G_TTS_DAILY_LIMIT: "50" })).toBe(50);
    expect(dailyLimit("tts", { OCG_G_TTS_DAILY_LIMIT: "999999" })).toBe(5000);
  });
});

describe("KokoroHttpProvider", () => {
  it("is unconfigured (null) without both service URL and key", () => {
    expect(KokoroHttpProvider.fromEnv({})).toBeNull();
    expect(KokoroHttpProvider.fromEnv({ OCG_KOKORO_TTS_URL: "http://x" })).toBeNull();
    expect(KokoroHttpProvider.fromEnv({ OCG_KOKORO_TTS_KEY: "k" })).toBeNull();
    expect(KokoroHttpProvider.fromEnv({ OCG_KOKORO_TTS_URL: "http://x", OCG_KOKORO_TTS_KEY: "k" })).not.toBeNull();
  });

  it("synthesizes via the service and surfaces its timing headers", async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "X-OCG-Gen-Seconds": "1.25", "X-OCG-Audio-Seconds": "2.5", "X-OCG-Sample-Rate": "24000" },
    }));
    const provider = new KokoroHttpProvider({ baseUrl: "http://tts.local/", apiKey: "secret", fetchFn: fetchFn as any });
    const result = await provider.synthesize({ text: "Hello", voice: "am_michael", lang: "en-us" });
    expect(result.provider).toBe("kokoro-http");
    expect(result.genSeconds).toBe(1.25);
    expect(result.audioSeconds).toBe(2.5);
    expect(result.sampleRate).toBe(24000);
    const [url, init] = fetchFn.mock.calls[0] as any[];
    expect(url).toBe("http://tts.local/tts");
    expect(init.headers["X-OCG-TTS-Key"]).toBe("secret");
  });

  it("throws on a service error instead of returning silence", async () => {
    const fetchFn = vi.fn(async () => new Response("nope", { status: 500 }));
    const provider = new KokoroHttpProvider({ baseUrl: "http://tts.local", apiKey: "k", fetchFn: fetchFn as any });
    await expect(provider.synthesize({ text: "Hi", voice: "am_michael", lang: "en-us" })).rejects.toThrow(/500/);
  });
});

describe("g-tts endpoint gates", () => {
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

  it("GET reports disabled by default with a plain reason", async () => {
    const res = await ttsHandler(new Request("https://example.invalid/api/g/tts", { method: "GET" }));
    const data = await res.json();
    expect(data.enabled).toBe(false);
    expect(JSON.stringify(data)).not.toContain("secret");
  });

  it("POST refuses while the rollout flag is off, even if the service is configured", async () => {
    process.env.OCG_KOKORO_TTS_URL = "http://tts.local";
    process.env.OCG_KOKORO_TTS_KEY = "k";
    const res = await ttsHandler(new Request("https://example.invalid/api/g/tts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Hello" }),
    }));
    expect(res.status).toBe(503);
  });

  it("POST fails closed when the budget meter is unavailable", async () => {
    process.env.OCG_G_KOKORO_TTS_ENABLED = "true";
    process.env.OCG_KOKORO_TTS_URL = "http://tts.local";
    process.env.OCG_KOKORO_TTS_KEY = "k";
    // No Netlify Blobs context in the test runtime: paid/compute work must
    // refuse rather than synthesize unmetered.
    const res = await ttsHandler(new Request("https://example.invalid/api/g/tts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "Hello" }),
    }));
    expect(res.status).toBe(503);
  });

  it("rejects empty and oversized text before any synthesis", async () => {
    process.env.OCG_G_KOKORO_TTS_ENABLED = "true";
    process.env.OCG_KOKORO_TTS_URL = "http://tts.local";
    process.env.OCG_KOKORO_TTS_KEY = "k";
    const empty = await ttsHandler(new Request("https://example.invalid/api/g/tts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "  " }),
    }));
    expect(empty.status).toBe(400);
    const huge = await ttsHandler(new Request("https://example.invalid/api/g/tts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "x".repeat(1201) }),
    }));
    expect(huge.status).toBe(413);
  });
});
