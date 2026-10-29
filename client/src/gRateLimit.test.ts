import { describe, expect, it } from "vitest";
import {
  clientIdFromRequest,
  consumeRateLimit,
  rateLimitActive,
  rateLimitFor,
  rateLimitKey,
} from "../../server/services/gRateLimit";
import type { BudgetStore } from "../../server/services/gBudget";

/** CAS store double with the Netlify Blobs ETag shape (mirrors gBudget.test). */
function casStore(): BudgetStore & { data: Map<string, number> } {
  const data = new Map<string, number>();
  const versions = new Map<string, number>();
  const tick = () => new Promise((r) => setTimeout(r, 1));
  return {
    data,
    async get(key: string) { await tick(); return data.has(key) ? data.get(key)! : null; },
    async set(key: string, value: number) { await tick(); data.set(key, value); },
    async atomicIncrement(key: string, limit: number) {
      for (let attempt = 0; attempt < 50; attempt++) {
        await tick();
        const seen = versions.get(key) ?? 0;
        const used = data.get(key) ?? 0;
        if (used >= limit) return { used, allowed: false };
        await tick();
        if ((versions.get(key) ?? 0) !== seen) continue;
        data.set(key, used + 1);
        versions.set(key, seen + 1);
        return { used: used + 1, allowed: true };
      }
      throw new Error("contention");
    },
  };
}

function plainStore(): BudgetStore {
  const data = new Map<string, number>();
  return {
    async get(key: string) { return data.has(key) ? data.get(key)! : null; },
    async set(key: string, value: number) { data.set(key, value); },
  };
}

const T0 = 1_760_000_040_000; // inside a fixed 60s window

describe("rateLimitFor", () => {
  it("returns the platform-mirroring defaults", () => {
    expect(rateLimitFor("chat", {})).toBe(30);
    expect(rateLimitFor("tts", {})).toBe(40);
    expect(rateLimitFor("voice", {})).toBe(20);
    expect(rateLimitFor("lead", {})).toBe(10);
    expect(rateLimitFor("ttsLocal", {})).toBe(20);
  });
  it("honors env overrides, floors them, and ignores invalid values", () => {
    expect(rateLimitFor("chat", { OCG_G_RATELIMIT_CHAT: "3" })).toBe(3);
    expect(rateLimitFor("chat", { OCG_G_RATELIMIT_CHAT: "3.9" })).toBe(3);
    expect(rateLimitFor("chat", { OCG_G_RATELIMIT_CHAT: "abc" })).toBe(30);
    expect(rateLimitFor("chat", { OCG_G_RATELIMIT_CHAT: "0" })).toBe(30);
    expect(rateLimitFor("chat", { OCG_G_RATELIMIT_CHAT: "999999" })).toBe(10000);
  });
});

describe("rateLimitKey", () => {
  it("buckets by fixed 60-second windows", () => {
    expect(rateLimitKey("chat", "1.2.3.4", T0)).toBe(rateLimitKey("chat", "1.2.3.4", T0 + 30_000));
    expect(rateLimitKey("chat", "1.2.3.4", T0)).not.toBe(rateLimitKey("chat", "1.2.3.4", T0 + 60_000));
  });
});

describe("consumeRateLimit", () => {
  it("admits up to the limit, then blocks with a bounded Retry-After", async () => {
    const store = casStore();
    const env = { OCG_G_RATELIMIT_CHAT: "3" };
    for (let i = 0; i < 3; i++) {
      const d = await consumeRateLimit(store, "chat", "1.2.3.4", env, T0);
      expect(d.allowed).toBe(true);
    }
    const blocked = await consumeRateLimit(store, "chat", "1.2.3.4", env, T0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("admits EXACTLY the limit under a 30-way concurrent burst", async () => {
    const store = casStore();
    const env = { OCG_G_RATELIMIT_CHAT: "10" };
    const results = await Promise.all(
      Array.from({ length: 30 }, () => consumeRateLimit(store, "chat", "5.6.7.8", env, T0)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    expect(results.filter((r) => !r.allowed)).toHaveLength(20);
  });

  it("isolates buckets per client and per scope", async () => {
    const store = casStore();
    const env = { OCG_G_RATELIMIT_CHAT: "1", OCG_G_RATELIMIT_TTS: "1" };
    expect((await consumeRateLimit(store, "chat", "1.1.1.1", env, T0)).allowed).toBe(true);
    expect((await consumeRateLimit(store, "chat", "1.1.1.1", env, T0)).allowed).toBe(false);
    expect((await consumeRateLimit(store, "chat", "2.2.2.2", env, T0)).allowed).toBe(true);
    expect((await consumeRateLimit(store, "tts", "1.1.1.1", env, T0)).allowed).toBe(true);
  });

  it("resets in the next window", async () => {
    const store = casStore();
    const env = { OCG_G_RATELIMIT_CHAT: "1" };
    expect((await consumeRateLimit(store, "chat", "1.1.1.1", env, T0)).allowed).toBe(true);
    expect((await consumeRateLimit(store, "chat", "1.1.1.1", env, T0)).allowed).toBe(false);
    expect((await consumeRateLimit(store, "chat", "1.1.1.1", env, T0 + 60_000)).allowed).toBe(true);
  });

  it("enforces sequentially without an atomic store", async () => {
    const store = plainStore();
    const env = { OCG_G_RATELIMIT_LEAD: "2" };
    expect((await consumeRateLimit(store, "lead", "1.1.1.1", env, T0)).allowed).toBe(true);
    expect((await consumeRateLimit(store, "lead", "1.1.1.1", env, T0)).allowed).toBe(true);
    expect((await consumeRateLimit(store, "lead", "1.1.1.1", env, T0)).allowed).toBe(false);
  });

  it("propagates store failures so callers fail closed", async () => {
    const broken: BudgetStore = {
      async get() { throw new Error("store down"); },
      async set() { throw new Error("store down"); },
      async atomicIncrement() { throw new Error("store down"); },
    };
    await expect(consumeRateLimit(broken, "chat", "1.1.1.1", {}, T0)).rejects.toThrow("store down");
  });
});

describe("clientIdFromRequest", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://example.test/api/g/chat", { headers });

  it("prefers the platform context IP over any header", () => {
    const r = req({ "x-nf-client-connection-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" });
    expect(clientIdFromRequest(r, { ip: "5.5.5.5" })).toBe("5.5.5.5");
  });
  it("uses the Netlify edge header when no context IP exists", () => {
    const r = req({ "x-nf-client-connection-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" });
    expect(clientIdFromRequest(r)).toBe("9.9.9.9");
  });
  it("NEVER trusts x-forwarded-for: forged headers cannot mint a fresh bucket", () => {
    const forged = req({ "x-forwarded-for": "203.0.113.99" });
    expect(clientIdFromRequest(forged)).toBe("unknown");
    const forged2 = req({ "x-forwarded-for": "198.51.100.7", "x-real-ip": "192.0.2.5" });
    expect(clientIdFromRequest(forged2)).toBe("unknown");
  });
  it("ignores blank platform values", () => {
    const r = req({ "x-nf-client-connection-ip": "  " });
    expect(clientIdFromRequest(r, { ip: " " })).toBe("unknown");
  });
});

describe("rateLimitActive", () => {
  it("engages in hosted deploy contexts", () => {
    expect(rateLimitActive({ deploy: { context: "production" } }, {})).toBe(true);
    expect(rateLimitActive({ deploy: { context: "deploy-preview" } }, {})).toBe(true);
  });
  it("engages when the backend enable flag is set", () => {
    expect(rateLimitActive(undefined, { OCG_G_CHAT_ENABLED: "true" })).toBe(true);
  });
  it("stays off for bare local/unit invocations", () => {
    expect(rateLimitActive(undefined, {})).toBe(false);
    expect(rateLimitActive({ deploy: { context: "branch-deploy" } }, {})).toBe(false);
    expect(rateLimitActive({ deploy: { context: "dev" } }, { OCG_G_CHAT_ENABLED: "false" })).toBe(false);
  });
});
