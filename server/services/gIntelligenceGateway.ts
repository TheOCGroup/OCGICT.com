import { getActiveModelProvider, ModelMessage, ModelToolDefinition } from "./modelProvider";
import { OcgObservability } from "./observability";
import { IOCGStrategyBrief, IGActionInvocation } from "../../shared/contracts";

export interface GChatRequest {
  sessionId: string;
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  clientContext?: Record<string, any>;
}

export interface GChatResponse {
  sessionId: string;
  replyText: string;
  action?: IGActionInvocation;
  strategyBrief?: IOCGStrategyBrief;
  provider: string;
  model: string;
  latencyMs: number;
}

const G_SYSTEM_INSTRUCTION = `You are G — OCG's Investment Intelligence Core (Ocasio Capital Group, Wichita, Kansas).
You assist real estate investors and property sellers with disciplined underwriting, micro-market comps, architectural renovation design, and financing structures.

KEY OCG OPERATING PRINCIPLES:
1. Underwriting Discipline: MAO = (ARV × 70%) − Rehab Scope.
2. Capital Preservation: We structure senior lender debt for purchase and construction draws; liquid cash is preserved as contingency armor and lender reserves.
3. Wichita Housing Stock: Deep knowledge of College Hill, Crown Heights, Riverside, Delano, and South City.
4. Professional Boundary: You provide educational frameworks and property intelligence. You do not provide legal counsel, tax advice, or certified bank appraisals.

When users inquire about calculations, properties, selling, or booking, choose appropriate tool calls to control the website.`;

export class GIntelligenceGateway {
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public static async processMessage(req: GChatRequest): Promise<GChatResponse> {
    const startTime = Date.now();
    const sessionId = req.sessionId || `sess_${Date.now()}`;

    // 1. Rate Limiting Check (30 requests/minute per session)
    this.checkRateLimit(sessionId);
    OcgObservability.log("G_SESSION_STARTED", { sessionId });

    // 2. Prepare Context & Tool Schemas
    const messages: ModelMessage[] = [
      { role: "system", content: G_SYSTEM_INSTRUCTION },
      ...(req.history || []).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: req.message },
    ];

    const tools: ModelToolDefinition[] = [
      {
        name: "set_calculator_values",
        description: "Sets the After Repair Value and estimated rehab in the 70% MAO Explorer.",
        parameters: {
          type: "object",
          properties: {
            arv: { type: "number" },
            rehab: { type: "number" },
          },
          required: ["arv", "rehab"],
        },
      },
      {
        name: "load_property_case",
        description: "Loads a conceptual Wichita property transformation case study.",
        parameters: {
          type: "object",
          properties: {
            propertyId: { type: "string", enum: ["bungalow", "ranch"] },
          },
          required: ["propertyId"],
        },
      },
      {
        name: "activate_seller_intake",
        description: "Prepares seller mode for an owner or heir looking to sell a Wichita property.",
        parameters: {
          type: "object",
          properties: {
            sellerStep: { type: "number" },
          },
        },
      },
    ];

    // 3. Invoke Model Provider Layer
    const provider = getActiveModelProvider();
    const completion = await provider.generateCompletion({
      messages,
      tools,
      temperature: 0.35,
    });

    // 4. Resolve Tool Action (if any)
    let action: IGActionInvocation | undefined;
    if (completion.toolCalls && completion.toolCalls.length > 0) {
      const call = completion.toolCalls[0];
      action = {
        actionId: call.name === "set_calculator_values" ? "SET_CALCULATOR_VALUES" : call.name === "load_property_case" ? "SELECT_PROPERTY_TRANSFORMATION" : "INITIATE_SELLER_MODE",
        payload: call.arguments,
        uiToastMessage: `G triggered ${call.name.replace(/_/g, " ")}`,
        timestamp: new Date().toISOString(),
      };
      OcgObservability.log("TOOL_CALLED", { tool: call.name, args: call.arguments }, undefined, sessionId);
    }

    // 5. Synthesize Strategy Brief if context warrants
    const brief = this.synthesizeStrategyBrief(req.message, req.clientContext, sessionId);
    if (brief) {
      OcgObservability.log("STRATEGY_BRIEF_UPDATED", { briefId: brief.id }, undefined, sessionId);
    }

    return {
      sessionId,
      replyText: completion.content,
      action,
      strategyBrief: brief,
      provider: completion.provider,
      model: completion.model,
      latencyMs: Date.now() - startTime,
    };
  }

  private static synthesizeStrategyBrief(
    message: string,
    clientContext: Record<string, any> | undefined,
    sessionId: string
  ): IOCGStrategyBrief | undefined {
    const lower = message.toLowerCase();
    const isInvestor = lower.includes("invest") || lower.includes("flip") || lower.includes("brrrr") || lower.includes("capital") || lower.includes("50k");
    const isSeller = lower.includes("sell") || lower.includes("inherited") || lower.includes("probate") || lower.includes("estate");

    if (!isInvestor && !isSeller) return undefined;

    const now = new Date().toISOString();
    return {
      id: `brief_${Date.now()}`,
      version: "3.0.0",
      createdAt: now,
      updatedAt: now,
      provenance: {
        origin: "G_CONVERSATIONAL_INTAKE",
        sessionId,
      },
      clientContext: {
        fullName: clientContext?.fullName,
        email: clientContext?.email,
        phone: clientContext?.phone,
        investorStage: {
          value: isSeller ? "Seller / Disposing" : lower.includes("capital") ? "Capital Allocator" : "Active Operator",
          certainty: "PROVISIONAL",
          source: "G Conversational Intake Inference",
          retrievalTimestamp: now,
        },
        availableLiquidityTier: {
          value: lower.includes("100k") ? "$100k-$250k" : lower.includes("50k") ? "$50k-$100k" : "$25k-$50k",
          certainty: "PROVISIONAL",
          source: "G Conversational Intake Inference",
          retrievalTimestamp: now,
        },
        involvementPreference: "Hybrid Advisory",
      },
      strategyExploration: {
        primaryFit: {
          value: isSeller ? "Direct Sale / Liquidation" : lower.includes("brrrr") ? "BRRRR" : "Fix & Flip",
          certainty: "ESTIMATED",
          source: "OCG Strategy Matrix Matcher",
          retrievalTimestamp: now,
        },
        timeline: {
          value: isSeller ? "Immediate (0-30 Days)" : "30-90 Days",
          certainty: "PROVISIONAL",
          source: "G Intake Inference",
          retrievalTimestamp: now,
        },
        riskTolerance: {
          value: "Conservative (Preserve Capital First)",
          certainty: "ESTIMATED",
          source: "OCG Financing Doctrine",
          retrievalTimestamp: now,
        },
        modeledUnderwritingContext: {
          targetArv: 240000,
          estimatedRehabBudget: 45000,
          targetMaoCeiling: 123000,
          modeledGrossMargin: 72000,
          contingencyBuffer: 9000,
        },
      },
      executiveIntelligence: {
        gConversationSummary: `User engaged G on: "${message}". Strategy synthesized based on OCG capital preservation heuristics.`,
        keyRiskConsiderations: [
          "Preserve liquid capital reserves against contractor holding delays",
          "Ensure refinance DSCR debt service coverage exceeds 1.20x before closing",
        ],
        unresolvedQuestions: [
          "Detailed contractor scope walkthrough pending",
          "Final title and municipal lien clearance pending",
        ],
        nextRecommendedHumanAction: "Schedule Strategy Session with Genaro to review micro-neighborhood comps.",
        disclaimerAcknowledged: true,
      },
      lifecycle: {
        status: "Persisted_Staging",
      },
    };
  }

  private static checkRateLimit(sessionId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(sessionId);
    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(sessionId, { count: 1, resetTime: now + 60000 });
      return;
    }

    if (entry.count >= 30) {
      throw new Error("Rate limit exceeded: G allows up to 30 requests per minute per session.");
    }

    entry.count += 1;
  }
}
