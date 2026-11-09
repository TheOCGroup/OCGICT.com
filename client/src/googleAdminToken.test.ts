import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { exchangeGoogleAdminCode, verifyGoogleAdminIdToken } from "../../server/services/googleAdminToken.js";
import { googleAdminOAuthConfig } from "../../server/services/googleAdminOAuth.js";

const config = googleAdminOAuthConfig({
  OCG_ADMIN_GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com",
  OCG_ADMIN_GOOGLE_CLIENT_SECRET: "secret",
  OCG_ADMIN_GOOGLE_REDIRECT_URI: "https://example.com/api/admin/google/callback",
  OCG_ADMIN_GOOGLE_ALLOWED_EMAILS: "owner@example.com",
  ADMIN_SESSION_SECRET: "s".repeat(48),
})!;

describe("Google OAuth token verification", () => {
  it("exchanges authorization codes only with Google and configured callback", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id_token: "signed.token.value" }), { status: 200 });
    }) as typeof fetch;
    expect(await exchangeGoogleAdminCode("one-time-code", config, fetcher)).toBe("signed.token.value");
    expect(calls[0].url).toBe("https://oauth2.googleapis.com/token");
    const params = new URLSearchParams(String(calls[0].init.body));
    expect(params.get("redirect_uri")).toBe(config.redirectUri);
    expect(params.get("grant_type")).toBe("authorization_code");
    expect(await exchangeGoogleAdminCode("", config, fetcher)).toBeNull();
  });

  it("verifies RS256 signature and rejects altered tokens or unauthorized identities", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
    const fetcher = (async (url: string) => {
      expect(url).toBe("https://www.googleapis.com/oauth2/v3/certs");
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid: "key1", alg: "RS256", use: "sig" }] }), { status: 200 });
    }) as typeof fetch;
    const now = 1_000_000;
    const encode = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
    const header = encode({ alg: "RS256", kid: "key1" });
    const claims = { iss: "https://accounts.google.com", aud: config.clientId,
      email: "owner@example.com", email_verified: true, sub: "account1",
      nonce: "nonce1", iat: 900, exp: 2000 };
    const payload = encode(claims);
    const input = header + "." + payload;
    const signature = sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
    expect(await verifyGoogleAdminIdToken(input + "." + signature, config, "nonce1", now, fetcher)).toBe(true);
    expect(await verifyGoogleAdminIdToken(input + "." + signature, config, "wrong", now, fetcher)).toBe(false);
    expect(await verifyGoogleAdminIdToken(header + "." + encode({ ...claims, email: "attacker@example.com" }) + "." + signature,
      config, "nonce1", now, fetcher)).toBe(false);
    expect(await verifyGoogleAdminIdToken(input + "." + signature.slice(0, -2) + "xx",
      config, "nonce1", now, fetcher)).toBe(false);
  });
});
