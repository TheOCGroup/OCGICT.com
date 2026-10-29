import { jsonError, jsonHeaders, readGuardedJson, submitNetlifyForm, trimmedString } from "./_forms.js";

/**
 * POST /api/seller/action — records a seller's response to their review
 * (accept preliminary offer, counter, request call/walkthrough) as a durable
 * Netlify Forms submission on `ocg-seller-action`. This replaces the Express
 * route whose Piper record existed only in process memory.
 */
const ALLOWED = ["ACCEPT_PRELIMINARY_OFFER", "COUNTEROFFER", "REQUEST_CALL", "REQUEST_WALKTHROUGH"];

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "Method not allowed.");
  const parsed = await readGuardedJson(request);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body;

  const offerId = trimmedString(body.offerId, 80);
  const action = trimmedString(body.action, 40);
  if (!offerId) return jsonError(400, "Missing offerId");
  if (!ALLOWED.includes(action)) return jsonError(400, "Invalid seller action");

  const counterAmount = body.counterAmount == null ? undefined : Number(body.counterAmount);
  if (action === "COUNTEROFFER" && (!Number.isFinite(counterAmount) || Number(counterAmount) <= 0)) {
    return jsonError(400, "A valid counteroffer amount is required");
  }
  const preferredWindow = trimmedString(body.preferredWindow, 200);
  const notes = trimmedString(body.notes, 1000);
  const reference = `SELLER_ACTION_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    await submitNetlifyForm(request, "ocg-seller-action", {
      offerId,
      action,
      counterAmount: counterAmount !== undefined ? String(counterAmount) : "",
      preferredWindow,
      notes,
      reference,
    });
  } catch {
    return jsonError(502, "We could not record that request. Nothing was saved; please try again.");
  }

  return new Response(
    JSON.stringify({
      ok: true,
      reference,
      delivery: "netlify-forms",
      message:
        action === "ACCEPT_PRELIMINARY_OFFER"
          ? "Your preliminary acceptance was recorded. It remains subject to walkthrough, verification, title review, and a separate written purchase agreement."
          : "Your request was recorded for OCG review.",
    }),
    { status: 201, headers: jsonHeaders },
  );
}

export const config = {
  path: "/api/seller/action",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 10 },
};
