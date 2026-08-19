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

const G_SYSTEM_INSTRUCTION = `You are G — the public-facing OCG concierge and real-estate intelligence guide for Ocasio Collective, LLC d/b/a The OC Group, operating publicly as OCG in Wichita, Kansas.

Your priorities are: understand the visitor, answer the immediate question, guide them through OCG, use the website as a canvas when a visual/tool is better than prose, and only then suggest a relevant next step. You are helpful first and never pushy.

OCG OPERATING PRINCIPLES:
1. OCG is a real-estate investment + acquisition company. OCG LAB is a secondary technology company in the same ecosystem; mention it only when relevant.
2. The 70% rule is a screening framework: MAO = (ARV × 70%) − Rehab. It is not a universal guarantee or binding offer rule.
3. For flips, OCG generally prefers appropriate lender capital for acquisition/renovation while preserving client liquidity as contingency reserves, lender strength, and project-completion capacity. Never say client cash is never used.
4. Wichita neighborhood knowledge can explain housing stock and investment considerations, but never invent current comps, sale prices, rents, tax facts, or market statistics. If live verified data is not supplied in context, say verification is still required.
5. Seller preliminary ranges are non-binding and depend on verified property evidence, current market evidence, condition, walkthrough/title review, and confidence gates.
6. Do not provide legal, tax, lending, appraisal, or other professional advice as certainty.
7. Match the visitor's sophistication. Explain jargon only when useful. Ask one useful question at a time.
8. Preserve conversational context and respond naturally when the visitor changes direction.
9. If a visitor is explicitly comparing multiple strategies or says they are unsure, preserve that ambiguity as Exploratory / Unsure until they make a choice or provide enough information to support one.

STYLE:
- concise, conversational, grounded, locally aware
- lightly witty only when natural
- never robotic, salesy, overly cute, or overconfident
- prefer showing a tool/section over writing a long explanation

TOOL USE:
Use website tools when the visitor asks to change calculator assumptions, view a property transformation, or begin seller review. Do not claim an action happened unless a tool call is actually emitted.`;

function contextMessage(context?: Record<string, any>): ModelMessage | null {
  if (!context || Object.keys(context).length === 0) return null;
  const safeContext = {
    route: context.route,
    section: context.section,
    selectedStrategy: context.selectedStrategy,
    selectedProperty: context.selectedProperty,
    calculator: context.calculator,
    sellerStep: context.sellerStep,
    visitorType: context.visitorType,
  };
  return {
    role: "system",
    content: `CURRENT WEBSITE CONTEXT (use only what is present; do not infer missing facts): ${JSON.stringify(safeContext)}`,
  };
}

export class GIntelligenceGateway {
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public static async processMessage(req: GChatRequest): Promise<GChatResponse> {
    const startTime = Date.now();
    const sessionId = req.sessionId || `sess_${Date.now()}`;

    this.checkRateLimit(sessionId);
    OcgObservability.log("G_SESSION_STARTED", { sessionId });

    const pageContext = contextMessage(req.clientContext);
    const messages: ModelMessage[] = [
      { role: "system", content: G_SYSTEM_INSTRUCTION },
      ...(pageContext ? [pageContext] : []),
      ...(req.history || []).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: req.message },
    ];

    const tools: ModelToolDefinition[] = [
      {
        name: "set_calculator_values",
        description: "Sets ARV and rehab in the 70% rule explorer when the visitor explicitly provides or changes those assumptions.",
        parameters: {
          type: "object",
          properties: { arv: { type: "number" }, rehab: { type: "number" } },
          required: ["arv", "rehab"],
        },
      },
      {
        name: "load_property_case",
        description: "Loads a clearly labeled conceptual Wichita transformation case study.",
        parameters: {
          type: "object",
          properties: { propertyId: { type: "string", enum: ["bungalow", "ranch", "delano"] } },
          required: ["propertyId"],
        },
      },
      {
        name: "activate_seller_intake",
        description: "Begins the seller property-review experience when the visitor indicates they own, inherited, manage, or need to sell a property.",
        parameters: {
          type: "object",
          properties: { sellerStep: { type: "number" } },
        },
      },
    ];

    const provider = getActiveModelProvider();
    const completion = await provider.generateCompletion({ messages, tools, temperature: 0.3 });

    let action: IGActionInvocation | undefined;
    if (completion.toolCalls?.length) {
      const call = completion.toolCalls[0];
      const actionId =
        call.name === "set_calculator_values"
          ? "SET_CALCULATOR_VALUES"
          : call.name === "load_property_case"
            ? "SELECT_PROPERTY_TRANSFORMATION"
            : "INITIATE_SELLER_MODE";

      const payload =
        call.name === "load_property_case"
          ? { propertyCaseId: call.arguments.propertyId }
          : call.name === "activate_seller_intake"
            ? { sellerStepIndex: call.arguments.sellerStep }
            : call.arguments;

      action = {
        actionId,
        payload,
        uiToastMessage: `G opened ${call.name.replace(/_/g, " ")}`,
        timestamp: new Date().toISOString(),
      };
      OcgObservability.log("TOOL_CALLED", { tool: call.name, args: call.arguments }, undefined, sessionId);
    }

    const brief = this.synthesizeStrategyBrief(req.message, req.clientContext, sessionId);
    if (brief) OcgObservability.log("STRATEGY_BRIEF_UPDATED", { briefId: brief.id }, undefined, sessionId);

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
    const investorIntent = /invest|flip|brrrr|buy.?and.?hold|capital|portfolio/.test(lower);
    const sellerIntent = /sell|inherited|probate|estate|landlord|property i own/.test(lower);

    if (sellerIntent && !investorIntent) return undefined;
    if (!investorIntent) return undefined;

    const liquidity = this.detectLiquidityTier(lower);
    if (!liquidity) return undefined;

    const now = new Date().toISOString();
    const mentionsFlip = lower.includes("flip");
    const mentionsBrrrr = lower.includes("brrrr");
    const mentionsHold = /buy.?and.?hold|rental|hold|portfolio/.test(lower);
    const explicitUncertainty = /not sure|unsure|undecided|deciding between|whether to|compare|versus|\bvs\b/.test(lower);
    const strategyCount = [mentionsFlip, mentionsBrrrr, mentionsHold].filter(Boolean).length;

    const primaryFit: IOCGStrategyBrief["strategyExploration"]["primaryFit"]["value"] =
      explicitUncertainty && strategyCount > 1
        ? "Exploratory / Unsure"
        : mentionsBrrrr
          ? "BRRRR"
          : mentionsHold
            ? "Buy & Hold"
            : mentionsFlip
              ? "Fix & Flip"
              : "Exploratory / Unsure";

    const beginnerCue = /first\s+(deal|flip|rental|investment|property)|beginner|new\s+to\s+(investing|real estate|flipping|brrrr)/.test(lower);
    const investorStage: IOCGStrategyBrief["clientContext"]["investorStage"]["value"] =
      beginnerCue ? "Beginner" : lower.includes("capital") ? "Capital Allocator" : "Active Operator";

    return {
      id: `brief_${Date.now()}`,
      version: "3.0.0",
      createdAt: now,
      updatedAt: now,
      provenance: { origin: "G_CONVERSATIONAL_INTAKE", sessionId },
      clientContext: {
        fullName: clientContext?.fullName,
        email: clientContext?.email,
        phone: clientContext?.phone,
        investorStage: {
          value: investorStage,
          certainty: "PROVISIONAL",
          source: "Explicit conversation cues; requires confirmation",
          retrievalTimestamp: now,
        },
        availableLiquidityTier: {
          value: liquidity,
          certainty: "PROVISIONAL",
          source: "Explicit liquidity amount stated by visitor",
          retrievalTimestamp: now,
        },
      },
      strategyExploration: {
        primaryFit: {
          value: primaryFit,
          certainty: "PROVISIONAL",
          source: "Visitor-stated strategy interest; not a recommendation",
          retrievalTimestamp: now,
        },
        timeline: {
          value: "Flexible",
          certainty: "PROVISIONAL",
          source: "Not yet confirmed in conversation",
          retrievalTimestamp: now,
        },
        riskTolerance: {
          value: "Balanced Growth",
          certainty: "PROVISIONAL",
          source: "Not yet confirmed in conversation",
          retrievalTimestamp: now,
        },
      },
      executiveIntelligence: {
        gConversationSummary: `Visitor discussed ${primaryFit} with an explicitly stated liquidity tier of ${liquidity}. This is an intake summary, not a recommendation.`,
        keyRiskConsiderations: [
          "Preserve sufficient contingency reserves and project-completion capacity.",
          "Verify property, market, rehab, financing, title, and exit assumptions before commitment.",
        ],
        unresolvedQuestions: [
          "Confirm timeline and desired level of involvement.",
          "Confirm property/market assumptions before underwriting a specific opportunity.",
        ],
        nextRecommendedHumanAction: "Continue the OCG strategy conversation once goals, timeline, and deal assumptions are confirmed.",
        disclaimerAcknowledged: true,
      },
      lifecycle: { status: "Persisted_Staging" },
    };
  }

  private static detectLiquidityTier(lower: string): IOCGStrategyBrief["clientContext"]["availableLiquidityTier"]["value"] | undefined {
    const matches = [...lower.matchAll(/\$?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+(?:\.[0-9]+)?)\s*(k|000)?/g)];
    if (!matches.length) return undefined;
    const match = matches[matches.length - 1];
    const base = Number(match[1].replace(/,/g, ""));
    const amount = match[2] ? base * 1000 : base;
    if (!Number.isFinite(amount) || amount < 10000) return undefined;
    if (amount < 25000) return "$10k-$25k";
    if (amount < 50000) return "$25k-$50k";
    if (amount < 100000) return "$50k-$100k";
    if (amount < 250000) return "$100k-$250k";
    return "$250k+";
  }

  private static checkRateLimit(sessionId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(sessionId);
    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(sessionId, { count: 1, resetTime: now + 60000 });
      return;
    }
    if (entry.count >= 30) throw new Error("Rate limit exceeded: G allows up to 30 requests per minute per session.");
    entry.count += 1;
  }
}
