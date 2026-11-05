import { describe, expect, it, vi } from "vitest";
import { streamGeminiTokens } from "../../server/services/geminiStream.js";
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

async function invoke() {
  const request = new Request("https://example.test/api/g/chat", {
    method: "POST",
    body: JSON.stringify({ message: "I want to sell my house", stream: true }),
  });
  return handler(request, { deploy: { context: "production" } });
}
describe("G guarded SSE delivery", () => {
  it("sends only guarded text to client", async () => {
    const priorKey = process.env.GEMINI_API_KEY;
    const priorApproval = process.env.OCG_G_PAID_MODEL_APPROVED;
    try {
      process.env.GEMINI_API_KEY = "mock-key";
      process.env.OCG_G_PAID_MODEL_APPROVED = "true";
      const response = await invoke();
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
  it("handles an empty provider stream without leaking or fabricating raw text", async () => {
    const priorKey = process.env.GEMINI_API_KEY;
    const priorApproval = process.env.OCG_G_PAID_MODEL_APPROVED;
    try {
      process.env.GEMINI_API_KEY = "mock-key";
      process.env.OCG_G_PAID_MODEL_APPROVED = "true";
      vi.mocked(streamGeminiTokens).mockImplementation(async function* () {});
      const response = await invoke();
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain("Approved answer.");
      expect(body).not.toContain("RAW_");
    } finally {
      vi.mocked(streamGeminiTokens).mockImplementation(async function* () {
        yield "RAW_PART_ONE";
        yield "RAW_PART_TWO";
      });
      if (priorKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = priorKey;
      if (priorApproval === undefined) delete process.env.OCG_G_PAID_MODEL_APPROVED;
      else process.env.OCG_G_PAID_MODEL_APPROVED = priorApproval;
    }
  });
  it("fails closed when the provider throws before a guarded answer exists", async () => {
    const priorKey = process.env.GEMINI_API_KEY;
    const priorApproval = process.env.OCG_G_PAID_MODEL_APPROVED;
    try {
      process.env.GEMINI_API_KEY = "mock-key";
      process.env.OCG_G_PAID_MODEL_APPROVED = "true";
      vi.mocked(streamGeminiTokens).mockImplementation(async function* () {
        yield "RAW_BEFORE_FAILURE";
        throw new Error("mock provider failure");
      });
      const response = await invoke();
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).toContain("stream_failed");
      expect(body).not.toContain("RAW_BEFORE_FAILURE");
      expect(body).not.toContain("Approved answer.");
    } finally {
      vi.mocked(streamGeminiTokens).mockImplementation(async function* () {
        yield "RAW_PART_ONE";
        yield "RAW_PART_TWO";
      });
      if (priorKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = priorKey;
      if (priorApproval === undefined) delete process.env.OCG_G_PAID_MODEL_APPROVED;
      else process.env.OCG_G_PAID_MODEL_APPROVED = priorApproval;
    }
  });
});
