/**
 * Persistent daily usage budget for G's paid capabilities (chat model + voice).
 *
 * Why this exists: the G release gate blocked all paid model/voice usage until a
 * persistent usage budget could be verified. This module is that budget. It is
 * deliberately conservative:
 * - Counts are stored outside process memory (Netlify Blobs in production), so
 *   restarts and multiple instances share one meter.
 * - Environment variables may set a limit anywhere up to the hard ceiling in
 *   code (including above the defaults); they can never exceed the ceiling.
 *   Raising a ceiling requires a code change, never just a dashboard edit.
 * - Consumption is atomic where the store supports compare-and-swap (the
 *   Netlify Blobs store does, via ETag preconditions): concurrent bursts
 *   cannot overrun the cap. Stores without CAS fall back to check-then-set.
 * - A unit is consumed when access is granted (a paid chat turn is admitted,
 *   a voice session is issued), not when the downstream work finishes; the
 *   meter therefore over-counts failed starts rather than under-charging.
 * - When the store is unavailable, paid features fail closed. Free local
 *   behavior (deterministic chat, browser fallback voice) is never metered.
 */

export interface BudgetStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number): Promise<void>;
  /**
   * Optional atomic increment with a cap. Returns the post-increment count
   * and whether this call was admitted, or null when the store cannot
   * perform the operation atomically (caller falls back to check-then-set).
   * Implementations must throw on infrastructure failure so callers fail
   * closed rather than silently degrading under contention.
   */
  atomicIncrement?(key: string, limit: number): Promise<{ used: number; allowed: boolean } | null>;
}

export type BudgetKind = "chat" | "voice" | "tts";

export interface BudgetDecision {
  allowed: boolean;
  used: number;
  limit: number;
  key: string;
}

const DEFAULTS: Record<BudgetKind, number> = {
  chat: 500, // paid chat model requests per day
  voice: 25, // realtime voice sessions per day
  tts: 300, // Kokoro synthesis requests per day (compute guard, self-hosted)
};

const HARD_CEILINGS: Record<BudgetKind, number> = {
  chat: 5000,
  voice: 200,
  tts: 5000,
};

const ENV_KEYS: Record<BudgetKind, string> = {
  chat: "OCG_G_CHAT_DAILY_LIMIT",
  voice: "OCG_G_VOICE_DAILY_LIMIT",
  tts: "OCG_G_TTS_DAILY_LIMIT",
};

export function dailyLimit(kind: BudgetKind, env: Record<string, string | undefined>): number {
  const raw = Number(env[ENV_KEYS[kind]]);
  const ceiling = HARD_CEILINGS[kind];
  if (!Number.isFinite(raw) || raw <= 0) return Math.min(DEFAULTS[kind], ceiling);
  return Math.min(Math.floor(raw), ceiling);
}

export function budgetKey(kind: BudgetKind, now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10); // UTC day, e.g. 2026-10-21
  return `g-budget:${kind}:${day}`;
}

export async function checkBudget(
  store: BudgetStore,
  kind: BudgetKind,
  env: Record<string, string | undefined>,
  now: Date = new Date(),
): Promise<BudgetDecision> {
  const key = budgetKey(kind, now);
  const limit = dailyLimit(kind, env);
  const used = (await store.get(key)) ?? 0;
  return { allowed: used < limit, used, limit, key };
}

/**
 * Reserve one unit of budget. Returns the post-reservation decision; when the
 * budget is exhausted nothing is consumed and `allowed` is false. Uses the
 * store's atomic increment when available so concurrent bursts cannot
 * overrun the cap.
 */
export async function consumeBudget(
  store: BudgetStore,
  kind: BudgetKind,
  env: Record<string, string | undefined>,
  now: Date = new Date(),
): Promise<BudgetDecision> {
  const key = budgetKey(kind, now);
  const limit = dailyLimit(kind, env);
  if (typeof store.atomicIncrement === "function") {
    const result = await store.atomicIncrement(key, limit);
    if (result) return { allowed: result.allowed, used: result.used, limit, key };
  }
  const before = await checkBudget(store, kind, env, now);
  if (!before.allowed) return before;
  const used = before.used + 1;
  await store.set(before.key, used);
  return { allowed: true, used, limit: before.limit, key: before.key };
}

/**
 * Netlify Blobs backed store. Imported lazily by the functions so local/unit
 * contexts never require the Netlify runtime. Throws when Blobs is not
 * available; callers treat that as fail-closed for paid features.
 */
export async function netlifyBlobsBudgetStore(): Promise<BudgetStore> {
  const blobs = await import("@netlify/blobs");
  // Lambda-compatibility deployments (digest-deployed functions behind a
  // Lambda bridge) receive the Blobs context inside the invocation event,
  // not the environment: connect it when the bridge stashed one. On the
  // standard Netlify runtime no event is stashed and getStore works as
  // before. Any failure here propagates — callers fail closed.
  const lambdaEvent = (globalThis as any).__ocgLambdaEvent;
  if (lambdaEvent) {
    try {
      // The library's connectLambda() maps url/token but not the
      // uncached edge URL, which strong-consistency reads require.
      // Set the complete context from the event payload directly.
      const raw = JSON.parse(Buffer.from(String(lambdaEvent.blobs || ""), "base64").toString("utf8"));
      blobs.setEnvironmentContext({
        siteID: lambdaEvent.headers?.["x-nf-site-id"],
        deployID: lambdaEvent.headers?.["x-nf-deploy-id"],
        edgeURL: raw.url,
        uncachedEdgeURL: raw.url_uncached,
        primaryRegion: raw.primary_region,
        token: raw.token,
      });
    } catch {
      try { blobs.connectLambda(lambdaEvent); } catch { /* getStore will surface the real error */ }
    }
  }
  const store = blobs.getStore({ name: "g-budget", consistency: "strong" });
  return {
    async get(key: string): Promise<number | null> {
      const value = await store.get(key, { type: "text" });
      if (value === null || value === undefined) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    },
    async set(key: string, value: number): Promise<void> {
      await store.set(key, String(value));
    },
    /**
     * Atomic increment via ETag compare-and-swap: read with metadata, then
     * write back with an onlyIfMatch / onlyIfNew precondition. A lost race
     * retries against the fresh value; persistent contention throws so the
     * caller fails closed instead of degrading to a racy write.
     */
    async atomicIncrement(key: string, limit: number): Promise<{ used: number; allowed: boolean }> {
      const MAX_ATTEMPTS = 8;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const current = await store.getWithMetadata(key, { type: "text" });
        const raw = current?.data ?? null;
        const parsed = raw === null || raw === undefined ? 0 : Number(raw);
        const used = Number.isFinite(parsed) ? parsed : 0;
        if (used >= limit) return { used, allowed: false };
        const next = used + 1;
        try {
          if (current?.etag) {
            await store.set(key, String(next), { onlyIfMatch: current.etag });
          } else {
            await store.set(key, String(next), { onlyIfNew: true });
          }
          return { used: next, allowed: true };
        } catch (err) {
          // Precondition failures (a concurrent writer won) surface as a 412
          // from the Blobs API; retry against fresh state. Anything else is
          // an infrastructure failure and must fail closed.
          const status = (err as { status?: number; cause?: { status?: number } })?.status
            ?? (err as { cause?: { status?: number } })?.cause?.status;
          const message = err instanceof Error ? err.message : "";
          if (status === 412 || /precondition/i.test(message)) continue;
          throw err;
        }
      }
      throw new Error("Budget meter contention: could not reserve atomically.");
    },
  };
}
