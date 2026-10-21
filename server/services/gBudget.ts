/**
 * Persistent daily usage budget for G's paid capabilities (chat model + voice).
 *
 * Why this exists: the G release gate blocked all paid model/voice usage until a
 * persistent usage budget could be verified. This module is that budget. It is
 * deliberately conservative:
 * - Counts are stored outside process memory (Netlify Blobs in production), so
 *   restarts and multiple instances share one meter.
 * - Environment variables may only LOWER a limit below the hard ceiling in code;
 *   raising spend requires a code change, never just a dashboard edit.
 * - When the store is unavailable, paid features fail closed. Free local
 *   behavior (deterministic chat, browser fallback voice) is never metered.
 */

export interface BudgetStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number): Promise<void>;
}

export type BudgetKind = "chat" | "voice";

export interface BudgetDecision {
  allowed: boolean;
  used: number;
  limit: number;
  key: string;
}

const DEFAULTS: Record<BudgetKind, number> = {
  chat: 500, // paid chat model requests per day
  voice: 25, // realtime voice sessions per day
};

const HARD_CEILINGS: Record<BudgetKind, number> = {
  chat: 5000,
  voice: 200,
};

const ENV_KEYS: Record<BudgetKind, string> = {
  chat: "OCG_G_CHAT_DAILY_LIMIT",
  voice: "OCG_G_VOICE_DAILY_LIMIT",
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
 * budget is exhausted nothing is consumed and `allowed` is false.
 */
export async function consumeBudget(
  store: BudgetStore,
  kind: BudgetKind,
  env: Record<string, string | undefined>,
  now: Date = new Date(),
): Promise<BudgetDecision> {
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
  const { getStore } = await import("@netlify/blobs");
  const store = getStore({ name: "g-budget", consistency: "strong" });
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
  };
}
