import type { ISellerOfferResult } from "../../shared/contracts.js";

/** Public response is allowlisted. Never serialize private underwriting or the acquisition ceiling. */
export function toPublicSellerOffer(result: ISellerOfferResult) {
  return {
    id: result.id,
    createdAt: result.createdAt,
    propertyResolution: result.propertyResolution,
    property: result.property,
    provenance: result.provenance,
    sellerOfferPresentation: result.sellerOfferPresentation,
    confidenceGate: result.confidenceGate,
    comparableSales: result.comparableSales,
    piperHandoff: result.piperHandoff,
  };
}
export type PublicSellerOffer = ReturnType<typeof toPublicSellerOffer>;
