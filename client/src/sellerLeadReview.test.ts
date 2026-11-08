import { describe, expect, it } from "vitest";
import { projectSellerLeadRows } from "../../server/services/sellerLeadReview.js";

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
  it("truncates all user-controlled text fields", () => {
    const result = projectSellerLeadRows([{ id: "4", data: { form: "ocg-seller-intake", fields: { name: "x".repeat(200), email: "y".repeat(300) } } }]);
    expect(result[0].name).toHaveLength(150);
    expect(result[0].email).toHaveLength(254);
  });
});