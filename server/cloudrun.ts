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
import marketplaceListings from "../netlify/functions/marketplace-listings.mts";
import { registerBudgetStoreFactory, platformBudgetStore, storeBackend, leadBackend } from "./services/gPlatform.js";
import { ROUTE_PATHS, trustedClientIp, staticFilePath, isHealthPath, isKnownPagePath, cacheControlFor, rateLimitScopeForRequest, SECURITY_HEADERS } from "./cloudrunRoutes.js";
import { getGFirestore, resolveFirestoreCollectionName } from "./services/gFirestore.js";
import { firestoreBudgetStore } from "./services/gFirestoreStore.js";
import { parseFormSubmission, evaluateFormIntake, persistLeadToFirestore, FORM_LIMITS } from "./services/gLeadStore.js";
import { consumeRateLimit } from "./services/gRateLimit.js";
import { registerListingsSource } from "./services/gListingsSource.js";
import {
  adminAuthConfig,
  verifyAdminPassword,
  mintAdminSession,
  adminSessionCookie,
  adminSessionClearCookie,
  isAdminAuthenticated,
} from "./services/adminAuth.js";

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
 *  - Form intake hardening (2026-11-01): allowlist + caps + honeypot +
 *    per-IP rate limit + reference dedupe live in services/gLeadStore.ts
 *    and the intake branch below; the old accept-anything behavior is gone.
 *  - Admin auth (2026-11-01): /api/admin/login|logout|session are served
 *    here with server-side, env-configured credentials (services/
 *    adminAuth.ts), fail-closed when unconfigured; all other /api/admin/*
 *    routes require a valid session and currently answer 404 — the admin
 *    data layer stays disabled pending a separate founder activation.
 *  - Marketplace listings: the Firestore listings source is registered
 *    here for /api/marketplace/listings (services/gListings.ts).
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
  marketplaceListings as Handler,
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

/** readBody with a hard size ceiling: rejects as soon as the limit is
 *  exceeded instead of buffering an unbounded request body. */
async function readBodyLimited(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > maxBytes) {
      const err = new Error("Request body too large.") as Error & { code?: string };
      err.code = "OCG_BODY_TOO_LARGE";
      throw err;
    }
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

function jsonReply(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/** Admin login throttling (in-memory, per instance): after 5 failed
 *  attempts from one client IP inside 10 minutes, further attempts are
 *  refused until the window slides. A successful login clears the count.
 *  Deliberately separate from the Firestore-backed public rate limiter —
 *  admin auth must keep working (and failing closed) even if the shared
 *  store is down. */
const ADMIN_LOGIN_WINDOW_MS = 10 * 60 * 1000;
const ADMIN_LOGIN_MAX_FAILURES = 5;
const adminLoginFailures = new Map<string, number[]>();

function adminLoginThrottled(clientId: string, nowMs: number): boolean {
  const recent = (adminLoginFailures.get(clientId) || []).filter((t) => nowMs - t < ADMIN_LOGIN_WINDOW_MS);
  adminLoginFailures.set(clientId, recent);
  return recent.length >= ADMIN_LOGIN_MAX_FAILURES;
}

function recordAdminLoginFailure(clientId: string, nowMs: number): void {
  const recent = adminLoginFailures.get(clientId) || [];
  recent.push(nowMs);
  adminLoginFailures.set(clientId, recent);
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

async function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string, status = 200): Promise<boolean> {
  const filePath = staticFilePath(STATIC_DIR, pathname);
  if (!filePath) return false;
  const info = await stat(filePath).catch(() => null);
  if (info?.isFile()) {
    res.statusCode = status;
    res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.setHeader("Content-Length", String(info.size));
    res.setHeader("Cache-Control", cacheControlFor(pathname));
    if (req.method === "HEAD") { res.end(); return true; }
    createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Security headers go on every response this host produces (health,
  // API handlers, form intake, static files, SPA fallback, and errors).
  // Set before any branch writes its own headers; writeHead merges.
  for (const [name, value] of SECURITY_HEADERS) res.setHeader(name, value);
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
    let rawBody: string;
    try {
      rawBody = (await readBodyLimited(req, FORM_LIMITS.maxBodyBytes)).toString("utf8");
    } catch {
      res.writeHead(413, { "Content-Type": "text/plain" });
      res.end("Submission too large.");
      return;
    }
    const parsed = parseFormSubmission(rawBody);
    if (parsed) {
      if (leadBackend(env) !== "firestore") { res.writeHead(404); res.end("Not found."); return; }
      // Hardened intake policy (allowlist, caps, honeypot): see gLeadStore.
      const decision = evaluateFormIntake(parsed.formName, parsed.fields);
      if (decision.action === "reject") {
        if (decision.reason === "unknown_form") { res.writeHead(404); res.end("Not found."); return; }
        if (decision.reason === "field_too_long") { res.writeHead(413, { "Content-Type": "text/plain" }); res.end("Submission too large."); return; }
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Invalid submission.");
        return;
      }
      if (decision.action === "drop") {
        // Honeypot filled: accept silently, persist nothing.
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
        return;
      }
      // Rate limit before any store write, keyed on the trusted client IP
      // (last X-Forwarded-For entry). Fail-closed: a limiter/store error
      // refuses the submission honestly instead of recording unboundedly.
      // Gated on EITHER backend being Firestore (QUINCEY LOW F-2): the
      // gate follows the lead path it protects, so a future config where
      // only the lead backend is Firestore cannot silently skip limiting.
      if (storeBackend(env) === "firestore" || leadBackend(env) === "firestore") {
        try {
          const clientId = trustedClientIp(req.headers["x-forwarded-for"], req.socket.remoteAddress);
          const rl = await consumeRateLimit(await platformBudgetStore(), "lead", clientId, env);
          if (!rl.allowed) {
            res.writeHead(429, { "Content-Type": "text/plain", "Retry-After": String(rl.retryAfterSeconds) });
            res.end("Too many requests. Please try again shortly.");
            return;
          }
        } catch {
          res.writeHead(503, { "Content-Type": "text/plain" });
          res.end("Lead store unavailable.");
          return;
        }
      }
      try {
        const gf = await getGFirestore();
        const outcome = await persistLeadToFirestore(gf.leads, decision.formName, decision.fields);
        res.writeHead(200, { "Content-Type": "text/plain", "X-OCG-Intake": outcome });
        res.end("OK");
      } catch {
        res.writeHead(503, { "Content-Type": "text/plain" });
        res.end("Lead store unavailable.");
      }
      return;
    }
  }

  // Admin authentication (server-side; replaces the historical client-side
  // password check — see services/adminAuth.ts). Fail-closed when
  // ADMIN_PASSWORD / ADMIN_SESSION_SECRET are not configured, which is
  // the production state today: the admin surface is disabled, and every
  // protected admin route rejects anonymous callers server-side.
  if (pathname === "/api/admin/login" && req.method === "POST") {
    const config = adminAuthConfig(env);
    if (!config) { jsonReply(res, 503, { error: "Admin access is not configured on this deployment." }); return; }
    const clientId = trustedClientIp(req.headers["x-forwarded-for"], req.socket.remoteAddress);
    const nowMs = Date.now();
    if (adminLoginThrottled(clientId, nowMs)) {
      res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "600" });
      res.end(JSON.stringify({ error: "Too many attempts. Please try again later." }));
      return;
    }
    let candidate = "";
    try {
      const body = JSON.parse((await readBodyLimited(req, 4096)).toString("utf8")) as { password?: unknown };
      if (typeof body?.password === "string") candidate = body.password;
    } catch { /* malformed body falls through to a generic 401 */ }
    if (!verifyAdminPassword(candidate, config)) {
      recordAdminLoginFailure(clientId, nowMs);
      jsonReply(res, 401, { error: "Invalid credentials." });
      return;
    }
    adminLoginFailures.delete(clientId);
    res.setHeader("Set-Cookie", adminSessionCookie(mintAdminSession(config, nowMs)));
    jsonReply(res, 200, { ok: true });
    return;
  }
  if (pathname === "/api/admin/logout" && req.method === "POST") {
    res.setHeader("Set-Cookie", adminSessionClearCookie());
    jsonReply(res, 200, { ok: true });
    return;
  }
  if (pathname === "/api/admin/session" && req.method === "GET") {
    jsonReply(res, 200, {
      configured: adminAuthConfig(env) !== null,
      authenticated: isAdminAuthenticated(req.headers.cookie, env, Date.now()),
    });
    return;
  }
  if (pathname.startsWith("/api/admin/")) {
    if (!isAdminAuthenticated(req.headers.cookie, env, Date.now())) {
      jsonReply(res, 401, { error: "Unauthorized." });
      return;
    }
    // Authenticated, but the admin data layer is deliberately disabled
    // until a separate founder-approved activation (P0 §3): no endpoint
    // serves administrative data yet.
    jsonReply(res, 404, { error: "Not found." });
    return;
  }

  const rateScope = rateLimitScopeForRequest(pathname, req.method || "");
  if (rateScope) {
    try {
      const clientId = trustedClientIp(req.headers["x-forwarded-for"], req.socket.remoteAddress);
      const decision = await consumeRateLimit(await platformBudgetStore(), rateScope, clientId, env);
      if (!decision.allowed) {
        res.writeHead(429, { "Content-Type": "application/json", "Retry-After": String(decision.retryAfterSeconds) });
        res.end(JSON.stringify({ error: "Too many property lookup requests. Please try again shortly." }));
        return;
      }
    } catch {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Property lookup is temporarily unavailable." }));
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
    // SPA fallback: known client routes get the shell with 200; unknown
    // paths get the same shell (the client renders its NotFound page)
    // with an honest 404 status.
    const status = isKnownPagePath(pathname) ? 200 : 404;
    if (await serveStatic(req, res, "/", status)) return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found.");
}

export async function main(): Promise<void> {
  const env = process.env as Record<string, string | undefined>;
  if (storeBackend(env) === "firestore" || leadBackend(env) === "firestore") {
    const gf = await getGFirestore();
    if (storeBackend(env) === "firestore") {
      registerBudgetStoreFactory(async () => firestoreBudgetStore(gf.counters, resolveFirestoreCollectionName(env.OCG_FIRESTORE_COUNTERS_COLLECTION, "g-counters")));
    }
    // Marketplace listings read source (empty until listing documents
    // exist — the endpoint and page handle that state by design).
    registerListingsSource(gf.listings);
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
