import { WichitaPropertyService } from "../../server/services/wichitaPropertyService.js";
import { jsonError, jsonHeaders, readGuardedJson, trimmedString } from "./_forms.js";

/**
 * POST /api/seller/property-lookup — Netlify edition of the Express route.
 * Production mode has no connected county provider, so lookups honestly
 * return `found: false` and the seller flow routes to human review.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "Method not allowed.");
  const parsed = await readGuardedJson(request);
  if ("error" in parsed) return parsed.error;
  const address = trimmedString(parsed.body.address, 300);
  if (!address) return jsonError(400, "Missing address");
  try {
    const publicRecord = await WichitaPropertyService.lookupPublicRecord({ address });
    return new Response(JSON.stringify({ address, publicRecord, found: !!publicRecord }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch {
    return jsonError(500, "Property lookup could not be completed.");
  }
}

export const config = {
  path: "/api/seller/property-lookup",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 20 },
};
