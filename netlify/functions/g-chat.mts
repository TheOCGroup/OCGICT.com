import { GIntelligenceGateway } from "../../server/services/gIntelligenceGateway.js";
import { consumeBudget, netlifyBlobsBudgetStore } from "../../server/services/gBudget.js";
import { streamGeminiTokens, POC_CHAT_MODEL } from "../../server/services/geminiStream.js";
import { analyzeSellerContext, guardSellerReply } from "../../server/voice/sellerPolicy.js";
import { looksSpanish } from "../../server/services/streamingModelProvider.js";

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
        || typeof x.content !== "string" || x.content.length > 4000)))
    || (body.stream !== undefined && typeof body.stream !== "boolean")) {
    return new Response(JSON.stringify({ error: "Invalid chat request." }), { status: 400, headers });
  }
  // Hosted Netlify contexts (deploy previews and production) serve G chat in
  // local mode by default. Any other context must be explicitly enabled.
  const hostedContext = context?.deploy?.context === "deploy-preview" || context?.deploy?.context === "production";
  if (!hostedContext && process.env.OCG_G_CHAT_ENABLED !== "true") {
    return new Response(JSON.stringify({ error: "G backend is not enabled in this environment." }), { status: 503, headers });
  }
  // Guard against oversized history even when the body has no Content-Length.
  if (JSON.stringify(body).length > 20000) {
    return new Response(JSON.stringify({ error: "Request too large." }), { status: 413, headers });
  }

  // Paid model usage requires ALL of: provider credentials, explicit founder
  // approval, and headroom in the persistent daily budget (gBudget). When any
  // condition is missing, G answers with the free local engine instead — the
  // response's provider field says which engine answered, and a meter-driven
  // fallback is flagged explicitly. Approval alone never enables spend.
  const hasPaidCredentials = process.env.GEMINI_AUTH_MODE === "vertex"
    || Boolean((process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim());
  const paidApproved = hasPaidCredentials && process.env.OCG_G_PAID_MODEL_APPROVED === "true";
  let localOnly = true;
  let budgetFallback = false;
  if (paidApproved) {
    try {
      const store = await netlifyBlobsBudgetStore();
      const decision = await consumeBudget(store, "chat", process.env);
      if (decision.allowed) {
        localOnly = false;
      } else {
        budgetFallback = true;
      }
    } catch {
      // Meter unavailable: fail closed to the free local engine.
      budgetFallback = true;
    }
  }

  // POC (architecture reset, Option C): true token streaming. Only when the
  // paid path is fully open (credentials + founder approval + budget) — the
  // exact same gate as the non-streaming paid path above, including its
  // budget consumption. Otherwise the request falls through to the normal
  // JSON path and the client uses the certified behavior for this reply.
  if (body.stream === true && !localOnly) {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
    const encoder = new TextEncoder();
    const sse = (obj: Record<string, unknown>) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let full = "";
          let usage: unknown;
          for await (const delta of streamGeminiTokens({
            history: body.history || [],
            message: body.message.trim(),
            apiKey,
            onUsage: (u) => { usage = u; },
          })) {
            full += delta;
            controller.enqueue(sse({ t: delta }));
          }
          const historyText = (body.history || []).map((h: any) => h.content).join(" ");
          const sctx = analyzeSellerContext(body.history || [], body.message.trim(), {
            spanish: looksSpanish(body.message) || looksSpanish(historyText),
          });
          controller.enqueue(sse({
            done: true,
            replyText: guardSellerReply(full, sctx),
            provider: "Gemini",
            model: POC_CHAT_MODEL,
            delivery: sctx.isSeller ? { emotion: sctx.primary, stage: sctx.stage } : undefined,
            usage,
          }));
        } catch {
          controller.enqueue(sse({ error: "stream_failed" }));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  }

  try {
    const data = await GIntelligenceGateway.processMessage({
      sessionId: body.sessionId || "", message: body.message.trim(), history: body.history, localOnly,
    });
    return new Response(JSON.stringify(budgetFallback ? { ...data, budgetFallback: true } : data), { status: 200, headers });
  } catch (error) {
    const rateLimited = error instanceof Error && error.message.startsWith("Rate limit exceeded");
    return new Response(JSON.stringify({ error: rateLimited ? "Too many messages." : "G is temporarily unavailable." }), { status: rateLimited ? 429 : 503, headers });
  }
}

export const config = {
  path: "/api/g/chat",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["ip", "domain"], windowSize: 60, windowLimit: 30 },
};
