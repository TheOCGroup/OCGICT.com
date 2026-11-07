import { WichitaPropertyService } from "../../server/services/wichitaPropertyService.js";
import { jsonError, jsonHeaders, readGuardedJson, trimmedString } from "./_forms.js";

/**
 * POST /api/seller/property-lookup — Netlify edition of the Express route.
 * Returns an explicit resolution state. The Sedgwick GIS provider is
 * production-gated; disabled, ambiguous, and failed lookups route to review.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "Method not allowed.");
  const parsed = await readGuardedJson(request);
  if ("error" in parsed) return parsed.error;
  const address = trimmedString(parsed.body.address, 300);
  if (!address) return jsonError(400, "Missing address");
  try {
    const resolution = await WichitaPropertyService.resolvePublicRecord({ address });
    const publicRecord = resolution.status === "matched" ? resolution.record : null;
    const found = !!publicRecord && publicRecord.provenance.certainty === "KNOWN";
    return new Response(JSON.stringify({ address, resolution, publicRecord, found }), {
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
