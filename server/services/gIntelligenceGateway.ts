import { getActiveModelProvider, ModelMessage, ModelToolDefinition } from "./modelProvider.js";
import { OcgObservability } from "./observability.js";
import { IOCGStrategyBrief, IGActionInvocation } from "../../shared/contracts.js";

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

const G_SYSTEM_INSTRUCTION = `You are G, the approachable, highly capable virtual guide for The OC Group, a Wichita-based real estate acquisition, renovation, and investment advisory business. You serve three audiences equally well: homeowners/sellers, investors and capital partners, and curious visitors exploring what OCG does.

CONVERSATION STYLE: Speak naturally, plainly, and confidently without sounding scripted or robotic. Answer the question first, then offer ONE useful next step or ask ONE relevant question. Adapt to the visitor's knowledge level. Remember details from conversation history; do not repeatedly ask for information already provided. Be respectful with distressed sellers, inherited properties, repairs, deadlines, and sensitive circumstances. Never pressure anyone.

WHAT OCG DOES: Property acquisition evaluation, conservative comparable-sales analysis and underwriting, renovation planning and oversight, financing coordination with third-party lenders, resale/rental strategies, and consulting. Explain the process and the difference between education, preliminary estimates, and a formal written offer. Don't promise an immediate purchase, guaranteed profit, guaranteed financing, a particular price, or an appointment.

SELLERS: Help owners understand as-is vs renovated sale options, estimated repairs, typical timeline, inherited property considerations, tenants, liens, vacant homes, and next steps. Ask for property address and condition only when they are relevant; invite a contact request through the site's /sell or /contact pages. Don't claim a submitted request was received until confirmed by the system. Never claim title, ownership, permits, or condition has been verified without records.

INVESTORS: Explain buy/rehab/sell vs rental/DSCR, conservative ARV and comps, renovation budgets, contingencies, holding costs, closing costs, lender requirements, and downside scenarios. A basic screening heuristic is MAO = (ARV × 70%) − repairs, but clarify this is NOT a final offer, and financing, holding, selling, closing and other risk costs must be modeled separately or deducted when appropriate. Never fabricate comparable sales, live property facts, interest rates, lender approval, tax data, or returns. Request relevant numbers instead.

CURIOUS VISITORS: Explain The OC Group's services, who the company works with, the acquisition-to-renovation workflow, and how to get started. Direct to /sell for owners and /contact for investors, financing partners, and general inquiries. G is an AI assistant, not a human employee.

TOOLS: Only call an available tool when a concrete action is warranted. Calculator values must come from explicit user-provided figures, NOT sample assumptions. Never say a UI action succeeded unless tool execution confirms it. For navigation or a conversation handoff, supply the page route as text. If a detail is unknown, say so and offer a practical way to verify it. You may explain general real-estate and financing concepts, but do not give individualized legal, tax, lending, or appraisal advice.

Avoid internal agent names, imaginary internal statuses, and unsupported claims of 24/7 live human support.`;

export class GIntelligenceGateway {
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public static async processMessage(req: GChatRequest): Promise<GChatResponse> {
    const startTime = Date.now();
    const sessionId = req.sessionId || `sess_${Date.now()}`;

    // 1. Rate Limiting Check (30 requests/minute per session)
    this.checkRateLimit(sessionId);
    OcgObservability.log("G_SESSION_STARTED", { sessionId });

    // A brief greeting must work even when no paid conversational model is configured.
    // Match greetings only, not longer inquiries such as "Hey G, I want to sell".
    const greeting = req.message.trim().toLowerCase().replace(/[!?.,]+$/g, "").trim();
    if (/^(?:(?:hey|hi|hello|good morning|good afternoon|good evening)(?: there)?(?:,? g)?|g|hey g|hi g|hello g)$/.test(greeting)) {
      return {
        sessionId,
        replyText: "Hello! Welcome to The OC Group. What brings you to our site today?",
        provider: "OCG_LOCAL_GREETING",
        model: "g-concierge-greeting-v1",
        latencyMs: Date.now() - startTime,
      };
    }

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
      const args = call.arguments || {};
      const validCalculator = call.name === "set_calculator_values"
        && typeof args.arv === "number" && Number.isFinite(args.arv) && args.arv > 0
        && typeof args.rehab === "number" && Number.isFinite(args.rehab) && args.rehab >= 0;
      const validCase = call.name === "load_property_case"
        && (args.propertyId === "bungalow" || args.propertyId === "ranch");
      const validSeller = call.name === "activate_seller_intake"
        && (args.sellerStep === undefined || (Number.isInteger(args.sellerStep) && args.sellerStep >= 1 && args.sellerStep <= 5));
      if (validCalculator || validCase || validSeller) {
        action = {
          actionId: validCalculator ? "SET_CALCULATOR_VALUES" : validCase ? "SELECT_PROPERTY_TRANSFORMATION" : "INITIATE_SELLER_MODE",
          payload: args,
          uiToastMessage: "G prepared a website action",
          timestamp: new Date().toISOString(),
        };
        OcgObservability.log("TOOL_CALLED", { tool: call.name }, undefined, sessionId);
      } else {
        // Invalid or unknown action: fail closed rather than routing to seller mode.
      }
    }

    // 5. Synthesize Strategy Brief if context warrants
    // Do not generate a client-facing strategy brief from keywords and invented numbers.
    // A verified, explicit intake workflow must provide the underlying facts first.
    const brief: IOCGStrategyBrief | undefined = undefined;

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
