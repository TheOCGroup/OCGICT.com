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
}

export interface GFirestore {
  counters: FirestoreCounterDb;
  leads: FirestoreLeadDb;
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
  return {
    counters: {
      doc: (path: string) => db.doc(path),
      getDoc: (ref: unknown) => (ref as { get(): Promise<FirestoreDocSnap> }).get(),
      runTransaction: (update) => db.runTransaction(update as never),
    },
    leads: {
      addLead: async (record: Record<string, unknown>) => {
        await db.collection("g-leads").add({
          ...record,
          receivedAt: fsMod.FieldValue.serverTimestamp(),
        });
      },
    },
  };
}
