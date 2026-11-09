import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  adminAuthConfig,
  verifyAdminPassword,
  mintAdminSession,
  verifyAdminSession,
  adminSessionFromCookie,
  isAdminAuthenticated,
} from "../../server/services/adminAuth";
import {
  ALLOWED_FORM_NAMES,
  isAllowedFormName,
  evaluateFormIntake,
  leadDocumentId,
  persistLeadToFirestore,
  parseFormSubmission,
} from "../../server/services/gLeadStore";
import { GeminiSseParser } from "../../server/services/geminiStream";
import { toPublicListing, fetchPublicListings } from "../../server/services/gListings";
import { registerListingsSource } from "../../server/services/gListingsSource";
import { isKnownPagePath, cacheControlFor } from "../../server/cloudrunRoutes";
import listingsHandler from "../../netlify/functions/marketplace-listings";

/* ── §3 Admin authentication ─────────────────────────────────────────── */

const ENV = {
  ADMIN_PASSWORD: "correct-horse-battery-staple-42",
  ADMIN_SESSION_SECRET: "s".repeat(40),
};

describe("adminAuth (§3 server-side admin authentication)", () => {
  it("fails closed when credentials are absent or too short", () => {
    expect(adminAuthConfig({})).toBeNull();
    expect(adminAuthConfig({ ADMIN_PASSWORD: "short", ADMIN_SESSION_SECRET: "s".repeat(40) })).toBeNull();
    expect(adminAuthConfig({ ADMIN_PASSWORD: "correct-horse-battery-staple-42", ADMIN_SESSION_SECRET: "tiny" })).toBeNull();
    expect(adminAuthConfig(ENV)).not.toBeNull();
    expect(isAdminAuthenticated(undefined, {}, Date.now())).toBe(false);
  });

  it("verifies only the exact configured password", () => {
    const config = adminAuthConfig(ENV)!;
    expect(verifyAdminPassword("correct-horse-battery-staple-42", config)).toBe(true);
    expect(verifyAdminPassword("correct-horse-battery-staple-41", config)).toBe(false);
    expect(verifyAdminPassword("", config)).toBe(false);
    expect(verifyAdminPassword("x".repeat(300), config)).toBe(false);
  });

  it("session tokens round-trip, expire, and reject tampering", () => {
    const config = adminAuthConfig(ENV)!;
    const now = 1_700_000_000_000;
    const token = mintAdminSession(config, now);
    expect(verifyAdminSession(token, config, now + 60_000)).toBe(true);
    expect(verifyAdminSession(token, config, now + 13 * 60 * 60 * 1000)).toBe(false);
    const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
    expect(verifyAdminSession(tampered, config, now)).toBe(false);
    expect(verifyAdminSession("garbage", config, now)).toBe(false);
    expect(verifyAdminSession(undefined, config, now)).toBe(false);
    const other = adminAuthConfig({ ADMIN_PASSWORD: "another-password-123456", ADMIN_SESSION_SECRET: "t".repeat(40) })!;
    expect(verifyAdminSession(token, other, now)).toBe(false);
  });

  it("reads the session cookie out of a Cookie header", () => {
    const config = adminAuthConfig(ENV)!;
    const token = mintAdminSession(config, Date.now());
    expect(adminSessionFromCookie(`a=1; ocg_admin_session=${token}; b=2`)).toBe(token);
    expect(adminSessionFromCookie("a=1; b=2")).toBeUndefined();
    expect(isAdminAuthenticated(`ocg_admin_session=${token}`, ENV, Date.now())).toBe(false);
    expect(isAdminAuthenticated(`ocg_admin_session=${token}x`, ENV, Date.now())).toBe(false);
  });
});

/* ── §6 Form intake hardening ────────────────────────────────────────── */

describe("form intake (§6 allowlist, caps, honeypot, dedupe)", () => {
  it("allows exactly the forms the site uses", () => {
    for (const name of ["ocg-g-lead", "ocg-seller-intake", "ocg-seller-action", "ocg-deal-submission", "ocg-contact", "ocg-marketplace-deal", "ocg-marketplace-inquiry"]) {
      expect(isAllowedFormName(name)).toBe(true);
    }
    expect(ALLOWED_FORM_NAMES.length).toBe(7);
    expect(isAllowedFormName("ocg-nonexistent")).toBe(false);
    expect(evaluateFormIntake("ocg-nonexistent", { name: "x" }).action).toBe("reject");
  });

  it("drops honeypot submissions without persisting", () => {
    const d = evaluateFormIntake("ocg-contact", { name: "Bot", "bot-field": "spam" });
    expect(d.action).toBe("drop");
  });

  it("enforces field-count and field-length caps", () => {
    const many: Record<string, string> = {};
    for (let i = 0; i < 41; i++) many[`f${i}`] = "x";
    expect(evaluateFormIntake("ocg-contact", many).action).toBe("reject");
    expect(evaluateFormIntake("ocg-contact", { msg: "x".repeat(4001) }).action).toBe("reject");
    const ok = evaluateFormIntake("ocg-contact", { msg: "x".repeat(4000), "bot-field": "" });
    expect(ok.action).toBe("persist");
    if (ok.action === "persist") expect("bot-field" in ok.fields).toBe(false);
  });

  it("derives a stable dedupe id only from a valid reference", () => {
    const a = leadDocumentId("ocg-g-lead", { reference: "REF-12345678" });
    const b = leadDocumentId("ocg-g-lead", { reference: "REF-12345678" });
    const c = leadDocumentId("ocg-seller-intake", { reference: "REF-12345678" });
    expect(a).toBeTruthy();
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(leadDocumentId("ocg-contact", {})).toBeNull();
    expect(leadDocumentId("ocg-contact", { reference: "short" })).toBeNull();
  });

  it("persist reports duplicates instead of writing a second record", async () => {
    const created: string[] = [];
    const db = {
      addLead: async () => { created.push("append"); },
      createLeadWithId: async (id: string) => {
        if (created.includes(id)) return false;
        created.push(id);
        return true;
      },
    };
    const fields = { reference: "REF-12345678", name: "Test" };
    expect(await persistLeadToFirestore(db, "ocg-g-lead", fields)).toBe("created");
    expect(await persistLeadToFirestore(db, "ocg-g-lead", fields)).toBe("duplicate");
    expect(created.length).toBe(1);
    expect(await persistLeadToFirestore(db, "ocg-contact", { name: "NoRef" })).toBe("created");
    expect(created).toContain("append");
  });

  it("still parses urlencoded submissions as before", () => {
    const parsed = parseFormSubmission("form-name=ocg-contact&name=Ada&bot-field=");
    expect(parsed?.formName).toBe("ocg-contact");
    expect(parsed?.fields.name).toBe("Ada");
    expect(parseFormSubmission("name=Ada")).toBeNull();
  });
});

/* ── §7 G stream completion ──────────────────────────────────────────── */

describe("GeminiSseParser stream completion (§7 truncation fix)", () => {
  const payload = (text: string, finishReason?: string) =>
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, ...(finishReason ? { finishReason } : {}) }] })}`;

  it("flushes a final payload that arrives without a trailing newline", () => {
    // A line split across chunks is emitted only once it completes.
    const p = new GeminiSseParser();
    const line = payload("Hola, ¿en qué puedo ayudarte?");
    expect(p.push(line.slice(0, 20))).toEqual([]);
    expect(p.push(line.slice(20) + "\n")).toEqual(["Hola, ¿en qué puedo ayudarte?"]);
    // Stream end with a complete final payload but NO trailing newline:
    // before the flush existed, these closing words were silently lost.
    const q = new GeminiSseParser();
    expect(q.push(payload("Primera parte. ") + "\n")).toEqual(["Primera parte. "]);
    expect(q.push(payload("Última parte."))).toEqual([]);
    expect(q.flush()).toEqual(["Última parte."]);
    expect(q.flush()).toEqual([]);
  });

  it("captures the provider finishReason", () => {
    const p = new GeminiSseParser();
    p.push(payload("cortado", "MAX_TOKENS") + "\n");
    expect(p.finishReason).toBe("MAX_TOKENS");
    const q = new GeminiSseParser();
    q.push(payload("completo", "STOP") + "\n");
    expect(q.finishReason).toBe("STOP");
  });
});

/* ── §8 Marketplace listings successor ───────────────────────────────── */

const SYNTHETIC = {
  title: "SYNTHETIC TEST LISTING — NOT A REAL PROPERTY",
  address: "000 Test Only Way",
  city: "Wichita",
  state: "KS",
  zip: "67202",
  price: 100000,
  arv: 150000,
  rehab_estimate: 20000,
  projected_profit: 30000,
  strategy: "Fix & Flip",
  status: "Available",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1200,
  year_built: 1950,
  property_type: "Single Family",
  description: "Synthetic record used only by automated tests.",
  highlights: ["Test"],
  image_url: null,
  is_active: true,
  sort_order: 1,
};

describe("marketplace listings (§8 Firestore successor)", () => {
  it("normalizes a valid active synthetic record", () => {
    const listing = toPublicListing("synthetic-1", SYNTHETIC);
    expect(listing?.title).toContain("SYNTHETIC");
    expect(listing?.price).toBe(100000);
    expect(listing?.is_active).toBe(true);
  });

  it("never publishes inactive or malformed records", () => {
    expect(toPublicListing("x", { ...SYNTHETIC, is_active: false })).toBeNull();
    expect(toPublicListing("x", { ...SYNTHETIC, price: "100000" })).toBeNull();
    expect(toPublicListing("x", { ...SYNTHETIC, title: "" })).toBeNull();
    expect(toPublicListing("x", {})).toBeNull();
  });

  it("endpoint answers an honest empty list when unconfigured, and filters when configured", async () => {
    const before = await listingsHandler(new Request("https://example.test/api/marketplace/listings"));
    expect(before.status).toBe(200);
    const beforeBody = await before.json();
    expect(beforeBody.listings).toEqual([]);

    registerListingsSource({
      listListingDocs: async () => [
        { id: "synthetic-1", data: SYNTHETIC },
        { id: "hidden-1", data: { ...SYNTHETIC, is_active: false } },
        { id: "broken-1", data: { title: "missing everything" } },
      ],
    });
    const listings = await fetchPublicListings({
      listListingDocs: async () => [
        { id: "synthetic-1", data: SYNTHETIC },
        { id: "hidden-1", data: { ...SYNTHETIC, is_active: false } },
      ],
    });
    expect(listings.map((l) => l.id)).toEqual(["synthetic-1"]);

    const after = await listingsHandler(new Request("https://example.test/api/marketplace/listings"));
    const afterBody = await after.json();
    expect(afterBody.source).toBe("firestore");
    expect(afterBody.listings.map((l: { id: string }) => l.id)).toEqual(["synthetic-1"]);

    const post = await listingsHandler(new Request("https://example.test/api/marketplace/listings", { method: "POST" }));
    expect(post.status).toBe(405);
  });
});

/* ── QUINCEY F-1 regression pin (delta, 2026-11-01) ──────────────────── */

describe("marketplace honesty (QUINCEY F-1)", () => {
  it("no click-only success claim remains anywhere on the page", () => {
    const src = readFileSync(join(process.cwd(), "client/src/pages/Marketplace.tsx"), "utf8");
    // The listing-card package button previously toasted a submitted
    // claim with no request behind it. It now opens the inquiry modal;
    // the claim string must never come back.
    expect(src).not.toContain("Full deal package request submitted");
    // Both card actions open the modal with an explicit intent instead.
    expect(src).toContain('setInquiryIntent("full-package")');
    expect(src).toContain('setInquiryIntent("inquiry")');
  });
});

/* ── §9 SPA status + caching policy ──────────────────────────────────── */

describe("routing + cache policy (§9)", () => {
  it("knows the real page routes and rejects unknown ones", () => {
    expect(isKnownPagePath("/")).toBe(true);
    expect(isKnownPagePath("/about")).toBe(true);
    expect(isKnownPagePath("/sell")).toBe(true);
    expect(isKnownPagePath("/admin/listings/abc123/edit")).toBe(true);
    expect(isKnownPagePath("/definitely-not-a-page")).toBe(false);
    expect(isKnownPagePath("/administrator")).toBe(false);
    expect(isKnownPagePath("/.env")).toBe(false);
  });

  it("caches hashed assets immutably and never caches the shell", () => {
    expect(cacheControlFor("/assets/index-abc123.js")).toContain("immutable");
    expect(cacheControlFor("/")).toBe("no-cache");
    expect(cacheControlFor("/about")).toBe("no-cache");
    expect(cacheControlFor("/images/hero/x.jpg")).toBe("public, max-age=3600");
  });
});
