import { describe, expect, it } from "vitest";
import { projectSellerLeadRows, queryRecentSellerLeadRows } from "../../server/services/sellerLeadReview.js";

describe("seller lead review privacy projection", () => {
  it("allows only seller forms and an explicit field allowlist", () => {
    const result = projectSellerLeadRows([
      { id: "1", data: { form: "ocg-seller-action", receivedAt: { toDate: () => new Date("2026-11-07T00:00:00Z") }, fields: { reference: "R-12345678", action: "REQUEST_CALL", name: "Test", email: "qa@example.test", secret: "never-expose", notes: "private notes" } } },
      { id: "2", data: { form: "ocg-contact", fields: { email: "other@example.test" } } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "1", action: "REQUEST_CALL", email: "qa@example.test", receivedAt: "2026-11-07T00:00:00.000Z" });
    expect(JSON.stringify(result)).not.toContain("never-expose");
    expect(JSON.stringify(result)).not.toContain("private notes");
    expect(JSON.stringify(result)).not.toContain("other@example.test");
  });
  it("normalizes valid ISO timestamps and rejects invalid strings", () => {
    const result = projectSellerLeadRows([
      { id: "iso", data: { form: "ocg-seller-intake", receivedAt: "2026-11-09T10:00:00-06:00", fields: { name: "Seller" } } },
      { id: "bad", data: { form: "ocg-seller-intake", receivedAt: "not-a-date", fields: {} } },
    ]);
    expect(result[0].receivedAt).toBe("2026-11-09T16:00:00.000Z");
    expect(result[1].receivedAt).toBeNull();
  });
  it("handles malformed fields without leaking arbitrary data", () => {
    const result = projectSellerLeadRows([{ id: "3", data: { form: "ocg-seller-intake", fields: "untrusted", extra: "hidden" } }]);
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("");
    expect(result[0].receivedAt).toBeNull();
    expect(JSON.stringify(result)).not.toContain("hidden");
  });
  it("does not expose general G concierge leads in the seller-only queue", () => {
    const rows = projectSellerLeadRows([
      { id: "g-general", data: { form: "ocg-g-lead", fields: { role: "general", name: "Private concierge contact", email: "private@example.test" } } },
      { id: "g-no-role", data: { form: "ocg-g-lead", fields: { email: "unknown@example.test" } } },
      { id: "g-seller", data: { form: "ocg-g-lead", fields: { role: "seller", name: "Seller", email: "seller@example.test" } } },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("g-seller");
    expect(JSON.stringify(rows)).not.toContain("private@example.test");
    expect(JSON.stringify(rows)).not.toContain("unknown@example.test");
  });
  it("treats invalid Firestore timestamps as unavailable without failing the queue", () => {
    const result = projectSellerLeadRows([{ id: "bad-time", data: { form: "ocg-seller-intake", fields: { name: "Seller" }, receivedAt: { toDate: () => new Date("invalid") } } }]);
    expect(result).toHaveLength(1);
    expect(result[0].receivedAt).toBeNull();
  });
  it("truncates all user-controlled text fields", () => {
    const result = projectSellerLeadRows([{ id: "4", data: { form: "ocg-seller-intake", fields: { name: "x".repeat(200), email: "y".repeat(300) } } }]);
    expect(result[0].name).toHaveLength(150);
    expect(result[0].email).toHaveLength(254);
  });
});

describe("seller review queue query", () => {
  it("does not fail the entire queue when one Firestore timestamp throws", async () => {
    const rows = [
      { id: "broken", data: { form: "ocg-seller-intake", receivedAt: { toMillis: () => { throw new Error("invalid"); } }, fields: {} } },
      { id: "valid", data: { form: "ocg-seller-intake", receivedAt: new Date("2026-11-09T16:00:00Z"), fields: {} } },
    ];
    const makeQuery = (filtered: typeof rows) => ({
      where(field: string, _operator: string, value: unknown) {
        return makeQuery(filtered.filter(row => field === "form" ? (Array.isArray(value) ? value.includes(row.data.form) : row.data.form === value) : false));
      },
      orderBy() { return this; },
      limit(count: number) { return makeQuery(filtered.slice(0, count)); },
      async get() { return { docs: filtered.map(row => ({ id: row.id, data: () => row.data })) }; },
    });
    const result = await queryRecentSellerLeadRows(makeQuery(rows), 25);
    expect(result.map(row => row.id)).toEqual(["valid", "broken"]);
  });
  it("filters general G leads in Firestore before the bounded seller queue limit", async () => {
    const rows = [
      ...Array.from({ length: 140 }, (_, i) => ({ id: "general-" + i, data: { form: "ocg-g-lead", fields: { role: "general" }, receivedAt: new Date(10000 + i) } })),
      ...Array.from({ length: 35 }, (_, i) => ({ id: "seller-" + i, data: { form: "ocg-g-lead", fields: { role: "seller" }, receivedAt: new Date(20000 + i) } })),
      { id: "seller-action", data: { form: "ocg-seller-action", fields: { action: "REQUEST_CALL" }, receivedAt: new Date(30000) } },
    ];
    const makeQuery = (filters: Array<{ field: string; operator: string; value: unknown }> = [], cap = 100) => ({
      where(field: string, operator: string, value: unknown) { return makeQuery([...filters, { field, operator, value }], cap); },
      orderBy() { return makeQuery(filters, cap); },
      limit(next: number) { return makeQuery(filters, next); },
      async get() {
        const matches = rows.filter((row) => filters.every((filter) => {
          const value = filter.field === "form" ? row.data.form : filter.field === "fields.role" ? (row.data.fields as Record<string, unknown>).role : undefined;
          return filter.operator === "in" ? (filter.value as unknown[]).includes(value) : value === filter.value;
        })).sort((a, b) => b.data.receivedAt.getTime() - a.data.receivedAt.getTime()).slice(0, cap);
        return { docs: matches.map((row) => ({ id: row.id, data: () => row.data })) };
      },
    });
    const collection = { where: (field: string, operator: "in" | "==", value: unknown) => makeQuery().where(field, operator, value) };
    const result = await queryRecentSellerLeadRows(collection, 25);
    expect(result).toHaveLength(25);
    expect(result[0].id).toBe("seller-action");
    expect(result.every((row) => row.id.startsWith("seller-") || row.id === "seller-action")).toBe(true);
    expect(result.some((row) => row.id.startsWith("general-"))).toBe(false);
  });
});
