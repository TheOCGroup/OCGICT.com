import { SellerUnderwritingService } from "../../server/services/sellerUnderwritingService.js";
import { jsonError, jsonHeaders, readGuardedJson, trimmedString } from "./_forms.js";

/**
 * POST /api/seller/preliminary-offer — Netlify edition of the Express route.
 *
 * Runs the same underwriting service as the server build. In production data
 * mode the property provider and comparable-sales provider are not connected,
 * so the service honestly routes to human review instead of inventing an
 * offer. The durable lead record is created by the client submitting the
 * `ocg-seller-intake` Netlify form with this result's tracking ID; this
 * function never claims a lead was saved.
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
    return new Response(JSON.stringify(result), { status: 200, headers: jsonHeaders });
  } catch {
    return jsonError(500, "The property review could not be completed.");
  }
}

export const config = {
  path: "/api/seller/preliminary-offer",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 10 },
};
