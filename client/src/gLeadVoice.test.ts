import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import leadHandler from "../../netlify/functions/g-lead";
import voiceHandler from "../../netlify/functions/g-voice-session";

const validLead = {
  name: "QA Visitor",
  email: "qa@example.com",
  phone: "",
  role: "seller",
  address: "123 Test St, Wichita, KS",
  summary: "Visitor: I want to sell.\nG: Happy to help.",
  consent: true,
  reference: "G-test-12345678",
};

function leadRequest(body: unknown): Request {
  return new Request("https://example.invalid/api/g/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("g-lead intake validation and delivery", () => {
  let fetchCalls: Array<{ url: string; init?: RequestInit }>;

  beforeEach(() => {
    fetchCalls = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      fetchCalls.push({ url, init });
      return new Response("ok", { status: 200 });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a lead without consent and records nothing", async () => {
    const res = await leadHandler(leadRequest({ ...validLead, consent: false }));
    expect(res.status).toBe(400);
    expect(fetchCalls).toHaveLength(0);
  });

  it("rejects a lead with no way to reach the visitor", async () => {
    const res = await leadHandler(leadRequest({ ...validLead, email: "", phone: "" }));
    expect(res.status).toBe(400);
    expect(fetchCalls).toHaveLength(0);
  });

  it("rejects an unknown role and a malformed reference", async () => {
    expect((await leadHandler(leadRequest({ ...validLead, role: "admin" }))).status).toBe(400);
    expect((await leadHandler(leadRequest({ ...validLead, reference: "x" }))).status).toBe(400);
    expect(fetchCalls).toHaveLength(0);
  });

  it("records a valid lead to the ocg-g-lead form before confirming", async () => {
    const res = await leadHandler(leadRequest(validLead));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.reference).toBe(validLead.reference);
    expect(data.delivery).toBe("netlify-forms");
    expect(fetchCalls).toHaveLength(1);
    const body = String(fetchCalls[0].init?.body || "");
    expect(body).toContain("form-name=ocg-g-lead");
    expect(body).toContain("reference=G-test-12345678");
  });

  it("reports an honest failure when the form submission fails", async () => {
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 500 }));
    const res = await leadHandler(leadRequest(validLead));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("Nothing was recorded");
  });
});

describe("g-voice-session gates", () => {
  const KEYS = ["OCG_G_VOICE_ENABLED", "VAPI_PUBLIC_KEY", "OCG_G_VAPI_ASSISTANT_ID"] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("GET reports disabled with a plain reason by default", async () => {
    const res = await voiceHandler(new Request("https://example.invalid/api/g/voice/session", { method: "GET" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enabled).toBe(false);
    expect(data.mode).toBe("browser-fallback");
    expect(data.maxDurationSeconds).toBe(600);
    expect(JSON.stringify(data)).not.toContain("publicKey");
  });

  it("POST refuses to issue a session while the founder flag is off", async () => {
    process.env.VAPI_PUBLIC_KEY = "pk_test";
    process.env.OCG_G_VAPI_ASSISTANT_ID = "asst_test";
    const res = await voiceHandler(new Request("https://example.invalid/api/g/voice/session", { method: "POST" }));
    expect(res.status).toBe(503);
  });

  it("POST fails closed when the budget meter is unavailable", async () => {
    process.env.OCG_G_VOICE_ENABLED = "true";
    process.env.VAPI_PUBLIC_KEY = "pk_test";
    process.env.OCG_G_VAPI_ASSISTANT_ID = "asst_test";
    // No Netlify Blobs context exists in the test runtime: the meter cannot
    // be read, so paid voice must refuse rather than issue an unmetered call.
    const res = await voiceHandler(new Request("https://example.invalid/api/g/voice/session", { method: "POST" }));
    expect(res.status).toBe(503);
  });

  it("GET reports enabled only when flag, key, and assistant are all set", async () => {
    process.env.OCG_G_VOICE_ENABLED = "true";
    process.env.VAPI_PUBLIC_KEY = "pk_test";
    process.env.OCG_G_VAPI_ASSISTANT_ID = "asst_test";
    const res = await voiceHandler(new Request("https://example.invalid/api/g/voice/session", { method: "GET" }));
    const data = await res.json();
    expect(data.enabled).toBe(true);
    expect(data.mode).toBe("vapi-web");
  });
});
