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
