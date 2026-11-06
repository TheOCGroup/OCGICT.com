import { describe, expect, it } from "vitest";
import { oldestComparableAgeDays } from "../../server/services/sellerUnderwritingService";
import type { IComparableSale } from "../../shared/contracts";
const base: IComparableSale = { id: "a", address: "Example", distanceMiles: 0.2, salePrice: 250000, saleDate: "2026-11-01", sqft: 1500, pricePerSqft: 166.67, yearBuilt: 1960, similarityScore: 0.9, source: "verified", renovatedConditionVerified: true };
const asOf = new Date("2026-11-06T00:00:00Z");
describe("actual comparable sale freshness", () => {
  it("reports the oldest sale age instead of a fixed placeholder", () => {
    expect(oldestComparableAgeDays([base, { ...base, id: "b", saleDate: "2026-10-07" }], asOf)).toBe(30);
  });
  it("rejects missing, malformed and future sale dates", () => {
    expect(oldestComparableAgeDays([], asOf)).toBe(9999);
    expect(oldestComparableAgeDays([{ ...base, saleDate: "not-a-date" }], asOf)).toBe(9999);
    expect(oldestComparableAgeDays([{ ...base, saleDate: "2026-12-01" }], asOf)).toBe(9999);
  });
});
