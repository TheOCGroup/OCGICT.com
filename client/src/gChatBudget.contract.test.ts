import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const handler = readFileSync(new URL("../../netlify/functions/g-chat.mts", import.meta.url), "utf8");
describe("Netlify G paid-model release safeguards", () => {
  it("requires explicit chat activation outside hosted contexts", () => {
    expect(handler).toContain('process.env.OCG_G_CHAT_ENABLED !== "true"');
    expect(handler).toContain("hostedContext");
  });
  it("requires paid-model approval", () => {
    expect(handler).toContain('process.env.OCG_G_PAID_MODEL_APPROVED === "true"');
  });
  it("gates paid model invocation behind the persistent budget meter", () => {
    expect(handler).toContain('consumeBudget(store, "chat", process.env)');
    expect(handler.indexOf("consumeBudget")).toBeLessThan(handler.indexOf("GIntelligenceGateway.processMessage"));
    expect(handler).toContain("budgetFallback");
  });
  it("never lets approval alone enable spend when the meter fails", () => {
    expect(handler).toMatch(/catch \{\s*\/\/ Meter unavailable: fail closed/);
  });
  it("limits requests with missing content length", () => {
    expect(handler).toContain('JSON.stringify(body).length > 20000');
  });
  it("never exposes raw model deltas before the seller guard", () => {
    const streamBranch = handler.slice(handler.indexOf('if (body.stream === true && !localOnly)'));
    const guarded = streamBranch.indexOf('const safeReply = guardSellerReply(full, sctx)');
    const sent = streamBranch.indexOf('controller.enqueue(sse({ t: safeReply }))');
    expect(guarded).toBeGreaterThan(0);
    expect(sent).toBeGreaterThan(guarded);
    expect(streamBranch).not.toContain('controller.enqueue(sse({ t: delta }))');
    expect(streamBranch).toContain('replyText: safeReply');
  });
});
