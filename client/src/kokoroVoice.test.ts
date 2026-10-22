import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as gProfileModule from "../../server/voice/gProfile";
import { G_VOICE_PROFILE, engineForEnv, gVoiceProfile, rolloutEnabled, voiceForEngineLanguage, voiceForLanguage } from "../../server/voice/gProfile";
import { KokoroHttpProvider } from "../../server/voice/voiceProvider";
import { dailyLimit } from "../../server/services/gBudget";
// @ts-ignore - Node ESM handler under test
import ttsHandler from "../../netlify/functions/g-tts.mts";

describe("G's voice profile (owned by OCGICT only)", () => {
  it("holds exactly G's audition selection", () => {
    expect(gVoiceProfile()).toMatchObject({
      enVoice: "am_michael",
      enAlternate: "am_adam",
      esVoice: "em_alex",
      supertonicEnVoice: "M1",
      supertonicEsVoice: "M1",
      speed: 1.0,
      fallbackProvider: "vapi-realtime",
      rolloutEnv: "OCG_G_KOKORO_TTS_ENABLED",
      engineEnv: "OCG_G_TTS_ENGINE",
    });
    expect(G_VOICE_PROFILE).toBe(gVoiceProfile());
  });

  it("carries no other agent's runtime profile — their profiles live in their own products", () => {
    expect(Object.keys(gProfileModule).sort()).toEqual(
      ["G_VOICE_PROFILE", "engineForEnv", "gVoiceProfile", "rolloutEnabled", "voiceForEngineLanguage", "voiceForLanguage"].sort(),
    );
  });

  it("selects the engine from G's env switch, defaulting to the kokoro baseline", () => {
    const p = gVoiceProfile();
    expect(engineForEnv(p, {})).toBe("kokoro");
    expect(engineForEnv(p, { OCG_G_TTS_ENGINE: "kokoro" })).toBe("kokoro");
    expect(engineForEnv(p, { OCG_G_TTS_ENGINE: "supertonic" })).toBe("supertonic");
    expect(engineForEnv(p, { OCG_G_TTS_ENGINE: "anything-else" })).toBe("kokoro");
  });

  it("maps voices per engine and language", () => {
    const p = gVoiceProfile();
    expect(voiceForEngineLanguage(p, "kokoro", "en")).toEqual({ voice: "am_michael", serviceLang: "en-us" });
    expect(voiceForEngineLanguage(p, "kokoro", "es")).toEqual({ voice: "em_alex", serviceLang: "es" });
    expect(voiceForEngineLanguage(p, "supertonic", "en")).toEqual({ voice: "M1", serviceLang: "en" });
    expect(voiceForEngineLanguage(p, "supertonic", "es")).toEqual({ voice: "M1", serviceLang: "es" });
  });

  it("keeps G's rollout flag off unless explicitly enabled for G", () => {
    expect(rolloutEnabled(G_VOICE_PROFILE, {})).toBe(false);
    expect(rolloutEnabled(G_VOICE_PROFILE, { OCG_G_KOKORO_TTS_ENABLED: "yes" })).toBe(false);
    expect(rolloutEnabled(G_VOICE_PROFILE, { OCG_G_KOKORO_TTS_ENABLED: "true" })).toBe(true);
    // Another agent's flag never enables G.
    expect(rolloutEnabled(G_VOICE_PROFILE, { OCG_AIDEN_KOKORO_TTS_ENABLED: "true" })).toBe(false);
    expect(rolloutEnabled(G_VOICE_PROFILE, { OCG_PIPER_KOKORO_TTS_ENABLED: "true" })).toBe(false);
  });

  it("routes Spanish to G's Spanish voice and everything else to his EN primary", () => {
    expect(voiceForLanguage(G_VOICE_PROFILE, "es")).toEqual({ voice: "em_alex", serviceLang: "es" });
    expect(voiceForLanguage(G_VOICE_PROFILE, "es-MX")).toEqual({ voice: "em_alex", serviceLang: "es" });
    expect(voiceForLanguage(G_VOICE_PROFILE, "en")).toEqual({ voice: "am_michael", serviceLang: "en-us" });
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

  it("passes the engine selection through and reports the engine that answered", async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "X-OCG-Gen-Seconds": "0.5", "X-OCG-Audio-Seconds": "1.0", "X-OCG-Sample-Rate": "44100", "X-OCG-Engine": "supertonic" },
    }));
    const provider = new KokoroHttpProvider({ baseUrl: "http://tts.local", apiKey: "k", fetchFn: fetchFn as any });
    const result = await provider.synthesize({ text: "Hola", voice: "M1", lang: "es", engine: "supertonic" });
    const [, init] = fetchFn.mock.calls[0] as any[];
    expect(JSON.parse(init.body)).toMatchObject({ text: "Hola", voice: "M1", lang: "es", engine: "supertonic" });
    expect(result.engine).toBe("supertonic");
    expect(result.sampleRate).toBe(44100);
  });

  it("omits the engine field entirely when none is requested (v1 wire compat)", async () => {
    const fetchFn = vi.fn(async () => new Response(new Uint8Array([1]), { status: 200, headers: {} }));
    const provider = new KokoroHttpProvider({ baseUrl: "http://tts.local", apiKey: "k", fetchFn: fetchFn as any });
    await provider.synthesize({ text: "Hi", voice: "am_michael", lang: "en-us" });
    const [, init] = fetchFn.mock.calls[0] as any[];
    expect(JSON.parse(init.body)).not.toHaveProperty("engine");
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

  it("GET reports enabled when the flag and service are configured (meter unreadable falls back to the config answer)", async () => {
    process.env.OCG_G_KOKORO_TTS_ENABLED = "true";
    process.env.OCG_KOKORO_TTS_URL = "http://tts.local";
    process.env.OCG_KOKORO_TTS_KEY = "k";
    const res = await ttsHandler(new Request("https://example.invalid/api/g/tts", { method: "GET" }));
    const data = await res.json();
    expect(data.enabled).toBe(true);
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
