import { createHash } from "node:crypto";
import type { FirestoreLeadDb } from "./gFirestore.js";

/**
 * Lead persistence for the Cloud Run fallback host.
 *
 * On Netlify, G's lead functions record submissions through Netlify Forms
 * (submitNetlifyForm in netlify/functions/_forms.ts POSTs the form back to
 * the site's own origin). The fallback harness preserves that contract
 * without touching the certified function code: it serves a forms
 * compatibility endpoint at POST / that accepts exactly those submissions
 * and persists them here, into the Firestore `g-leads` collection. The
 * handler reports success only after this write resolves, mirroring the
 * Netlify behavior that a refused submission is never reported as recorded.
 *
 * Hardening (P0, 2026-11-01 — the intake previously accepted ANY non-empty
 * form name with no caps, letting a script write arbitrary junk records):
 *  - Explicit allowlist of the form identifiers the site actually uses;
 *    anything else is rejected before any store access.
 *  - Payload caps: field count and per-field length are validated here,
 *    in one auditable place (body-size cap lives in the harness).
 *  - Honeypot: a filled `bot-field` is dropped silently (accepted at the
 *    HTTP layer, never persisted) — the standard Netlify Forms semantic.
 *  - Duplicate protection: submissions carrying a `reference` are stored
 *    under a deterministic document id derived from (form, reference);
 *    a repeat submission is reported as a duplicate, not a second record.
 *  - Rate limiting is applied by the harness (server/cloudrun.ts) before
 *    persistence, keyed on the platform-trusted client IP.
 */

/** Every form identifier the public site and its server functions use.
 *  Adding a form is a code change here plus the client that posts it. */
export const ALLOWED_FORM_NAMES = [
  "ocg-g-lead",
  "ocg-seller-intake",
  "ocg-seller-action",
  "ocg-deal-submission",
  "ocg-contact",
  "ocg-marketplace-deal",
  "ocg-marketplace-inquiry",
] as const;

export function isAllowedFormName(formName: string): boolean {
  return (ALLOWED_FORM_NAMES as readonly string[]).includes(formName);
}

export const FORM_LIMITS = {
  /** Max urlencoded body size the harness accepts for a form post. */
  maxBodyBytes: 32_768,
  maxFields: 40,
  maxFieldLength: 4_000,
} as const;

export type FormIntakeDecision =
  | { action: "persist"; formName: string; fields: Record<string, string> }
  | { action: "drop"; reason: "honeypot" }
  | { action: "reject"; reason: "unknown_form" | "too_many_fields" | "field_too_long" };

/**
 * Validate a parsed form submission for persistence. Pure and synchronous
 * so the whole policy is unit-testable without a store.
 */
export function evaluateFormIntake(formName: string, fields: Record<string, string>): FormIntakeDecision {
  if (!isAllowedFormName(formName)) return { action: "reject", reason: "unknown_form" };
  if ((fields["bot-field"] || "").trim() !== "") return { action: "drop", reason: "honeypot" };
  const entries = Object.entries(fields).filter(([k]) => k !== "bot-field");
  if (entries.length > FORM_LIMITS.maxFields) return { action: "reject", reason: "too_many_fields" };
  for (const [, v] of entries) {
    if (v.length > FORM_LIMITS.maxFieldLength) return { action: "reject", reason: "field_too_long" };
  }
  return { action: "persist", formName, fields: Object.fromEntries(entries) };
}

/** Deterministic Firestore document id for reference-bearing submissions,
 *  or null when the submission carries no usable reference. */
export function leadDocumentId(formName: string, fields: Record<string, string>): string | null {
  const reference = (fields["reference"] || "").trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(reference)) return null;
  const digest = createHash("sha256").update(`${formName}\n${reference}`, "utf8").digest("hex");
  return `ref_${digest.slice(0, 40)}`;
}

/** Parse a Netlify-Forms-style urlencoded submission. Returns null when the
 *  body is not a form submission (no non-empty `form-name` field). */
export function parseFormSubmission(body: string): { formName: string; fields: Record<string, string> } | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(body);
  } catch {
    return null;
  }
  const formName = (params.get("form-name") || "").trim();
  if (!formName) return null;
  const fields: Record<string, string> = {};
  params.forEach((v, k) => {
    if (k !== "form-name") fields[k] = v;
  });
  return { formName, fields };
}

export type PersistOutcome = "created" | "duplicate";

/**
 * Persist one validated submission. Reference-bearing submissions are
 * written create-if-absent under their deterministic id and report
 * "duplicate" on a repeat; others append as before.
 */
export async function persistLeadToFirestore(
  db: FirestoreLeadDb,
  formName: string,
  fields: Record<string, string>,
): Promise<PersistOutcome> {
  const docId = leadDocumentId(formName, fields);
  if (docId && typeof db.createLeadWithId === "function") {
    const created = await db.createLeadWithId(docId, { form: formName, fields });
    return created ? "created" : "duplicate";
  }
  await db.addLead({ form: formName, fields });
  return "created";
}
