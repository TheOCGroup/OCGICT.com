import { SellerUnderwritingService } from "../../server/services/sellerUnderwritingService.js";
import { toPublicSellerOffer } from "../../server/services/sellerPublicResponse.js";
import { jsonError, jsonHeaders, readGuardedJson, trimmedString } from "./_forms.js";

/**
 * POST /api/seller/preliminary-offer — Netlify edition of the Express route.
 *
 * Runs the same underwriting service as the server build. The property
 * provider is separately gated; comparable-sales evidence remains disconnected,
 * so production stays in human review unless all evidence gates are met. The
 * client separately records the durable seller lead through `/api/g/lead`;
 * this function never claims a lead was saved.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "Method not allowed.");
  const parsed = await readGuardedJson(request);
  if ("error" in parsed) return parsed.error;
  const payload = parsed.body;

  const address = trimmedString(payload.address, 300);
  const fullName = trimmedString(payload.fullName, 120);
  const email = trimmedString(payload.email, 200);
  const phone = trimmedString(payload.phone, 40);
  if (!address) return jsonError(400, "Missing required seller intake payload: address");
  if (!fullName || !email || !phone) return jsonError(400, "Name, email, and phone are required");

  try {
    const result = await SellerUnderwritingService.processSellerIntake({ ...payload, address, fullName, email, phone });
    return new Response(JSON.stringify(toPublicSellerOffer(result)), { status: 200, headers: jsonHeaders });
  } catch {
    return jsonError(500, "The property review could not be completed.");
  }
}

export const config = {
  path: "/api/seller/preliminary-offer",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 10 },
};
