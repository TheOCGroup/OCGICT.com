/**
 * G POC TTS — server-side neural speech for the architecture-reset proof of
 * concept (Option C). Synthesizes ONE sentence per request with Gemini TTS
 * and returns WAV, so the client can start playing the first sentence while
 * the rest of the reply is still generating. No on-device model download,
 * no dependence on the visitor's CPU.
 *
 * Gates mirror the rest of G: hosted contexts only (or the explicit chat
 * enable flag), a configured Gemini key, and the persistent daily "tts"
 * budget meter, fail-closed. The key is never exposed to the browser.
 * The voice defaults to POC_TTS_VOICE (Achird — founder-selected
 * 2026-10-24); callers may choose another allowlisted candidate.
 */
import { consumeBudget, netlifyBlobsBudgetStore } from "../../server/services/gBudget.js";
import { synthesizeGeminiSpeech, effectiveTtsModel, POC_TTS_VOICE, POC_VOICE_CANDIDATES } from "../../server/services/geminiStream.js";

export const config = {
  path: "/api/g/tts-gemini",
  // Platform-enforced per-IP limit (edge, instance-independent). The
  // in-memory limiter below is only a per-instance burst smoother; the
  // persistent daily budget is the authoritative spend control.
  // aggregateBy uses the documented array form (Netlify docs,
  // rate-limiting): the bare string "ip" used elsewhere in this repo is
  // NOT the documented shape and may be silently inert — see
  // RELEASE-PACKAGE.md §2.
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 40 },
};

const MAX_TEXT_CHARS = 600;
const RATE_LIMIT = 40;
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

function json(status: number, obj: Record<string, unknown>): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export default async function handler(request: Request, context?: { deploy?: { context?: string } }): Promise<Response> {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });
  const hostedContext = context?.deploy?.context === "deploy-preview" || context?.deploy?.context === "production";
  if (!hostedContext && process.env.OCG_G_CHAT_ENABLED !== "true") {
    return json(503, { error: "G backend is not enabled in this environment." });
  }
  if (rateLimited(request)) return json(429, { error: "Too many requests." });

  let body: any;
  try { body = await request.json(); } catch { return json(400, { error: "Invalid JSON." }); }
  if (!body || typeof body.text !== "string" || !body.text.trim() || body.text.length > MAX_TEXT_CHARS) {
    return json(400, { error: "Invalid TTS request." });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) return json(503, { error: "Server voice is not configured." });

  // Fail closed on the persistent daily meter, same as every other G path.
  try {
    const store = await netlifyBlobsBudgetStore();
    const decision = await consumeBudget(store, "tts", process.env);
    if (!decision.allowed) return json(429, { error: "Daily voice budget reached." });
  } catch {
    return json(503, { error: "Voice metering is unavailable." });
  }

  // Voice selection is allowlist-only (founder listening comparison);
  // anything unrecognized falls back to the default candidate.
  const requested = typeof body.voice === "string" ? body.voice : "";
  const voice = (POC_VOICE_CANDIDATES as readonly string[]).includes(requested) ? requested : POC_TTS_VOICE;
  try {
    const wav = await synthesizeGeminiSpeech(body.text.trim(), apiKey, { voice });
    return new Response(wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "X-OCG-Tts-Model": effectiveTtsModel(),
        "X-OCG-Tts-Voice": voice,
      },
    });
  } catch {
    return json(503, { error: "Server voice synthesis failed." });
  }
}
