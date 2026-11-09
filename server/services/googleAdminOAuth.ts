import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** OAuth configuration is intentionally independent of the legacy password login. */
export interface GoogleAdminOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizedEmails: string[];
  sessionSecret: string;
}

export function googleAdminOAuthConfig(env: Record<string, string | undefined>): GoogleAdminOAuthConfig | null {
  const clientId = env.OCG_ADMIN_GOOGLE_CLIENT_ID?.trim() || "";
  const clientSecret = env.OCG_ADMIN_GOOGLE_CLIENT_SECRET || "";
  const redirectUri = env.OCG_ADMIN_GOOGLE_REDIRECT_URI || "";
  const sessionSecret = env.ADMIN_SESSION_SECRET || "";
  const authorizedEmails = (env.OCG_ADMIN_GOOGLE_ALLOWED_EMAILS || "").split(",")
    .map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!clientId.endsWith(".apps.googleusercontent.com") || !clientSecret || sessionSecret.length < 32) return null;
  if (!authorizedEmails.length || !authorizedEmails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return null;
  try {
    const url = new URL(redirectUri);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
        url.pathname !== "/api/admin/google/callback") return null;
  } catch { return null; }
  return { clientId, clientSecret, redirectUri, authorizedEmails, sessionSecret };
}

function mac(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Signed, short-lived, single-browser OAuth state and nonce. */
export function createGoogleAdminState(config: GoogleAdminOAuthConfig, now = Date.now()) {
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ state, nonce, exp: now + 5 * 60_000 })).toString("base64url");
  return { state, nonce, cookie: payload + "." + mac(payload, config.sessionSecret) };
}

export function verifyGoogleAdminState(cookie: string | undefined, state: string, config: GoogleAdminOAuthConfig, now = Date.now()): string | null {
  if (!cookie || cookie.length > 2048 || !state || state.length > 128) return null;
  const [payload, signature, extra] = cookie.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = mac(payload, config.sessionSecret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { state?: unknown; nonce?: unknown; exp?: unknown };
    const stateA = Buffer.from(state);
    const stateB = Buffer.from(typeof parsed.state === "string" ? parsed.state : "");
    if (stateA.length !== stateB.length || !timingSafeEqual(stateA, stateB)) return null;
    return typeof parsed.exp === "number" && parsed.exp > now && parsed.exp <= now + 5 * 60_000 &&
      typeof parsed.nonce === "string" && parsed.nonce.length >= 24 ? parsed.nonce : null;
  } catch { return null; }
}

export function googleAdminAuthorizationUrl(config: GoogleAdminOAuthConfig, state: string, nonce: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** Claims must come from a cryptographically verified Google ID token, never from client input. */
export function isAuthorizedGoogleAdminClaims(
  claims: Record<string, unknown>, config: GoogleAdminOAuthConfig, expectedNonce: string, now = Date.now(),
): boolean {
  const email = typeof claims.email === "string" ? claims.email.toLowerCase() : "";
  return (claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com") &&
    claims.aud === config.clientId &&
    claims.email_verified === true &&
    typeof claims.sub === "string" && claims.sub.length > 0 &&
    claims.nonce === expectedNonce &&
    typeof claims.exp === "number" && claims.exp * 1000 > now &&
    config.authorizedEmails.includes(email);
}
