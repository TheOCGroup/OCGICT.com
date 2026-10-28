import { netlifyBlobsBudgetStore, type BudgetStore } from "./gBudget.js";

/**
 * Platform seam for G's durable counter store (daily budgets + rate limits).
 *
 * On Netlify the store is Netlify Blobs (the certified default — nothing in
 * this module changes that path). An alternative host (the Cloud Run
 * fallback harness, server/cloudrun.ts) registers its own factory at
 * startup, before it accepts traffic; when a factory is registered it wins.
 * Function code always calls platformBudgetStore() and cannot tell which
 * backend serves it — the BudgetStore contract (atomic increment, throw on
 * infrastructure failure) is identical either way, so every caller's
 * fail-closed behavior is preserved.
 */
export type StoreFactory = () => Promise<BudgetStore>;

let registeredFactory: StoreFactory | null = null;

export function registerBudgetStoreFactory(factory: StoreFactory): void {
  registeredFactory = factory;
}

/** Test/harness introspection: whether an alternate factory is registered. */
export function hasRegisteredStoreFactory(): boolean {
  return registeredFactory !== null;
}

export async function platformBudgetStore(): Promise<BudgetStore> {
  if (registeredFactory) return registeredFactory();
  return netlifyBlobsBudgetStore();
}

/** Which store backend the environment selects (pure; for tests + harness). */
export function storeBackend(env: Record<string, string | undefined>): "firestore" | "blobs" {
  return (env.OCG_STORE_BACKEND || "").trim().toLowerCase() === "firestore" ? "firestore" : "blobs";
}

/** Which lead-intake backend the environment selects (pure). */
export function leadBackend(env: Record<string, string | undefined>): "firestore" | "netlify-forms" {
  return (env.OCG_LEAD_BACKEND || "").trim().toLowerCase() === "firestore" ? "firestore" : "netlify-forms";
}
