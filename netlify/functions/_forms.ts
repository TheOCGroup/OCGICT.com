/**
 * Server-side Netlify Forms submission helper.
 *
 * Lead records for the public website live in Netlify Forms: durable,
 * visible only to the Netlify account team, and eligible for email
 * notifications. Functions submit through the site's own origin using the
 * exact mechanism a browser form post uses. A lead is only reported as
 * recorded when Netlify accepts the submission (HTTP 2xx); anything else
 * throws so callers can answer honestly.
 */

export function siteOrigin(request: Request): string {
  const fromEnv = process.env.DEPLOY_PRIME_URL || process.env.URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function submitNetlifyForm(
  request: Request,
  formName: string,
  fields: Record<string, string>,
): Promise<void> {
  const body = new URLSearchParams({ "form-name": formName, "bot-field": "", ...fields });
  const response = await fetch(`${siteOrigin(request)}/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Lead store unavailable (HTTP ${response.status})`);
  }
}

export const jsonHeaders = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: jsonHeaders });
}

/** Shared request guards for public POST functions (mirrors g-chat.mts). */
export async function readGuardedJson(request: Request): Promise<{ body: any } | { error: Response }> {
  if (Number(request.headers.get("content-length") || 0) > 20000) {
    return { error: jsonError(413, "Request too large.") };
  }
  let body: any;
  try {
    body = await request.json();
  } catch {
    return { error: jsonError(400, "Invalid JSON.") };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: jsonError(400, "Invalid request.") };
  }
  if (JSON.stringify(body).length > 20000) {
    return { error: jsonError(413, "Request too large.") };
  }
  return { body };
}

export function trimmedString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
