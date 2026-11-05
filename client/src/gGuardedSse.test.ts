import { describe, expect, it, vi } from "vitest";
vi.mock("../../server/services/gPlatform.js", () => ({ platformBudgetStore: vi.fn(async () => ({})) }));
vi.mock("../../server/services/gBudget.js", () => ({ consumeBudget: vi.fn(async () => ({ allowed: true })) }));
vi.mock("../../server/services/gRateLimit.js", () => ({ rateLimitActive: vi.fn(() => false), consumeRateLimit: vi.fn(), clientIdFromRequest: vi.fn() }));
vi.mock("../../server/services/gIntelligenceGateway.js", () => ({ GIntelligenceGateway: { processMessage: vi.fn() } }));
vi.mock("../../server/services/geminiStream.js", () => ({
  POC_CHAT_MODEL: "mock",
  streamGeminiTokens: vi.fn(async function* () { yield "RAW_PART_ONE"; yield "RAW_PART_TWO"; }),
}));
vi.mock("../../server/voice/sellerPolicy.js", () => ({
  analyzeSellerContext: vi.fn(() => ({ isSeller: true, primary: "neutral", stage: "welcome" })),
  guardSellerReply: vi.fn(() => "Approved answer."),
}));
vi.mock("../../server/services/streamingModelProvider.js", () => ({ looksSpanish: vi.fn(() => false) }));
import handler from "../../netlify/functions/g-chat.mts";

describe("G guarded SSE delivery", () => {
  it("sends only guarded text to client", async () => {
    const priorKey = process.env.GEMINI_API_KEY;
    const priorApproval = process.env.OCG_G_PAID_MODEL_APPROVED;
    try {
      process.env.GEMINI_API_KEY = "mock-key";
      process.env.OCG_G_PAID_MODEL_APPROVED = "true";
      const request = new Request("https://example.test/api/g/chat", {
        method: "POST",
        body: JSON.stringify({ message: "I want to sell my house", stream: true }),
      });
      const response = await handler(request, { deploy: { context: "production" } });
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("Approved answer.");
      expect(body).not.toContain("RAW_PART_ONE");
      expect(body).not.toContain("RAW_PART_TWO");
    } finally {
      if (priorKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = priorKey;
      if (priorApproval === undefined) delete process.env.OCG_G_PAID_MODEL_APPROVED;
      else process.env.OCG_G_PAID_MODEL_APPROVED = priorApproval;
    }
  });
});
