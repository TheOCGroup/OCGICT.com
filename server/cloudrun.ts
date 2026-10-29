import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import gChat from "../netlify/functions/g-chat.mts";
import gLead from "../netlify/functions/g-lead.mts";
import gTtsGemini from "../netlify/functions/g-tts-gemini.mts";
import gTts from "../netlify/functions/g-tts.mts";
import gVoiceSession from "../netlify/functions/g-voice-session.mts";
import sellerAction from "../netlify/functions/seller-action.mts";
import sellerLookup from "../netlify/functions/seller-lookup.mts";
import sellerOffer from "../netlify/functions/seller-offer.mts";
import sellerSuggestions from "../netlify/functions/seller-suggestions.mts";
import { registerBudgetStoreFactory, storeBackend, leadBackend } from "./services/gPlatform.js";
import { ROUTE_PATHS, trustedClientIp, staticFilePath, isHealthPath } from "./cloudrunRoutes.js";
import { getGFirestore } from "./services/gFirestore.js";
import { firestoreBudgetStore } from "./services/gFirestoreStore.js";
import { parseFormSubmission, persistLeadToFirestore } from "./services/gLeadStore.js";

/**
 * Cloud Run fallback host for G (temporary; OCG HOST OS is the long-term
 * destination). Serves the SAME certified function handlers that run on
 * Netlify — no handler code is forked — behind a thin HTTP adapter:
 *
 *  - Static site from dist/public (the vite build), SPA fallback.
 *  - API routes dispatch to the Netlify function modules with a
 *    Netlify-shaped context ({ ip, deploy: { context: "production" } }), so
 *    the budget/rate-limit activation rules engage exactly as in production.
 *  - Client identity: Cloud Run's front end APPENDS the real client IP as
 *    the LAST X-Forwarded-For entry, so the last entry is the trusted one
 *    (earlier entries are client-supplied and never trusted).
 *  - Lead intake: the certified functions record leads by POSTing a
 *    Netlify-Forms submission to the site's own origin. When the lead
 *    backend is Firestore, this server answers that POST at / and persists
 *    the submission to the `g-leads` collection, replying success only
 *    after the durable write — the same acceptance semantics as Netlify.
 *  - Durable counters: when OCG_STORE_BACKEND=firestore, the Firestore
 *    BudgetStore is registered with gPlatform before traffic is accepted.
 */
type Handler = (request: Request, context?: { ip?: string; deploy?: { context?: string } }) => Promise<Response>;

const HANDLERS: Handler[] = [
  gChat as Handler,
  gLead as Handler,
  gTtsGemini as Handler,
  gTts as Handler,
  gVoiceSession as Handler,
  sellerAction as Handler,
  sellerLookup as Handler,
  sellerOffer as Handler,
  sellerSuggestions as Handler,
];

export const ROUTES: Record<string, Handler> = Object.fromEntries(
  ROUTE_PATHS.map((p, i) => [p, HANDLERS[i]]),
);

export function routeFor(pathname: string): Handler | null {
  return ROUTES[pathname] ?? null;
}

const STATIC_DIR = process.env.OCG_STATIC_DIR
  || path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  ".map": "application/json", ".wav": "audio/wav", ".mp3": "audio/mpeg",
  ".xml": "application/xml; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8",
};

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function writeResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((v, k) => {
    if (k === "content-length" || k === "transfer-encoding" || k === "connection") return;
    res.setHeader(k, v);
  });
  if (!response.body) { res.end(); return; }
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && !res.write(Buffer.from(value))) {
      await new Promise<void>((resolve) => res.once("drain", resolve));
    }
  }
  res.end();
}

async function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const filePath = staticFilePath(STATIC_DIR, pathname);
  if (!filePath) return false;
  const info = await stat(filePath).catch(() => null);
  if (info?.isFile()) {
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.setHeader("Content-Length", String(info.size));
    if (req.method === "HEAD") { res.end(); return true; }
    createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || "/", "http://localhost");
  const { pathname } = url;
  const env = process.env as Record<string, string | undefined>;

  if (req.method === "GET" && isHealthPath(pathname)) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "ocg-g-cloudrun" }));
    return;
  }

  // Netlify-Forms compatibility endpoint (lead intake on the fallback).
  if (req.method === "POST" && pathname === "/" && (req.headers["content-type"] || "").includes("application/x-www-form-urlencoded")) {
    const parsed = parseFormSubmission((await readBody(req)).toString("utf8"));
    if (parsed) {
      if (leadBackend(env) !== "firestore") { res.writeHead(404); res.end("Not found."); return; }
      try {
        const gf = await getGFirestore();
        await persistLeadToFirestore(gf.leads, parsed.formName, parsed.fields);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      } catch {
        res.writeHead(503, { "Content-Type": "text/plain" });
        res.end("Lead store unavailable.");
      }
      return;
    }
  }

  const handler = routeFor(pathname);
  if (handler) {
    const body = await readBody(req);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(", "));
    }
    const host = req.headers.host || "localhost";
    const request = new Request(`https://${host}${req.url || "/"}`, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
    } as RequestInit);
    const context = {
      ip: trustedClientIp(req.headers["x-forwarded-for"], req.socket.remoteAddress),
      deploy: { context: "production" },
    };
    const response = await handler(request, context);
    await writeResponse(res, response);
    return;
  }

  if (pathname.startsWith("/api/")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found." }));
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    if (await serveStatic(req, res, pathname)) return;
    // SPA fallback for client-side routes.
    if (await serveStatic(req, res, "/")) return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found.");
}

export async function main(): Promise<void> {
  const env = process.env as Record<string, string | undefined>;
  if (storeBackend(env) === "firestore") {
    const gf = await getGFirestore();
    registerBudgetStoreFactory(async () => firestoreBudgetStore(gf.counters));
  }
  const port = Number(env.PORT || 8080);
  const server = createServer((req, res) => {
    handle(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal error.");
    });
  });
  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`ocg-g-cloudrun listening on ${port} (store=${storeBackend(env)}, leads=${leadBackend(env)})`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error("fatal:", err);
    process.exit(1);
  });
}
