/**
 * Pure routing surface + client-identity rules for the Cloud Run fallback
 * host (server/cloudrun.ts). Kept dependency-free so it is unit-testable
 * without importing the function handlers.
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

/** The platform-trusted client IP on Cloud Run: the LAST X-Forwarded-For
 *  entry (appended by Google's front end). Earlier entries are
 *  client-supplied and never trusted. Falls back to the socket peer. */
export function trustedClientIp(xForwardedFor: string | string[] | undefined, remoteAddress?: string): string {
  const raw = Array.isArray(xForwardedFor) ? xForwardedFor.join(",") : xForwardedFor || "";
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length) return parts[parts.length - 1];
  return remoteAddress || "unknown";
}
