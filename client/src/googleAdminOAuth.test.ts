import { describe, expect, it } from "vitest";
import {
  createGoogleAdminState, googleAdminAuthorizationUrl, googleAdminOAuthConfig,
  isAuthorizedGoogleAdminClaims, verifyGoogleAdminState,
} from "../../server/services/googleAdminOAuth.js";

const env = {
  OCG_ADMIN_GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com",
  OCG_ADMIN_GOOGLE_CLIENT_SECRET: "test-client-secret",
  OCG_ADMIN_GOOGLE_REDIRECT_URI: "https://example.com/api/admin/google/callback",
  OCG_ADMIN_GOOGLE_ALLOWED_EMAILS: "owner@example.com",
  ADMIN_SESSION_SECRET: "a".repeat(48),
};

describe("Google admin OAuth security primitives", () => {
  it("fails closed without client credentials, allowlist, or session secret", () => {
    expect(googleAdminOAuthConfig({})).toBeNull();
    expect(googleAdminOAuthConfig({ ...env, OCG_ADMIN_GOOGLE_ALLOWED_EMAILS: "" })).toBeNull();
    expect(googleAdminOAuthConfig({ ...env, ADMIN_SESSION_SECRET: "short" })).toBeNull();
    expect(googleAdminOAuthConfig({ ...env, OCG_ADMIN_GOOGLE_REDIRECT_URI: "http://example.com/api/admin/google/callback" })).toBeNull();
    expect(googleAdminOAuthConfig({ ...env, OCG_ADMIN_GOOGLE_REDIRECT_URI: "https://example.com/other" })).toBeNull();
  });

  it("creates a Google authorization URL bound to the configured callback, state and nonce", () => {
    const config = googleAdminOAuthConfig(env)!;
    const state = createGoogleAdminState(config, 1_000_000);
    const url = new URL(googleAdminAuthorizationUrl(config, state.state, state.nonce));
    expect(url.hostname).toBe("accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe(env.OCG_ADMIN_GOOGLE_REDIRECT_URI);
    expect(url.searchParams.get("scope")).toBe("openid email");
    expect(url.searchParams.get("state")).toBe(state.state);
    expect(url.searchParams.get("nonce")).toBe(state.nonce);
  });

  it("rejects tampered, expired, and mismatched OAuth state", () => {
    const config = googleAdminOAuthConfig(env)!;
    const state = createGoogleAdminState(config, 1_000_000);
    expect(verifyGoogleAdminState(state.cookie, state.state, config, 1_000_001)).toBe(state.nonce);
    expect(verifyGoogleAdminState(state.cookie, "wrong", config, 1_000_001)).toBeNull();
    expect(verifyGoogleAdminState(state.cookie + "x", state.state, config, 1_000_001)).toBeNull();
    expect(verifyGoogleAdminState(state.cookie, state.state, config, 1_300_001)).toBeNull();
  });

  it("requires verified email, expected issuer, audience, nonce and allowlisted principal", () => {
    const config = googleAdminOAuthConfig(env)!;
    const claims = { iss: "https://accounts.google.com", aud: config.clientId, email_verified: true,
      email: "owner@example.com", sub: "google-account-1", nonce: "expected", exp: 2000 };
    expect(isAuthorizedGoogleAdminClaims(claims, config, "expected", 1_000_000)).toBe(true);
    for (const changed of [
      { email: "attacker@example.com" }, { email_verified: false }, { aud: "other" },
      { iss: "https://attacker.example" }, { nonce: "wrong" }, { exp: 100 },
    ]) {
      expect(isAuthorizedGoogleAdminClaims({ ...claims, ...changed }, config, "expected", 1_000_000)).toBe(false);
    }
  });
});
