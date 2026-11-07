/**
 * Firestore access for the Cloud Run fallback host.
 *
 * This module is imported ONLY by the fallback harness path
 * (server/cloudrun.ts and the Firestore-backed services it wires up). It is
 * never imported by the Netlify function modules, so firebase-admin never
 * enters a Netlify function bundle. The admin SDK is loaded lazily via a
 * dynamic import for the same reason.
 *
 * Credentials: Application Default Credentials. On Cloud Run that is the
 * service's attached service account — no key files, nothing in the image.
 */

export interface FirestoreDocSnap {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}

export interface FirestoreTx {
  get(ref: unknown): Promise<FirestoreDocSnap>;
  set(ref: unknown, data: Record<string, unknown>): void;
}

/** The narrow Firestore surface the counter store depends on. */
export interface FirestoreCounterDb {
  doc(path: string): unknown;
  getDoc(ref: unknown): Promise<FirestoreDocSnap>;
  runTransaction<T>(update: (tx: FirestoreTx) => Promise<T>): Promise<T>;
}

/** The narrow Firestore surface the lead store depends on. */
export interface FirestoreLeadDb {
  addLead(record: Record<string, unknown>): Promise<void>;
  /** Create a lead document under a caller-chosen id, returning false
   *  (without overwriting) when the id already exists. Powers the form
   *  intake's duplicate protection for reference-bearing submissions. */
  createLeadWithId?(id: string, record: Record<string, unknown>): Promise<boolean>;
  listRecentLeads?(limit: number): Promise<Array<{ id: string; data: Record<string, unknown> }>>;
}

/** The narrow Firestore surface the Marketplace listings read path uses. */
export interface FirestoreListingDb {
  /** Raw documents from the `marketplace-listings` collection. Filtering
   *  and field validation happen in server/services/gListings.ts so the
   *  policy is unit-testable without a database. */
  listListingDocs(): Promise<Array<{ id: string; data: Record<string, unknown> }>>;
}

export function resolveFirestoreCollectionName(value: string | undefined, fallback: string): string {
  const candidate = (value || "").trim();
  return /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(candidate) ? candidate : fallback;
}

export interface GFirestore {
  counters: FirestoreCounterDb;
  leads: FirestoreLeadDb;
  listings: FirestoreListingDb;
}

let cached: Promise<GFirestore> | null = null;

export function getGFirestore(): Promise<GFirestore> {
  if (!cached) cached = init();
  return cached;
}

async function init(): Promise<GFirestore> {
  const appMod = await import("firebase-admin/app");
  const fsMod = await import("firebase-admin/firestore");
  if (!appMod.getApps().length) appMod.initializeApp();
  const db = fsMod.getFirestore();
  const leadsCollection = resolveFirestoreCollectionName(process.env.OCG_FIRESTORE_LEADS_COLLECTION, "g-leads");
  return {
    counters: {
      doc: (path: string) => db.doc(path),
      getDoc: (ref: unknown) => (ref as { get(): Promise<FirestoreDocSnap> }).get(),
      runTransaction: (update) => db.runTransaction(update as never),
    },
    leads: {
      addLead: async (record: Record<string, unknown>) => {
        await db.collection(leadsCollection).add({
          ...record,
          receivedAt: fsMod.FieldValue.serverTimestamp(),
        });
      },
      createLeadWithId: async (id: string, record: Record<string, unknown>) => {
        try {
          await db.collection(leadsCollection).doc(id).create({
            ...record,
            receivedAt: fsMod.FieldValue.serverTimestamp(),
          });
          return true;
        } catch (err) {
          // Firestore ALREADY_EXISTS (gRPC code 6): a duplicate submission,
          // not a failure — the original record stands.
          if ((err as { code?: number })?.code === 6) return false;
          throw err;
        }
      },
    },
    listings: {
      listListingDocs: async () => {
        const snap = await db.collection("marketplace-listings").get();
        return snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
      },
    },
  };
}
