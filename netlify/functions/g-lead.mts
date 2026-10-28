import { jsonError, jsonHeaders, readGuardedJson, submitNetlifyForm, trimmedString } from "./_forms.js";
import { consumeRateLimit, clientIdFromRequest, rateLimitActive } from "../../server/services/gRateLimit.js";
import { netlifyBlobsBudgetStore } from "../../server/services/gBudget.js";

/**
 * POST /api/g/lead — G conversation follow-up intake.
 *
 * The visitor reviews and confirms this submission in the chat UI (explicit
 * consent checkbox) before it is sent. The durable record is a Netlify Forms
 * submission on the `ocg-g-lead` form: persistent, visible to the OCG team in
 * the Netlify dashboard, and covered by the form's email notification.
 * Success is reported only after Netlify accepts the submission.
 */
export default async function handler(request: Request, context?: { ip?: string; deploy?: { context?: string } }): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "Method not allowed.");
  // Shared-store rate limit before any intake work: atomic across
  // instances, platform-IP identity. Fail-closed with an honest message —
  // a refused submission is never reported as recorded.
  if (rateLimitActive(context, process.env as Record<string, string | undefined>)) {
    try {
      const rl = await consumeRateLimit(await netlifyBlobsBudgetStore(), "lead", clientIdFromRequest(request, context), process.env as Record<string, string | undefined>);
      if (!rl.allowed) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
          status: 429,
          headers: { ...jsonHeaders, "Retry-After": String(rl.retryAfterSeconds) },
        });
      }
    } catch {
      return jsonError(503, "We could not save your request. Nothing was recorded; please try again or email The OC Group.");
    }
  }
  const parsed = await readGuardedJson(request);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body;

  const name = trimmedString(body.name, 120);
  const email = trimmedString(body.email, 200);
  const phone = trimmedString(body.phone, 40);
  const role = trimmedString(body.role, 40);
  const address = trimmedString(body.address, 300);
  const summary = trimmedString(body.summary, 4000);
  const reference = trimmedString(body.reference, 64);

  if (!name) return jsonError(400, "Your name is required.");
  if (!email && !phone) return jsonError(400, "An email or phone number is required so OCG can reach you.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError(400, "That email address does not look complete.");
  if (!["seller", "investor", "buyer", "financing", "general"].includes(role)) {
    return jsonError(400, "Please tell us what kind of inquiry this is.");
  }
  if (body.consent !== true) return jsonError(400, "Consent is required before OCG can receive your information.");
  if (!/^[A-Za-z0-9-]{8,64}$/.test(reference)) return jsonError(400, "A submission reference is required.");

  try {
    await submitNetlifyForm(request, "ocg-g-lead", {
      name,
      email,
      phone,
      role,
      address,
      summary,
      reference,
      source: "G conversation",
    });
  } catch {
    return jsonError(502, "We could not save your request. Nothing was recorded; please try again or email The OC Group.");
  }

  return new Response(
    JSON.stringify({ ok: true, reference, delivery: "netlify-forms", status: "recorded" }),
    { status: 200, headers: jsonHeaders },
  );
}

export const config = {
  path: "/api/g/lead",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 10 },
};
