import { describe, expect, it } from "vitest";
import { toPublicSellerOffer } from "../../server/services/sellerPublicResponse";
import type { ISellerOfferResult } from "../../shared/contracts";

describe("public seller offer confidentiality", () => {
  it("never exposes internal MAO or acquisition multiplier", () => {
    const internal = {
      id: "offer-test", createdAt: "2026-11-06T00:00:00Z",
      internalUnderwriting: { estimatedArv: 300000, acquisitionMultiplier: 0.7, grossArvCap: 210000, estimatedRehabBudget: 50000, internalMaoCeiling: 160000 },
      sellerOfferPresentation: { status: "PRELIMINARY_OFFER_AVAILABLE", singlePointEstimate: 145000 },
      property: { address: "example" },
    } as unknown as ISellerOfferResult;
    const publicResult = toPublicSellerOffer(internal);
    expect(publicResult.id).toBe("offer-test");
    expect(publicResult.sellerOfferPresentation.singlePointEstimate).toBe(145000);
    expect(JSON.stringify(publicResult)).not.toContain("internalUnderwriting");
    expect(JSON.stringify(publicResult)).not.toContain("internalMaoCeiling");
    expect(JSON.stringify(publicResult)).not.toContain("acquisitionMultiplier");
    expect(JSON.stringify(publicResult)).not.toContain("160000");
  });
});
