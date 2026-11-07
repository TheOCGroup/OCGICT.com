import { describe, expect, it } from "vitest";
import { calculateSellerOpeningOffer } from "../../server/services/sellerUnderwritingService";

describe("seller opening offer policy", () => {
  it("opens at 65 percent of renovated ARV less rehab", () => {
    expect(calculateSellerOpeningOffer(300000, 55000, 155000)).toBe(140000);
  });
  it("never exceeds the internal 70 percent ceiling", () => {
    expect(calculateSellerOpeningOffer(300000, 55000, 120000)).toBe(120000);
  });
  it("does not invent an offer when values are missing or uneconomic", () => {
    expect(calculateSellerOpeningOffer(0, 55000, 0)).toBe(0);
    expect(calculateSellerOpeningOffer(100000, 80000, 0)).toBe(0);
    expect(calculateSellerOpeningOffer(NaN, 5000, 200000)).toBe(0);
    expect(calculateSellerOpeningOffer(300000, -100, 200000)).toBe(0);
  });
});
