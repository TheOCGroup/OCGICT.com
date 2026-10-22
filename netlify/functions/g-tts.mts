/**
 * G Kokoro TTS — G's adapter to the standalone OCG shared voice service
 * (ocg-voice repository, contract ocg-tts/v1). Spoken replies are
 * synthesized by that self-hosted service instead of the browser's
 * built-in speech. G's voice profile lives in server/voice/gProfile.ts;
 * the other agents' profiles live in their own products.
 *
 * This is a TTS path only: dialogue, ASR, endpointing, and turn-taking
 * stay with G's existing chat/realtime machinery. The endpoint is inert
 * unless the founder configures the service and flips G's rollout flag:
 *
 *   OCG_KOKORO_TTS_URL, OCG_KOKORO_TTS_KEY, OCG_G_KOKORO_TTS_ENABLED=true
 *
 * Synthesis is metered under the persistent daily "tts" budget; every
 * failure mode is fail-closed with an honest status, and the client
 * falls back to labeled basic browser speech when this endpoint is not
 * available. The service key is never exposed to the browser.
 */
import { checkBudget, consumeBudget, netlifyBlobsBudgetStore } from "../../server/services/gBudget.js";
import { gVoiceProfile, rolloutEnabled, voiceForLanguage } from "../../server/voice/gProfile.js";
import { KokoroHttpProvider } from "../../server/voice/voiceProvider.js";

export const config = { path: "/api/g/tts" };

const jsonHeaders = { "Content-Type": "application/json" };
const MAX_TEXT_CHARS = 1200;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(request: Request): boolean {
  const ip = request.headers.get("x-nf-client-connection-ip") || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function gate(env: Record<string, string | undefined>) {
  const profile = gVoiceProfile();
  if (!rolloutEnabled(profile, env)) {
    return { open: false as const, reason: "Kokoro voice is not enabled for this site yet." };
  }
  const provider = KokoroHttpProvider.fromEnv(env);
  if (!provider) {
    return { open: false as const, reason: "Kokoro voice is not configured on the server yet." };
  }
  return { open: true as const, profile, provider };
}

export default async function handler(request: Request): Promise<Response> {
  const env = process.env as Record<string, string | undefined>;
  const g = gate(env);

  if (request.method === "GET") {
    // Report the budget truth too: an exhausted day is "disabled" even
    // when the configuration gate is open. If the meter can't be read,
    // fall back to the configuration answer; POST stays the fail-closed
    // arbiter (same pattern as the realtime voice-session status).
    if (g.open) {
      try {
        const store = await netlifyBlobsBudgetStore();
        const budget = await checkBudget(store, "tts", env);
        if (!budget.allowed) {
          return new Response(
            JSON.stringify({ enabled: false, reason: "Kokoro voice has reached today's limit. Text chat is still ready." }),
            { status: 200, headers: jsonHeaders },
          );
        }
      } catch {
        /* meter unreadable — the configuration answer stands */
      }
    }
    return new Response(
      JSON.stringify({ enabled: g.open, reason: g.open ? undefined : g.reason }),
      { status: 200, headers: jsonHeaders },
    );
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }
  if (!g.open) {
    return new Response(JSON.stringify({ error: g.reason }), { status: 503, headers: jsonHeaders });
  }
  if (rateLimited(request)) {
    return new Response(JSON.stringify({ error: "Too many voice requests. Please wait a moment." }), {
      status: 429,
      headers: jsonHeaders,
    });
  }

  let payload: { text?: unknown; lang?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), { status: 400, headers: jsonHeaders });
  }
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    return new Response(JSON.stringify({ error: "Nothing to say." }), { status: 400, headers: jsonHeaders });
  }
  if (text.length > MAX_TEXT_CHARS) {
    return new Response(JSON.stringify({ error: "That reply is too long to speak." }), {
      status: 413,
      headers: jsonHeaders,
    });
  }
  const lang = typeof payload.lang === "string" ? payload.lang : "en";

  // Meter before synthesis; fail closed when the meter is unavailable.
  try {
    const store = await netlifyBlobsBudgetStore();
    const budget = await consumeBudget(store, "tts", env);
    if (!budget.allowed) {
      return new Response(
        JSON.stringify({ error: "Voice has reached today's limit. Text chat is still ready." }),
        { status: 429, headers: jsonHeaders },
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Voice is unavailable right now. Text chat is still ready." }),
      { status: 503, headers: jsonHeaders },
    );
  }

  const { voice, serviceLang } = voiceForLanguage(g.profile, lang);
  try {
    const result = await g.provider.synthesize({ text, voice, lang: serviceLang, speed: g.profile.speed });
    return new Response(result.wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "X-OCG-Voice": voice,
        "X-OCG-Provider": result.provider,
        ...(result.genSeconds !== undefined ? { "X-OCG-Gen-Seconds": String(result.genSeconds) } : {}),
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Voice synthesis failed. Text chat is still ready." }),
      { status: 502, headers: jsonHeaders },
    );
  }
}
