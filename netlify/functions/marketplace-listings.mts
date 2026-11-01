import { jsonError, jsonHeaders } from "./_forms.js";
import { fetchPublicListings } from "../../server/services/gListings.js";
import { listingsSource } from "../../server/services/gListingsSource.js";

/**
 * GET /api/marketplace/listings — public Marketplace listings (Firestore
 * successor to the deleted Supabase backend; see gListings.ts).
 *
 * Read-only and public by design: it exposes exactly the documents the
 * founder's team marked `is_active` in the `marketplace-listings`
 * collection, validated field by field. Until a listings source is
 * registered (Cloud Run with a Firestore backend) the endpoint answers
 * an honest empty list — the page's designed empty state — never
 * fabricated properties. Store failures answer 503 rather than a false
 * empty result, so an outage is distinguishable from "no listings".
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return jsonError(405, "Method not allowed.");
  const source = listingsSource();
  if (!source) {
    return new Response(JSON.stringify({ listings: [], source: "unconfigured" }), {
      status: 200,
      headers: { ...jsonHeaders, "Cache-Control": "public, max-age=60" },
    });
  }
  try {
    const listings = await fetchPublicListings(source);
    return new Response(JSON.stringify({ listings, source: "firestore" }), {
      status: 200,
      headers: { ...jsonHeaders, "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return jsonError(503, "Listings are temporarily unavailable.");
  }
}

export const config = {
  path: "/api/marketplace/listings",
  method: "GET",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 120 },
};
