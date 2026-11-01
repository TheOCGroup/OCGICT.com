import type { FirestoreListingDb } from "./gFirestore.js";

/**
 * Registry for the Marketplace listings store, mirroring the budget-store
 * factory pattern in gPlatform.ts: the Netlify function module stays free
 * of firebase-admin imports, and the Cloud Run harness registers the
 * Firestore-backed store at startup when a Firestore backend is active.
 * With nothing registered, the listings endpoint honestly reports an
 * unconfigured source and an empty list — never fabricated data.
 */
let registered: FirestoreListingDb | null = null;

export function registerListingsSource(db: FirestoreListingDb): void {
  registered = db;
}

export function listingsSource(): FirestoreListingDb | null {
  return registered;
}
