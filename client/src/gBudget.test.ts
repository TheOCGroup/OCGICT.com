import { describe, expect, it } from "vitest";
import {
  budgetKey,
  checkBudget,
  consumeBudget,
  dailyLimit,
  type BudgetStore,
} from "../../server/services/gBudget";

function memoryStore(): BudgetStore & { data: Map<string, number> } {
  const data = new Map<string, number>();
  return {
    data,
    async get(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    async set(key: string, value: number) {
      data.set(key, value);
    },
  };
}

/**
 * Compare-and-swap store with artificial latency between the read and the
 * conditional write — the exact shape of the Netlify Blobs ETag path. A
 * non-atomic consume would overrun the cap against this store; the atomic
 * path serializes on the version counter instead.
 */
function casStore(): BudgetStore & { data: Map<string, number> } {
  const data = new Map<string, number>();
  const versions = new Map<string, number>();
  const tick = () => new Promise((r) => setTimeout(r, 1));
  return {
    data,
    async get(key: string) {
      await tick();
      return data.has(key) ? data.get(key)! : null;
    },
    async set(key: string, value: number) {
      await tick();
      data.set(key, value);
    },
    async atomicIncrement(key: string, limit: number) {
      for (let attempt = 0; attempt < 50; attempt++) {
        await tick();
        const seenVersion = versions.get(key) ?? 0;
        const used = data.get(key) ?? 0;
        if (used >= limit) return { used, allowed: false };
        await tick();
        // Conditional write: lands only if nobody else wrote since the read.
        if ((versions.get(key) ?? 0) !== seenVersion) continue;
        data.set(key, used + 1);
        versions.set(key, seenVersion + 1);
        return { used: used + 1, allowed: true };
      }
      throw new Error("contention");
    },
  };
}

describe("gBudget persistent daily meter", () => {
  it("uses conservative defaults", () => {
    expect(dailyLimit("chat", {})).toBe(500);
    expect(dailyLimit("voice", {})).toBe(25);
  });

  it("lets environment values lower a limit", () => {
    expect(dailyLimit("voice", { OCG_G_VOICE_DAILY_LIMIT: "5" })).toBe(5);
    expect(dailyLimit("chat", { OCG_G_CHAT_DAILY_LIMIT: "10" })).toBe(10);
  });

  it("never lets environment values raise a limit above the hard ceiling", () => {
    expect(dailyLimit("voice", { OCG_G_VOICE_DAILY_LIMIT: "100000" })).toBe(200);
    expect(dailyLimit("chat", { OCG_G_CHAT_DAILY_LIMIT: "100000" })).toBe(5000);
  });

  it("ignores invalid environment values", () => {
    expect(dailyLimit("voice", { OCG_G_VOICE_DAILY_LIMIT: "abc" })).toBe(25);
    expect(dailyLimit("voice", { OCG_G_VOICE_DAILY_LIMIT: "-3" })).toBe(25);
    expect(dailyLimit("voice", { OCG_G_VOICE_DAILY_LIMIT: "0" })).toBe(25);
  });

  it("keys usage per kind per UTC day", () => {
    const day = new Date("2026-10-21T23:30:00Z");
    expect(budgetKey("voice", day)).toBe("g-budget:voice:2026-10-21");
    expect(budgetKey("chat", day)).toBe("g-budget:chat:2026-10-21");
  });

  it("consume increments and blocks at the limit without consuming", async () => {
    const store = memoryStore();
    const env = { OCG_G_VOICE_DAILY_LIMIT: "2" };
    const now = new Date("2026-10-21T12:00:00Z");
    expect((await consumeBudget(store, "voice", env, now)).allowed).toBe(true);
    expect((await consumeBudget(store, "voice", env, now)).used).toBe(2);
    const blocked = await consumeBudget(store, "voice", env, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.used).toBe(2);
    const check = await checkBudget(store, "voice", env, now);
    expect(check.used).toBe(2);
    // A different kind has its own meter.
    expect((await checkBudget(store, "chat", env, now)).used).toBe(0);
  });

  it("holds the cap exactly under a concurrent burst when the store is atomic", async () => {
    const store = casStore();
    const env = { OCG_G_VOICE_DAILY_LIMIT: "10" };
    const now = new Date("2026-10-21T12:00:00Z");
    const results = await Promise.all(
      Array.from({ length: 30 }, () => consumeBudget(store, "voice", env, now)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    expect(results.filter((r) => !r.allowed)).toHaveLength(20);
    const check = await checkBudget(store, "voice", env, now);
    expect(check.used).toBe(10);
  });

  it("still consumes sequentially against a legacy store without atomic support", async () => {
    const store = memoryStore();
    const env = { OCG_G_CHAT_DAILY_LIMIT: "1" };
    const now = new Date("2026-10-21T12:00:00Z");
    expect((await consumeBudget(store, "chat", env, now)).allowed).toBe(true);
    expect((await consumeBudget(store, "chat", env, now)).allowed).toBe(false);
  });
});
