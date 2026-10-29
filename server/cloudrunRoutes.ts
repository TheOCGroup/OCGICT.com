import path from "node:path";

/**
 * Pure routing surface + client-identity rules for the Cloud Run fallback
 * host (server/cloudrun.ts). Kept free of handler imports so it is
 * unit-testable without loading the function modules.
 */

/** Every API path the fallback host dispatches to a certified handler, in
 *  the same order server/cloudrun.ts binds the handler modules. */
export const ROUTE_PATHS = [
  "/api/g/chat",
  "/api/g/lead",
  "/api/g/tts-gemini",
  "/api/g/tts",
  "/api/g/voice/session",
  "/api/seller/action",
  "/api/seller/property-lookup",
  "/api/seller/preliminary-offer",
  "/api/seller/address-suggestions",
] as const;

export function hasRoute(pathname: string): boolean {
  return (ROUTE_PATHS as readonly string[]).includes(pathname);
}

/** Health endpoints the fallback host answers directly, before static
 *  serving. "/health" is the externally reachable path on Cloud Run:
 *  Google Front End reserves the exact path "/healthz" on run.app
 *  domains and answers it with its own 404 before the request reaches
 *  the container (QUINCEY live finding, staging certification
 *  2026-10-29). "/healthz" is kept for hosts without that reservation. */
export const HEALTH_PATHS = ["/health", "/healthz"] as const;

export function isHealthPath(pathname: string): boolean {
  return (HEALTH_PATHS as readonly string[]).includes(pathname);
}

/**
 * Security response headers applied by the Cloud Run harness to EVERY
 * response (health, API, static, SPA fallback, errors). Policy notes:
 * - script-src has NO 'unsafe-inline': the app ships only external module
 *   scripts plus a non-executable JSON-LD block.
 * - style-src keeps 'unsafe-inline' for React inline style attributes.
 * - style-src / font-src allow Google Fonts (the site loads Cormorant
 *   Garamond + Inter from fonts.googleapis.com / fonts.gstatic.com).
 * - img-src allows the two image CDNs the client actually uses
 *   (CloudFront asset host + Wikimedia Commons landmark photos, which
 *   redirect to upload.wikimedia.org).
 * - connect-src allows the Supabase project host used by the admin /
 *   marketplace client code (no other external API is contacted).
 * - media-src allows blob: so fetched TTS WAVs can play via object URLs.
 * - Permissions-Policy keeps microphone on self (G voice input) and
 *   disables camera / geolocation / payment / usb.
 * The dormant components/Map.tsx (Google Maps via a Forge proxy) is not
 * imported by any page; if it is ever wired in, this policy must gain
 * the Maps allowances in the same change.
 */
export const SECURITY_HEADERS = [
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
  [
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https://d2xsxph8kpxj0f.cloudfront.net https://commons.wikimedia.org https://upload.wikimedia.org; " +
      "font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; " +
      "media-src 'self' blob: data:; worker-src 'self' blob:; object-src 'none'; " +
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  ],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "microphone=(self), camera=(), geolocation=(), payment=(), usb=()"],
] as const;

/** The platform-trusted client IP on Cloud Run: the LAST X-Forwarded-For
 *  entry (appended by Google's front end). Earlier entries are
 *  client-supplied and never trusted. Falls back to the socket peer. */
export function trustedClientIp(xForwardedFor: string | string[] | undefined, remoteAddress?: string): string {
  const raw = Array.isArray(xForwardedFor) ? xForwardedFor.join(",") : xForwardedFor || "";
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length) return parts[parts.length - 1];
  return remoteAddress || "unknown";
}

/**
 * Resolve a request pathname to a file inside the static root, or null when
 * the path must not be served. Hardened traversal rules:
 *  - the pathname is URI-decoded first (a malformed escape rejects);
 *  - any literal ".." segment rejects the path outright;
 *  - the resolved absolute target must be the root itself or strictly
 *    beneath it (separator-aware prefix, so a sibling like
 *    "/srv/public-evil" can never satisfy the check).
 */
export function staticFilePath(staticDir: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const segments = decoded.split("/").filter((seg) => seg.length > 0 && seg !== ".");
  if (segments.some((seg) => seg === "..")) return null;
  const rel = segments.length ? segments.join("/") : "index.html";
  const base = path.resolve(staticDir);
  const target = path.resolve(base, rel);
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}
