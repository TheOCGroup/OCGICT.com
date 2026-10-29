import { checkBudget, consumeBudget, netlifyBlobsBudgetStore } from "../../server/services/gBudget.js";
import { jsonError, jsonHeaders } from "./_forms.js";
import { consumeRateLimit, clientIdFromRequest, rateLimitActive } from "../../server/services/gRateLimit.js";

/**
 * G realtime voice (Vapi Web) — configuration and session issuance.
 *
 * GET  /api/g/voice/session → public state: whether realtime voice is enabled,
 *                             and if not, the plain reason. Never returns keys.
 * POST /api/g/voice/session → issues ONE metered voice session when every gate
 *                             passes: founder enable flag, Vapi public key and
 *                             the G assistant ID configured, and the persistent
 *                             daily budget admits another session. Fail-closed.
 *
 * G's assistant is its own Vapi identity (see docs/g-vapi-assistant.json),
 * built on the shared OCG conversational layer. It is never Aiden or Maya.
 */

const MAX_DURATION_SECONDS = 600; // 10 minutes, hard cap per session

function voiceGate(env: Record<string, string | undefined>): { open: boolean; reason?: string } {
  if (env.OCG_G_VOICE_ENABLED !== "true") {
    return { open: false, reason: "Realtime voice is not enabled for this site yet." };
  }
  if (!(env.VAPI_PUBLIC_KEY || "").trim() || !(env.OCG_G_VAPI_ASSISTANT_ID || "").trim()) {
    return { open: false, reason: "Realtime voice is not configured for this site yet." };
  }
  return { open: true };
}

export default async function handler(request: Request, context?: { ip?: string; deploy?: { context?: string } }): Promise<Response> {
  const env = process.env as Record<string, string | undefined>;
  const gate = voiceGate(env);

  if (request.method === "GET") {
    let enabled = gate.open;
    let reason = gate.open ? undefined : gate.reason;
    if (gate.open) {
      // Reflect today's budget in the status: an exhausted day must not be
      // reported as available. If the meter cannot be read here, leave the
      // config answer in place — POST remains the fail-closed arbiter.
      try {
        const store = await netlifyBlobsBudgetStore();
        const budget = await checkBudget(store, "voice", env);
        if (!budget.allowed) {
          enabled = false;
          reason = "Voice has reached today's session limit. Text chat is ready, or please try again tomorrow.";
        }
      } catch {
        /* meter unreadable: POST arbitrates */
      }
    }
    return new Response(
      JSON.stringify({
        enabled,
        reason,
        maxDurationSeconds: MAX_DURATION_SECONDS,
        mode: enabled ? "vapi-web" : "browser-fallback",
      }),
      { status: 200, headers: jsonHeaders },
    );
  }

  if (request.method !== "POST") return jsonError(405, "Method not allowed.");
  if (!gate.open) return jsonError(503, gate.reason || "Realtime voice is unavailable.");

  // Shared-store rate limit, enforced before the daily budget so limited
  // callers consume no budget. Atomic across instances, fail-closed.
  if (rateLimitActive(context, env)) {
    try {
      const rl = await consumeRateLimit(await netlifyBlobsBudgetStore(), "voice", clientIdFromRequest(request, context), env);
      if (!rl.allowed) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
          status: 429,
          headers: { ...jsonHeaders, "Retry-After": String(rl.retryAfterSeconds) },
        });
      }
    } catch {
      return jsonError(503, "Voice is temporarily unavailable. Text chat is ready.");
    }
  }

  // Persistent budget gate: a session is issued only if today's meter admits
  // it. If the meter itself is unavailable, paid voice fails closed.
  let decision;
  try {
    const store = await netlifyBlobsBudgetStore();
    decision = await consumeBudget(store, "voice", env);
  } catch {
    return jsonError(503, "Voice is temporarily unavailable. Text chat is ready.");
  }
  if (!decision.allowed) {
    return jsonError(429, "Voice has reached today's session limit. Text chat is ready, or please try again tomorrow.");
  }

  return new Response(
    JSON.stringify({
      publicKey: (env.VAPI_PUBLIC_KEY || "").trim(),
      assistantId: (env.OCG_G_VAPI_ASSISTANT_ID || "").trim(),
      maxDurationSeconds: MAX_DURATION_SECONDS,
      sessionsUsedToday: decision.used,
      dailySessionLimit: decision.limit,
    }),
    { status: 200, headers: jsonHeaders },
  );
}

export const config = {
  path: "/api/g/voice/session",
  method: ["GET", "POST"],
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
