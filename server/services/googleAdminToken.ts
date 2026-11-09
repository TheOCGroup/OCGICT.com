import { createPublicKey, verify as verifySignature } from "node:crypto";
import type { GoogleAdminOAuthConfig } from "./googleAdminOAuth.js";
import { isAuthorizedGoogleAdminClaims } from "./googleAdminOAuth.js";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const KEYS_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs";
const MAX_ID_TOKEN_LENGTH = 16384;
type Jwk = { kty?: string; kid?: string; alg?: string; use?: string; n?: string; e?: string };

/** Exchange the one-use authorization code exclusively on Google's HTTPS endpoint. */
export async function exchangeGoogleAdminCode(
  code: string, config: GoogleAdminOAuthConfig, fetcher: typeof fetch = fetch,
): Promise<string | null> {
  if (!code || code.length > 4096) return null;
  try {
    const response = await fetcher(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code, client_id: config.clientId,
        client_secret: config.clientSecret, redirect_uri: config.redirectUri,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = await response.json() as { id_token?: unknown };
    return typeof data.id_token === "string" && data.id_token.length <= MAX_ID_TOKEN_LENGTH ? data.id_token : null;
  } catch { return null; }
}

/** Independently verify Google's RS256 signature using Google's published public keys. */
export async function verifyGoogleAdminIdToken(
  token: string, config: GoogleAdminOAuthConfig, expectedNonce: string,
  now = Date.now(), fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!token || token.length > MAX_ID_TOKEN_LENGTH) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString()) as { alg?: unknown; kid?: unknown; typ?: unknown };
    if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid || header.kid.length > 256) return false;
    const response = await fetcher(KEYS_ENDPOINT, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return false;
    const jwks = await response.json() as { keys?: Jwk[] };
    if (!Array.isArray(jwks.keys)) return false;
    const key = jwks.keys.find((k) => k.kid === header.kid && k.kty === "RSA" &&
      (k.alg === undefined || k.alg === "RS256") && (k.use === undefined || k.use === "sig") &&
      typeof k.n === "string" && typeof k.e === "string");
    if (!key) return false;
    const publicKey = createPublicKey({ key: { kty: "RSA", n: key.n!, e: key.e! }, format: "jwk" });
    if (!verifySignature("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]),
      publicKey, Buffer.from(parts[2], "base64url"))) return false;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString()) as Record<string, unknown>;
    return isAuthorizedGoogleAdminClaims(claims, config, expectedNonce, now) &&
      typeof claims.iat === "number" && claims.iat * 1000 <= now + 60_000;
  } catch { return false; }
}
