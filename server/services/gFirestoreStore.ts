import type { BudgetStore } from "./gBudget.js";
import type { FirestoreCounterDb } from "./gFirestore.js";

/**
 * BudgetStore backed by Firestore, for the Cloud Run fallback host.
 *
 * Implements the exact contract the Blobs store implements and that
 * consumeBudget / consumeRateLimit rely on:
 *  - get returns the current count or null when the counter does not exist;
 *  - set writes the count;
 *  - atomicIncrement runs inside a Firestore transaction: a caller at or
 *    over the limit is refused WITHOUT consuming (used = current count,
 *    allowed = false); an admitted caller consumes exactly one unit
 *    (used = count + 1, allowed = true). Firestore retries aborted
 *    transactions internally; a transaction that ultimately fails THROWS,
 *    so callers fail closed exactly as they do with the Blobs store.
 *
 * Counters live in the `g-counters` collection. Document ids are the
 * base64url encoding of the counter key, which keeps arbitrary keys
 * (budget keys contain ':'; rate-limit keys embed client IPs, including
 * IPv6 forms) inside Firestore's document-id rules.
 */
export function encodeCounterDocId(key: string): string {
  return Buffer.from(key, "utf8").toString("base64url");
}

export function firestoreBudgetStore(db: FirestoreCounterDb): BudgetStore {
  const refFor = (key: string) => db.doc(`g-counters/${encodeCounterDocId(key)}`);
  const readValue = (snap: { exists: boolean; data(): Record<string, unknown> | undefined }): number | null => {
    if (!snap.exists) return null;
    const value = Number(snap.data()?.value);
    return Number.isFinite(value) ? value : null;
  };
  return {
    async get(key: string): Promise<number | null> {
      return readValue(await db.getDoc(refFor(key)));
    },
    async set(key: string, value: number): Promise<void> {
      await db.runTransaction(async (tx) => {
        tx.set(refFor(key), { value });
      });
    },
    async atomicIncrement(key: string, limit: number) {
      return db.runTransaction(async (tx) => {
        const ref = refFor(key);
        const current = readValue(await tx.get(ref)) ?? 0;
        if (current >= limit) return { used: current, allowed: false };
        tx.set(ref, { value: current + 1 });
        return { used: current + 1, allowed: true };
      });
    },
  };
}
