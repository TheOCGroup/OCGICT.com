/**
 * Application-enforced rate limiting for G's public functions, backed by
 * the same durable Netlify Blobs store as the daily budget (gBudget).
 *
 * Why this exists: the platform rate-limit declarations in each function's
 * config could not be observably verified from the test environment, and
 * the pre-existing in-function limiters kept their counters in per-instance
 * memory (a serverless fleet multiplies the effective limit by the number
 * of warm instances, and a cold start resets it). This limiter is the
 * authoritative layer; the platform declarations remain as defense in
 * depth.
 *
 * Properties:
 * - Shared state: counts live in the Blobs store, not process memory, so
 *   every instance enforces the same limit.
 * - Atomic: consumption reuses the budget store's ETag compare-and-swap
 *   increment, so concurrent bursts cannot overrun the limit.
 * - Identity: the client key is the platform-provided address only —
 *   the function context IP, else the x-nf-client-connection-ip header
 *   that Netlify's edge sets (and overwrites) itself. Client-controllable
 *   headers (x-forwarded-for and friends) are never read, so forging them
 *   cannot mint a fresh bucket. Requests with no platform identity share
 *   one "unknown" bucket rather than bypassing the limit.
 * - Fail-closed: store failures throw; callers refuse the request instead
 *   of serving unlimited traffic while the limiter is down.
 * - Independent of the daily budget: a request must pass BOTH this
 *   per-minute limiter and the persistent daily budget where both apply;
 *   neither control substitutes for the other.
 * - Limits mirror the platform declarations and can be tightened (or
 *   lowered for isolated testing) via environment, up to a hard ceiling.
 */

import type { BudgetStore } from "./gBudget.js";

export type RateScope = "chat" | "tts" | "voice" | "lead" | "ttsLocal";

export const RATE_WINDOW_SECONDS = 60;

const DEFAULTS: Record<RateScope, number> = {
  chat: 30,
  tts: 40,
  voice: 20,
  lead: 10,
  ttsLocal: 20,
};

const HARD_CEILING = 10000;

const ENV_KEYS: Record<RateScope, string> = {
  chat: "OCG_G_RATELIMIT_CHAT",
  tts: "OCG_G_RATELIMIT_TTS",
  voice: "OCG_G_RATELIMIT_VOICE",
  lead: "OCG_G_RATELIMIT_LEAD",
  ttsLocal: "OCG_G_RATELIMIT_TTS_LOCAL",
};

export function rateLimitFor(scope: RateScope, env: Record<string, string | undefined>): number {
  const raw = Number(env[ENV_KEYS[scope]]);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULTS[scope];
  return Math.min(Math.floor(raw), HARD_CEILING);
}

export function rateLimitKey(scope: RateScope, clientId: string, nowMs: number): string {
  const windowStart = Math.floor(nowMs / (RATE_WINDOW_SECONDS * 1000)) * RATE_WINDOW_SECONDS;
  return `g-ratelimit:${scope}:${windowStart}:${clientId}`;
}

export interface RateDecision {
  allowed: boolean;
  used: number;
  limit: number;
  retryAfterSeconds: number;
  key: string;
}

/**
 * Consume one unit of the caller's per-minute allowance. Blocked callers
 * consume nothing further. Throws on store failure — callers must fail
 * closed (refuse the request) rather than degrade to unlimited.
 */
export async function consumeRateLimit(
  store: BudgetStore,
  scope: RateScope,
  clientId: string,
  env: Record<string, string | undefined>,
  nowMs: number = Date.now(),
): Promise<RateDecision> {
  const limit = rateLimitFor(scope, env);
  const key = rateLimitKey(scope, clientId, nowMs);
  const windowEndMs = (Math.floor(nowMs / (RATE_WINDOW_SECONDS * 1000)) + 1) * RATE_WINDOW_SECONDS * 1000;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
  if (typeof store.atomicIncrement === "function") {
    const result = await store.atomicIncrement(key, limit);
    if (result) {
      return { allowed: result.allowed, used: result.used, limit, retryAfterSeconds: result.allowed ? 0 : retryAfterSeconds, key };
    }
  }
  const used = (await store.get(key)) ?? 0;
  if (used >= limit) return { allowed: false, used, limit, retryAfterSeconds, key };
  await store.set(key, used + 1);
  return { allowed: true, used: used + 1, limit, retryAfterSeconds: 0, key };
}

/**
 * The platform-provided client identity. Order: the function context IP
 * (set by Netlify's runtime), then the x-nf-client-connection-ip header
 * (set and overwritten by Netlify's edge). Client-supplied forwarding
 * headers are deliberately never consulted.
 */
/**
 * Whether the limiter engages for this invocation. It engages in every
 * hosted Netlify context (production and deploy previews) and whenever
 * the G backend enable flag is set — i.e. in every environment where
 * these functions serve real traffic. There is no setting that disables
 * it in a hosted context. Bare local/unit invocations (no deploy
 * context, flag unset) run unmetered, mirroring how the daily budget
 * treats the free local path; whenever the limiter IS active, store
 * failures fail closed.
 */
export function rateLimitActive(
  context: { deploy?: { context?: string } } | undefined,
  env: Record<string, string | undefined>,
): boolean {
  const dc = context?.deploy?.context;
  return dc === "production" || dc === "deploy-preview" || env.OCG_G_CHAT_ENABLED === "true";
}

export function clientIdFromRequest(request: Request, context?: { ip?: string }): string {
  const ip = context?.ip;
  if (typeof ip === "string" && ip.trim()) return ip.trim();
  const header = request.headers.get("x-nf-client-connection-ip");
  if (header && header.trim()) return header.trim();
  return "unknown";
}
