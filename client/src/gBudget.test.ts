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
});
