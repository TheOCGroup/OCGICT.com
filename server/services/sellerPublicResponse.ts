import type { ISellerOfferResult } from "../../shared/contracts.js";

/** Public response is allowlisted. Never serialize private underwriting or the acquisition ceiling. */
export function toPublicSellerOffer(result: ISellerOfferResult) {
  return {
    id: result.id,
    createdAt: result.createdAt,
    property: { address: result.property.address },
    sellerOfferPresentation: result.sellerOfferPresentation,
  };
}
export type PublicSellerOffer = ReturnType<typeof toPublicSellerOffer>;
