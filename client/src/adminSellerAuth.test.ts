import { describe, expect, it } from "vitest";
import {
  adminAuthConfig, adminSessionCookie, adminSessionFromCookie,
  isAdminAuthenticated, mintAdminSession, verifyAdminPassword,
  verifyAdminSession, ADMIN_SESSION_TTL_MS,
} from "../../server/services/adminAuth.js";

const env = { ADMIN_PASSWORD: "a-strong-test-password-2026", ADMIN_SESSION_SECRET: "a-strong-test-signing-secret-for-qa-2026" };
const config = adminAuthConfig(env)!;
const now = Date.parse("2026-11-07T20:00:00Z");

describe("seller review administrator session boundary", () => {
  it("fails closed when credentials are missing or too short", () => {
    expect(adminAuthConfig({})).toBeNull();
    expect(adminAuthConfig({ ADMIN_PASSWORD: "short", ADMIN_SESSION_SECRET: env.ADMIN_SESSION_SECRET })).toBeNull();
    expect(adminAuthConfig({ ADMIN_PASSWORD: env.ADMIN_PASSWORD, ADMIN_SESSION_SECRET: "short" })).toBeNull();
    expect(isAdminAuthenticated(undefined, {}, now)).toBe(false);
  });
  it("rejects incorrect passwords and accepts correct one", () => {
    expect(verifyAdminPassword("wrong-password", config)).toBe(false);
    expect(verifyAdminPassword(env.ADMIN_PASSWORD, config)).toBe(true);
  });
  it("rejects anonymous, tampered and expired sessions", () => {
    const token = mintAdminSession(config, now);
    expect(verifyAdminSession(token, config, now + 1000)).toBe(true);
    expect(verifyAdminSession(token + "tampered", config, now)).toBe(false);
    expect(verifyAdminSession(token, config, now + ADMIN_SESSION_TTL_MS + 1)).toBe(false);
    expect(isAdminAuthenticated("ocg_admin_session=" + token, {}, now)).toBe(false);
  });
  it("requires the correct cookie and uses secure browser flags", () => {
    const token = mintAdminSession(config, now);
    expect(isAdminAuthenticated("unrelated=" + token, env, now)).toBe(false);
    expect(isAdminAuthenticated("ocg_admin_session=" + token, env, now)).toBe(true);
    expect(adminSessionFromCookie("x=1; ocg_admin_session=" + token)).toBe(token);
    const cookie = adminSessionCookie(token);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
  });
});