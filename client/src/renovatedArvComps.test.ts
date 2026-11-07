import { describe, expect, it } from "vitest";
import { selectRenovatedArvComps } from "../../server/services/sellerUnderwritingService";
import type { IComparableSale } from "../../shared/contracts";

const base: IComparableSale = {
  id: "sale1", address: "Verified renovated example", distanceMiles: 0.4,
  salePrice: 250000, saleDate: "2026-09-01", sqft: 1600,
  pricePerSqft: 156.25, yearBuilt: 1950, similarityScore: 0.9,
  source: "licensed closed-sale record", renovatedConditionVerified: true,
};
const now = new Date("2026-11-06T12:00:00Z");
describe("renovated ARV comparable eligibility", () => {
  it("accepts a nearby recent renovated closed sale", () => {
    expect(selectRenovatedArvComps([base], now)).toHaveLength(1);
  });
  it("clamps six calendar months correctly at month ends and leap years", () => {
    const august31 = new Date("2026-08-31T12:00:00Z");
    expect(selectRenovatedArvComps([{ ...base, saleDate: "2026-02-28" }], august31)).toHaveLength(0);
    expect(selectRenovatedArvComps([{ ...base, saleDate: "2026-03-01" }], august31)).toHaveLength(1);
    const leapAugust31 = new Date("2024-08-31T00:00:00Z");
    expect(selectRenovatedArvComps([{ ...base, saleDate: "2024-02-29" }], leapAugust31)).toHaveLength(1);
  });
  it("rejects distressed, unverified, stale, distant and future comps", () => {
    const variants: IComparableSale[] = [
      { ...base, id: "distressed", renovatedConditionVerified: false },
      { ...base, id: "unknown", renovatedConditionVerified: undefined },
      { ...base, id: "old", saleDate: "2026-04-01" },
      { ...base, id: "far", distanceMiles: 2 },
      { ...base, id: "future", saleDate: "2026-12-01" },
      { ...base, id: "invalid", salePrice: -10 },
      { ...base, id: "inconsistent", salePrice: 250000, pricePerSqft: 900 },
    ];
    expect(selectRenovatedArvComps(variants, now)).toEqual([]);
  });
});
