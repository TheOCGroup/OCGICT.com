/**
 * TEMPORARY diagnostic for the isolated A/B site ONLY (experiment branch —
 * never merges). Reports whether the function env carries a key (length
 * only, never the value) and the sanitized Google-side outcome of one
 * minimal chat call and one minimal TTS call, so an auth failure can be
 * classified: invalid key vs API restriction vs quota vs model access.
 * Gated by the same paid-approval flag as the paid paths.
 */
import { consumeBudget, netlifyBlobsBudgetStore } from "../../server/services/gBudget.js";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function probe(url: string, gkey: string, body: unknown): Promise<{ status: number; googleErrorStatus: string | null; googleMessage: string | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": gkey },
    body: JSON.stringify(body),
  });
  let googleErrorStatus: string | null = null;
  let googleMessage: string | null = null;
  if (!res.ok) {
    try {
      const data: any = await res.json();
      googleErrorStatus = data?.error?.status ?? null;
      // Google error messages never contain the submitted key; cap length.
      googleMessage = typeof data?.error?.message === "string" ? data.error.message.slice(0, 160) : null;
    } catch { /* non-JSON error body */ }
  } else {
    await res.arrayBuffer().catch(() => undefined);
  }
  return { status: res.status, googleErrorStatus, googleMessage };
}

export default async function handler(request: Request): Promise<Response> {
  if ((process.env.OCG_G_PAID_MODEL_APPROVED || "").trim().toLowerCase() !== "true") {
    return json(403, { error: "diag disabled" });
  }
  const gkey = process.env.GEMINI_API_KEY;
  const base = "https://generativelanguage.googleapis.com/v1beta/models";
  const out: Record<string, unknown> = { keyPresent: Boolean(gkey), keyLength: gkey ? gkey.length : 0 };
  if (!gkey) return json(200, out);
  try {
    const store = await netlifyBlobsBudgetStore();
    await consumeBudget(store, "chat", process.env);
    await consumeBudget(store, "tts", process.env);
  } catch { /* metering must not block diagnosis on the experiment site */ }
  out.chat = await probe(`${base}/gemini-3.8-flash:generateContent`, gkey, {
    contents: [{ parts: [{ text: "Reply with the single word: ready" }] }],
    generationConfig: { maxOutputTokens: 8 },
  });
  out.tts = await probe(`${base}/gemini-3.8-flash-tts:generateContent`, gkey, {
    contents: [{ parts: [{ text: "Ready." }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Achird" } } },
    },
  });
  return json(200, out);
}

export const config = { path: "/api/g/diag" };
