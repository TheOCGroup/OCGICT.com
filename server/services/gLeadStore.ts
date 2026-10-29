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
 */

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

export async function persistLeadToFirestore(
  db: FirestoreLeadDb,
  formName: string,
  fields: Record<string, string>,
): Promise<void> {
  await db.addLead({ form: formName, fields });
}
