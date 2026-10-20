import { GIntelligenceGateway } from "../../server/services/gIntelligenceGateway.js";

// A standalone Netlify function: it never starts the Express server.
export default async function handler(request: Request, context?: { deploy?: { context?: string } }): Promise<Response> {
  const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers });
  if (Number(request.headers.get("content-length") || 0) > 20000) return new Response(JSON.stringify({ error: "Request too large." }), { status: 413, headers });
  let body: any;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body)
    || typeof body.message !== "string" || !body.message.trim() || body.message.length > 4000
    || (body.sessionId !== undefined && (typeof body.sessionId !== "string" || body.sessionId.length > 128))
    || (body.history !== undefined && (!Array.isArray(body.history) || body.history.length > 16
      || body.history.some((x: any) => !x || (x.role !== "user" && x.role !== "assistant")
        || typeof x.content !== "string" || x.content.length > 4000)))) {
    return new Response(JSON.stringify({ error: "Invalid chat request." }), { status: 400, headers });
  }
  // No billing-capable model invocation in preview until provider credentials,
  // budget and abuse checks have been independently verified.
  const previewLocalOnly = context?.deploy?.context === "deploy-preview";
  if (!previewLocalOnly && process.env.OCG_G_CHAT_ENABLED !== "true") {
    return new Response(JSON.stringify({ error: "G backend is not enabled in this environment." }), { status: 503, headers });
  }
  // An explicit cost gate prevents accidental paid model calls after enabling chat.
  // Local-only mode permits free acceptance testing while paid providers stay blocked.
  const hasPaidCredentials = process.env.GEMINI_AUTH_MODE === "vertex"
    || Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim());
  if (!previewLocalOnly && hasPaidCredentials && process.env.OCG_G_PAID_MODEL_APPROVED !== "true") {
    return new Response(JSON.stringify({ error: "Paid AI usage has not been approved for this environment." }), { status: 503, headers });
  }
  // Approval is not metering. Never enable a paid provider without a separately
  // verified persistent usage meter that enforces the spending ceiling.
  if (!previewLocalOnly && hasPaidCredentials) {
    return new Response(JSON.stringify({
      error: "Paid model access is paused until a persistent usage budget is verified."
    }), { status: 503, headers });
  }
  // Guard against oversized history even when the body has no Content-Length.
  if (JSON.stringify(body).length > 20000) {
    return new Response(JSON.stringify({ error: "Request too large." }), { status: 413, headers });
  }
  try {
    const data = await GIntelligenceGateway.processMessage({
      sessionId: body.sessionId || "", message: body.message.trim(), history: body.history, localOnly: previewLocalOnly,
    });
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    const rateLimited = error instanceof Error && error.message.startsWith("Rate limit exceeded");
    return new Response(JSON.stringify({ error: rateLimited ? "Too many messages." : "G is temporarily unavailable." }), { status: rateLimited ? 429 : 503, headers });
  }
}

export const config = {
  path: "/api/g/chat",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: "ip", windowSize: 60, windowLimit: 30 },
};

