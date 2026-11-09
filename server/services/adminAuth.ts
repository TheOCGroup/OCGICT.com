/**
 * Server-side admin authentication for the Cloud Run host.
 *
 * Replaces the historical client-side password comparison that shipped in
 * the public JS bundle (QUINCEY MODERATE-1, 2026-11-01). There is NO
 * credential in source code and none in the client bundle:
 *
 *  - The admin password exists only as the ADMIN_PASSWORD environment
 *    variable (set at deploy time, founder-controlled, never committed).
 *  - The session-signing secret exists only as ADMIN_SESSION_SECRET.
 *  - When either is absent or too short, admin access is NOT CONFIGURED
 *    and every admin endpoint fails closed (503 on login, unauthenticated
 *    on session checks, 401 on protected routes). Production today has
 *    neither variable set, so the admin surface stays disabled until the
 *    founder deliberately configures it.
 *
 * Sessions are stateless HMAC-signed tokens in an HttpOnly cookie:
 *   ocg_admin_session = base64url(JSON {exp}) + "." + base64url(HMAC)
 * 12-hour expiry. Verification is timing-safe and rejects tampered,
 * expired, or malformed tokens. SameSite=Strict + the JSON-only login
 * endpoint (no CORS headers are ever emitted) provide CSRF resistance
 * for this single-admin surface.
 *
 * Tenant separation: there is exactly one admin principal (the site
 * owner) and no cross-organization data on this host; the admin data
 * endpoints themselves remain disabled (404 after auth) until a separate
 * founder-approved admin data-layer activation.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { googleAdminOAuthConfig } from "./googleAdminOAuth.js";

export const ADMIN_COOKIE = "ocg_admin_session";
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 16;
const MIN_SECRET_LENGTH = 32;

export interface AdminAuthConfig {
  password: string;
  secret: string;
}

/** The configured admin credentials, or null when admin access is not
 *  configured (fail-closed). Values come only from the environment. */
export function adminAuthConfig(env: Record<string, string | undefined>): AdminAuthConfig | null {
  const password = env.ADMIN_PASSWORD || "";
  const secret = env.ADMIN_SESSION_SECRET || "";
  if (password.length < MIN_PASSWORD_LENGTH) return null;
  if (secret.length < MIN_SECRET_LENGTH) return null;
  return { password, secret };
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Timing-safe password check: compares SHA-256 digests so the comparison
 *  time does not leak the stored password's length or content. */
export function verifyAdminPassword(candidate: string, config: AdminAuthConfig): boolean {
  if (typeof candidate !== "string" || candidate.length === 0 || candidate.length > 256) return false;
  return timingSafeEqual(sha256(candidate), sha256(config.password));
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64, "utf8").digest("base64url");
}

/** Mint a session token expiring ADMIN_SESSION_TTL_MS after `nowMs`. */
export function mintAdminSession(config: AdminAuthConfig, nowMs: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: nowMs + ADMIN_SESSION_TTL_MS }), "utf8").toString("base64url");
  return `${payload}.${sign(payload, config.secret)}`;
}

/** Validate a session token: signature (timing-safe) + expiry. */
export function verifyAdminSession(token: string | undefined, config: AdminAuthConfig, nowMs: number): boolean {
  if (!token || typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload, config.secret);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof parsed.exp === "number" && parsed.exp > nowMs;
  } catch {
    return false;
  }
}

/** Extract the admin session cookie value from a Cookie header. */
export function adminSessionFromCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === ADMIN_COOKIE) return part.slice(eq + 1).trim();
  }
  return undefined;
}

/** Set-Cookie value for a fresh session (Secure: this host is HTTPS-only
 *  in production behind Google's front end). */
export function adminSessionCookie(token: string): string {
  const maxAge = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
  return `${ADMIN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function adminSessionClearCookie(): string {
  return `${ADMIN_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

/** Domain separation prevents legacy password sessions from becoming Google sessions. */
export function googleAdminSessionSecret(secret: string): string {
  return createHmac("sha256", secret).update("ocgict-google-admin-session-v1").digest("base64url");
}

/** Is this request authenticated as admin? Fail-closed when unconfigured. */
export function isAdminAuthenticated(
  cookieHeader: string | undefined,
  env: Record<string, string | undefined>,
  nowMs: number,
): boolean {
  const config = googleAdminOAuthConfig(env);
  if (!config) return false;
  return verifyAdminSession(adminSessionFromCookie(cookieHeader), { password: "", secret: googleAdminSessionSecret(config.sessionSecret) }, nowMs);
}
