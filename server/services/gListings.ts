import type { FirestoreListingDb } from "./gFirestore.js";

/**
 * Marketplace listings — Firestore successor read model (Phase E, P0
 * 2026-11-01). The original Supabase listings backend was deleted by its
 * provider (Phase 2A investigation, 2026-10-29; data unrecoverable), and
 * the page has rendered its designed empty state since. This module is
 * the read half of the designated successor:
 *
 *  - Storage: the `marketplace-listings` collection in the same Firestore
 *    database as `g-leads`. Documents are written ONLY out-of-band (the
 *    founder's team via the Firebase Console) until a separately approved
 *    admin data-layer activation exists — there is deliberately no write
 *    endpoint here and the admin UI stays disabled (see adminAuth.ts).
 *  - Publication rule: a document is public only when `is_active` is
 *    exactly true AND its fields validate. Anything malformed is dropped,
 *    never repaired or partially rendered — no fabricated listings.
 *  - Shape: normalized to the client's long-standing MarketplaceListing
 *    interface (client/src/lib/supabase.ts) so the page needed no redesign.
 *
 * The collection does not exist until the founder's team creates the
 * first listing document, so an empty result is the expected, honest
 * state today: the endpoint answers an empty list and the page renders
 * its designed empty state exactly as before.
 */

export interface PublicListing {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  arv: number | null;
  rehab_estimate: number | null;
  projected_profit: number | null;
  strategy: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  year_built: number | null;
  property_type: string;
  description: string;
  highlights: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

function str(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function timestampString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  // firebase-admin Timestamp objects expose toDate().
  const maybe = value as { toDate?: () => Date } | null;
  if (maybe && typeof maybe.toDate === "function") {
    try {
      return maybe.toDate().toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Validate + normalize one raw listing document. Returns null when the
 * document is not publishable (inactive or missing/invalid core fields).
 * Pure, so the publication policy is unit-testable with synthetic records.
 */
export function toPublicListing(id: string, data: Record<string, unknown>): PublicListing | null {
  if (data.is_active !== true) return null;
  const title = str(data.title, 200);
  const address = str(data.address, 300);
  const city = str(data.city, 100);
  const state = str(data.state, 50);
  const zip = str(data.zip, 20);
  const price = num(data.price);
  const strategy = str(data.strategy, 100);
  const status = str(data.status, 100);
  const propertyType = str(data.property_type, 100);
  if (!title || !address || !city || !state || !zip || price === null || !strategy || !status || !propertyType) {
    return null;
  }
  const highlights = Array.isArray(data.highlights)
    ? data.highlights.filter((h): h is string => typeof h === "string").map((h) => h.slice(0, 200)).slice(0, 12)
    : [];
  return {
    id,
    title,
    address,
    city,
    state,
    zip,
    price,
    arv: num(data.arv),
    rehab_estimate: num(data.rehab_estimate),
    projected_profit: num(data.projected_profit),
    strategy,
    status,
    bedrooms: num(data.bedrooms),
    bathrooms: num(data.bathrooms),
    sqft: num(data.sqft),
    year_built: num(data.year_built),
    property_type: propertyType,
    description: str(data.description, 4000) || "",
    highlights,
    image_url: str(data.image_url, 1000),
    is_active: true,
    sort_order: num(data.sort_order) ?? 0,
    created_at: timestampString(data.created_at),
  };
}

/** Fetch + filter + sort the public listings from the store. */
export async function fetchPublicListings(db: FirestoreListingDb): Promise<PublicListing[]> {
  const docs = await db.listListingDocs();
  const listings: PublicListing[] = [];
  for (const doc of docs) {
    const listing = toPublicListing(doc.id, doc.data);
    if (listing) listings.push(listing);
  }
  listings.sort((a, b) => a.sort_order - b.sort_order || String(b.created_at || "").localeCompare(String(a.created_at || "")));
  return listings;
}
