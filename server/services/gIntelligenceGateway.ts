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

const G_SYSTEM_INSTRUCTION = `You are G — the public-facing real estate intelligence guide for OCG, the real estate investment, acquisition, renovation-strategy, and consulting brand of The OC Group in Wichita, Kansas.

Your job is to help property sellers and real estate investors think clearly and move to the correct next step. You are not a generic chatbot and you must never pretend to know facts or numbers that have not been supplied or verified.

OCG OPERATING PRINCIPLES:
1. Underwriting discipline: the 70% rule may be used as a conservative screening heuristic: heuristic MAO = (ARV × 70%) − estimated rehab. It is not a universal valuation rule, a guaranteed purchase price, or a substitute for a full deal model.
2. Full-deal economics matter: acquisition price, verified rehab scope, financing cost, holding period, taxes, insurance, utilities, transaction costs, selling costs, contingency, rent, refinance terms, and exit assumptions can materially change a decision.
3. Capital preservation: for appropriate renovation projects, OCG evaluates senior lender capital for acquisition and construction while preserving sufficient liquid reserves for contingencies, carry, and lender requirements. Never imply this structure is available or optimal without actual lender terms.
4. Hold strategy: DSCR must be calculated from actual or clearly labeled assumed rent and debt service. Do not state that a property qualifies for DSCR financing without real loan terms and the lender's underwriting standard.
5. Wichita context: you may discuss general characteristics of Wichita neighborhoods, but never claim a current comp, current market statistic, ownership fact, permit fact, tax fact, property condition, or live listing fact unless that data is explicitly provided by a trusted tool or in the conversation.
6. Seller experience: any website-generated seller number is preliminary and non-binding, subject to data verification, property walkthrough/condition verification, title review, and a separate written purchase agreement.
7. Professional boundary: provide educational frameworks and property intelligence, not legal counsel, tax advice, licensed appraisal, or guaranteed financing.

NUMBER INTEGRITY RULES:
- Never invent ARV, rehab, rent, purchase price, liquidity, interest rate, holding period, DSCR, cash-on-cash return, profit, or offer amounts.
- Clearly distinguish USER INPUT, ASSUMPTION, HEURISTIC, ESTIMATE, and VERIFIED DATA.
- If a calculation lacks required inputs, state what is missing and ask for the minimum necessary inputs.
- If you calculate from user-provided assumptions, show the formula briefly enough that the user can audit it.
- Do not describe an estimate as verified.

When users inquire about calculations, properties, selling, or website navigation, choose an appropriate website tool call only when the action matches what the user actually asked for.`;

function parseExplicitLiquidity(message: string): number | undefined {
  const lower = message.toLowerCase();
  const patterns = [
    /(?:have|capital|cash|liquidity|available|budget)\s*(?:of|is|:)?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\b/i,
    /\$\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\s*(?:in\s+)?(?:cash|capital|liquidity|available)?/i,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (!match) continue;
    let value = Number(match[1]);
    if (!Number.isFinite(value)) continue;
    if (match[2]?.toLowerCase() === "k") value *= 1_000;
    if (match[2]?.toLowerCase() === "m") value *= 1_000_000;
    if (value > 0) return value;
  }
  return undefined;
}

function liquidityTier(amount: number): IOCGStrategyBrief["clientContext"]["availableLiquidityTier"]["value"] {
  if (amount < 25_000) return "$10k-$25k";
  if (amount < 50_000) return "$25k-$50k";
  if (amount < 100_000) return "$50k-$100k";
  if (amount < 250_000) return "$100k-$250k";
  return "$250k+";
}

function parseLabeledMoney(message: string, label: "arv" | "rehab"): number | undefined {
  const expression = label === "arv"
    ? /\barv\b\s*(?:of|is|:|=)?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\b/i
    : /\b(?:rehab|repairs|renovation)\b\s*(?:budget|scope|cost|of|is|:|=)?\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m)?\b/i;
  const match = message.match(expression);
  if (!match) return undefined;
  let value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;
  if (match[2]?.toLowerCase() === "k") value *= 1_000;
  if (match[2]?.toLowerCase() === "m") value *= 1_000_000;
  return value > 0 ? value : undefined;
}

export class GIntelligenceGateway {
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public static async processMessage(req: GChatRequest): Promise<GChatResponse> {
    const startTime = Date.now();
    const sessionId = req.sessionId || `sess_${Date.now()}`;

    this.checkRateLimit(sessionId);
    OcgObservability.log("G_SESSION_STARTED", { sessionId });

    const messages: ModelMessage[] = [
      { role: "system", content: G_SYSTEM_INSTRUCTION },
      ...(req.history || []).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: req.message },
    ];

    const tools: ModelToolDefinition[] = [
      {
        name: "set_calculator_values",
        description: "Sets user-provided or explicitly assumed After Repair Value and estimated rehab in the 70% MAO Explorer. Never invent either value.",
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
        description: "Loads a clearly labeled conceptual Wichita property transformation case study, not a live property or current comp.",
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
        description: "Opens the seller property-review flow for an owner or heir looking to sell a Wichita property.",
        parameters: {
          type: "object",
          properties: {
            sellerStep: { type: "number" },
          },
        },
      },
    ];

    const provider = getActiveModelProvider();
    const completion = await provider.generateCompletion({
      messages,
      tools,
      temperature: 0.25,
    });

    let action: IGActionInvocation | undefined;
    if (completion.toolCalls && completion.toolCalls.length > 0) {
      const call = completion.toolCalls[0];
      action = {
        actionId: call.name === "set_calculator_values" ? "SET_CALCULATOR_VALUES" : call.name === "load_property_case" ? "SELECT_PROPERTY_TRANSFORMATION" : "INITIATE_SELLER_MODE",
        payload: call.arguments,
        uiToastMessage: call.name === "set_calculator_values"
          ? "G loaded your stated assumptions into the MAO explorer."
          : call.name === "load_property_case"
            ? "G opened a conceptual property case."
            : "G opened the seller property-review path.",
        timestamp: new Date().toISOString(),
      };
      OcgObservability.log("TOOL_CALLED", { tool: call.name, args: call.arguments }, undefined, sessionId);
    }

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
    const isInvestor = /\b(invest|investor|flip|brrrr|rental|buy\s*(?:&|and)?\s*hold|capital)\b/.test(lower);
    if (!isInvestor) return undefined;

    const explicitLiquidity = parseExplicitLiquidity(message);
    if (!explicitLiquidity) return undefined;

    const now = new Date().toISOString();
    const explicitArv = parseLabeledMoney(message, "arv");
    const explicitRehab = parseLabeledMoney(message, "rehab");
    const hasCompleteMaoInputs = explicitArv !== undefined && explicitRehab !== undefined;
    const heuristicMao = hasCompleteMaoInputs ? Math.max(0, explicitArv * 0.7 - explicitRehab) : undefined;

    const primaryFit: IOCGStrategyBrief["strategyExploration"]["primaryFit"]["value"] = lower.includes("brrrr")
      ? "BRRRR"
      : /buy\s*(?:&|and)?\s*hold|rental/.test(lower)
        ? "Buy & Hold"
        : lower.includes("flip")
          ? "Fix & Flip"
          : "Exploratory / Unsure";

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
          value: "Active Operator",
          certainty: "PROVISIONAL",
          source: "G conversational intake; stage not yet verified",
          retrievalTimestamp: now,
          verificationNotes: "Displayed as provisional until the investor confirms experience and operating stage.",
        },
        availableLiquidityTier: {
          value: liquidityTier(explicitLiquidity),
          certainty: "KNOWN",
          source: "User-stated liquidity in current conversation",
          retrievalTimestamp: now,
          verificationNotes: `Derived only from the user's stated amount of approximately $${Math.round(explicitLiquidity).toLocaleString()}.`,
        },
        involvementPreference: "Hybrid Advisory",
      },
      strategyExploration: {
        primaryFit: {
          value: primaryFit,
          certainty: primaryFit === "Exploratory / Unsure" ? "PROVISIONAL" : "KNOWN",
          source: primaryFit === "Exploratory / Unsure" ? "No explicit strategy selected" : "Strategy explicitly referenced by user",
          retrievalTimestamp: now,
        },
        timeline: {
          value: "Flexible",
          certainty: "PROVISIONAL",
          source: "Timeline not yet supplied",
          retrievalTimestamp: now,
          verificationNotes: "Flexible is a placeholder pending user confirmation, not an inferred deadline.",
        },
        riskTolerance: {
          value: "Conservative (Preserve Capital First)",
          certainty: "PROVISIONAL",
          source: "OCG default screening posture; user risk tolerance not yet supplied",
          retrievalTimestamp: now,
          verificationNotes: "This is OCG's initial risk posture, not a claim about the user's personal risk tolerance.",
        },
        modeledUnderwritingContext: hasCompleteMaoInputs
          ? {
              targetArv: explicitArv,
              estimatedRehabBudget: explicitRehab,
              targetMaoCeiling: heuristicMao,
            }
          : undefined,
      },
      executiveIntelligence: {
        gConversationSummary: `Investor engaged G with approximately $${Math.round(explicitLiquidity).toLocaleString()} of stated liquidity${primaryFit !== "Exploratory / Unsure" ? ` and referenced ${primaryFit}` : " without selecting a strategy yet"}.`,
        keyRiskConsiderations: [
          "Preserve adequate liquidity for contingency, carry, lender reserves, and unexpected project delays.",
          hasCompleteMaoInputs
            ? "The displayed 70% MAO is a screening heuristic only; a full deal model still needs financing, holding, transaction, and exit costs."
            : "ARV and rehab have not both been supplied, so no deal-level MAO should be inferred from this brief.",
        ],
        unresolvedQuestions: [
          "Confirm investment experience and desired level of involvement.",
          "Confirm timeline and personal risk tolerance.",
          ...(hasCompleteMaoInputs ? [] : ["Provide property-specific ARV and rehab assumptions before modeling a purchase ceiling."]),
        ],
        nextRecommendedHumanAction: primaryFit === "Exploratory / Unsure"
          ? "Clarify investment objective before recommending a strategy."
          : "Validate the strategy against a specific property and complete deal economics before making an acquisition decision.",
        disclaimerAcknowledged: false,
      },
      lifecycle: {
        status: "Draft",
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
