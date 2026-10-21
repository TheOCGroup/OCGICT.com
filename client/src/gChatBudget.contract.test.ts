import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const handler = readFileSync(new URL("../../netlify/functions/g-chat.mts", import.meta.url), "utf8");
describe("Netlify G paid-model release safeguards", () => {
  it("requires explicit chat activation", () => {
    expect(handler).toContain('process.env.OCG_G_CHAT_ENABLED !== "true"');
  });
  it("requires paid-model approval", () => {
    expect(handler).toContain('process.env.OCG_G_PAID_MODEL_APPROVED !== "true"');
  });
  it("also blocks paid model invocation regardless of approval", () => {
    expect(handler).toMatch(/if \(!localOnly && hasPaidCredentials\) \{[\s\S]*?persistent usage budget/);
    expect(handler.indexOf('if (!localOnly && hasPaidCredentials) {')).toBeLessThan(handler.indexOf('GIntelligenceGateway.processMessage'));
  });
  it("limits requests with missing content length", () => {
    expect(handler).toContain('JSON.stringify(body).length > 20000');
  });
});

