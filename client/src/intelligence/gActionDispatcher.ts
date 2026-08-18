import { IGActionInvocation, IOCGStrategyBrief } from "../../../shared/contracts";
import { queryOcgKnowledge } from "./ocgKnowledge";
import { queryWichitaNeighborhood } from "./wichitaMarketIntelligence";

export interface GEngineResponse {
  messageText: string;
  action?: IGActionInvocation;
  generatedBrief?: IOCGStrategyBrief;
}

/**
 * G Intelligence Reasoning & Action Engine (Local Fallback & Deterministic Matcher)
 * Analyzes conversational input, retrieves verified OCG frameworks and Wichita submarket intelligence,
 * and generates structured website actions / strategy dossiers.
 */
export function processGDialogue(
  userInput: string,
  currentHistory: Array<{ sender: "g" | "user"; text: string }>
): GEngineResponse {
  const query = userInput.trim();
  const lower = query.toLowerCase();
  const now = new Date().toISOString();

  // 1. Check for Wichita Neighborhood Query
  const neighborhoodMatch = queryWichitaNeighborhood(lower);
  if (neighborhoodMatch) {
    const isCollegeHill = neighborhoodMatch.id === "college-hill";
    const isCrownHeights = neighborhoodMatch.id === "crown-heights";
    const isDelano = neighborhoodMatch.id === "delano";

    let action: IGActionInvocation | undefined = undefined;
    if (isCollegeHill) {
      action = {
        actionId: "SELECT_PROPERTY_TRANSFORMATION",
        payload: { propertyCaseId: "bungalow" },
        uiToastMessage: "Loaded College Hill Craftsman Architectural Case Study",
        timestamp: now,
      };
    } else if (isCrownHeights) {
      action = {
        actionId: "SELECT_PROPERTY_TRANSFORMATION",
        payload: { propertyCaseId: "ranch" },
        uiToastMessage: "Loaded Crown Heights Mid-Century Brick Ranch Case Study",
        timestamp: now,
      };
    } else if (isDelano) {
      action = {
        actionId: "SELECT_PROPERTY_TRANSFORMATION",
        payload: { propertyCaseId: "delano" as any },
        uiToastMessage: "Loaded Historic Delano Worker Cottage Case Study",
        timestamp: now,
      };
    }

    const reply = `**${neighborhoodMatch.name} (${neighborhoodMatch.quadrant} Wichita)**:
• **Architectural Archetype**: ${neighborhoodMatch.architecturalStyle}
• **Typical Price Band**: ${neighborhoodMatch.medianPriceRange} (Ceiling: ${neighborhoodMatch.renovationCapCeiling})
• **Strategic Scope**: ${neighborhoodMatch.typicalScopeProfile}
• **Target Demographic**: ${neighborhoodMatch.targetBuyerDemographic}
• **Market Dynamics**: ${neighborhoodMatch.neighborhoodInsights}

${isCollegeHill || isCrownHeights || isDelano ? "I have also activated the interactive Before/After architectural transformation model above for you to inspect." : ""}`;

    return {
      messageText: reply,
      action,
    };
  }

  // 2. Check for 70% Rule / Underwriting Calculation Request
  if (lower.includes("70%") || lower.includes("calculate") || lower.includes("mao") || lower.includes("underwrite") || lower.includes("math")) {
    let arv = 240000;
    let rehab = 45000;

    if (lower.includes("300k") || lower.includes("300,000")) arv = 300000;
    else if (lower.includes("200k") || lower.includes("200,000")) arv = 200000;
    else if (lower.includes("150k") || lower.includes("150,000")) arv = 150000;

    const mao = (arv * 0.70) - rehab;

    return {
      messageText: `The 70% Rule establishes your acquisition ceiling: **MAO = (ARV × 70%) − Rehab Scope**.

On a modeled **$${arv.toLocaleString()} ARV** with an estimated **$${rehab.toLocaleString()} renovation scope**:
• **Gross Margin Buffer (30%)**: $${(arv * 0.30).toLocaleString()} (protects holding interest, closing costs, and investor margin)
• **Maximum Allowable Offer (MAO)**: **$${mao.toLocaleString()}**

I have adjusted the interactive **70% Rule & MAO Explorer** on this page with these parameters so you can stress-test different purchase prices and holding buffers.`,
      action: {
        actionId: "SET_CALCULATOR_VALUES",
        payload: { arv, rehab },
        uiToastMessage: `Updated 70% MAO Explorer to ARV $${arv.toLocaleString()} / Rehab $${rehab.toLocaleString()}`,
        timestamp: now,
      },
    };
  }

  // 3. Check for Capital Allocation / Liquidity Question
  if (lower.includes("50k") || lower.includes("100k") || lower.includes("capital") || lower.includes("liquidity") || lower.includes("preserve") || lower.includes("cash")) {
    const brief: IOCGStrategyBrief = {
      id: `brief_${Date.now()}`,
      version: "3.0.0",
      createdAt: now,
      updatedAt: now,
      provenance: {
        origin: "G_CONVERSATIONAL_INTAKE",
        sessionId: "local_sess",
      },
      clientContext: {
        investorStage: {
          value: "Capital Allocator",
          certainty: "PROVISIONAL",
          source: "G Local Inference",
          retrievalTimestamp: now,
        },
        availableLiquidityTier: {
          value: lower.includes("100k") ? "$100k-$250k" : "$50k-$100k",
          certainty: "PROVISIONAL",
          source: "G Local Inference",
          retrievalTimestamp: now,
        },
        involvementPreference: "Hybrid Advisory",
      },
      strategyExploration: {
        primaryFit: {
          value: "Fix & Flip",
          certainty: "ESTIMATED",
          source: "OCG Strategy Matrix",
          retrievalTimestamp: now,
        },
        timeline: {
          value: "30-90 Days",
          certainty: "PROVISIONAL",
          source: "G Local Inference",
          retrievalTimestamp: now,
        },
        riskTolerance: {
          value: "Conservative (Preserve Capital First)",
          certainty: "ESTIMATED",
          source: "OCG Financing Doctrine",
          retrievalTimestamp: now,
        },
      },
      executiveIntelligence: {
        gConversationSummary: "Investor seeking to deploy capital safely without draining liquid cash. OCG recommended senior debt for acquisition/construction while holding liquid reserves as contingency defense.",
        keyRiskConsiderations: ["Preserve personal liquidity buffer against holding/material cost shifts."],
        unresolvedQuestions: ["Contractor physical scope verification required."],
        nextRecommendedHumanAction: "Schedule Strategy Session with Genaro.",
        disclaimerAcknowledged: true,
      },
      lifecycle: {
        status: "Persisted_Staging",
      },
    };

    return {
      messageText: `A common misstep is deploying all available cash into property acquisition.

**OCG's Financing Philosophy**:
1. **Senior Lender Debt**: For Fix & Flip projects, we structure lender capital to finance purchase and 100% of renovation draws whenever viable.
2. **The Liquidity Shield**: Your liquid reserves serve as strategic defense against unforeseen material cost shifts or permit extensions.
3. **Lender Confidence**: Lenders require 6-12 months of interest reserves. Retaining your cash ensures favorable loan terms and allows scaling into multiple opportunities.

I have assembled this into your **Structured Strategy Brief** on the right.`,
      generatedBrief: brief,
      action: {
        actionId: "UPDATE_STRATEGY_BRIEF",
        payload: { briefUpdates: brief },
        uiToastMessage: "Generated Structured Investor Strategy Brief",
        timestamp: now,
      },
    };
  }

  // 4. Check for Seller / Inherited / Estate Inquiry
  if (lower.includes("sell") || lower.includes("inherited") || lower.includes("probate") || lower.includes("estate") || lower.includes("repairs") || lower.includes("house")) {
    const sellerBrief: IOCGStrategyBrief = {
      id: `brief_${Date.now()}`,
      version: "3.0.0",
      createdAt: now,
      updatedAt: now,
      provenance: {
        origin: "G_CONVERSATIONAL_INTAKE",
        sessionId: "local_sess",
      },
      clientContext: {
        investorStage: {
          value: "Seller / Disposing",
          certainty: "PROVISIONAL",
          source: "G Local Inference",
          retrievalTimestamp: now,
        },
        availableLiquidityTier: {
          value: "Equity / Real Estate Only",
          certainty: "PROVISIONAL",
          source: "G Local Inference",
          retrievalTimestamp: now,
        },
        involvementPreference: "Passive Capital Partner",
      },
      strategyExploration: {
        primaryFit: {
          value: "Direct Sale / Liquidation",
          certainty: "ESTIMATED",
          source: "OCG Strategy Matrix",
          retrievalTimestamp: now,
        },
        timeline: {
          value: "Immediate (0-30 Days)",
          certainty: "PROVISIONAL",
          source: "G Local Inference",
          retrievalTimestamp: now,
        },
        riskTolerance: {
          value: "Conservative (Preserve Capital First)",
          certainty: "ESTIMATED",
          source: "OCG Financing Doctrine",
          retrievalTimestamp: now,
        },
      },
      executiveIntelligence: {
        gConversationSummary: "Homeowner or estate heir seeking transparent preliminary review of Wichita property condition without high-pressure wholesaler tactics.",
        keyRiskConsiderations: ["Heir consensus and estate probate timeline."],
        unresolvedQuestions: ["On-site condition walkthrough pending."],
        nextRecommendedHumanAction: "Schedule Property Consultation with Genaro.",
        disclaimerAcknowledged: true,
      },
      lifecycle: {
        status: "Persisted_Staging",
      },
    };

    return {
      messageText: `Inherited properties and estate transitions in Wichita deserve a transparent, respectful review.

**How OCG Evaluates Off-Market Properties**:
• **Objective Preliminary Assessment**: We review Sedgwick County parcel records, historical sales, and structural condition without high-pressure games.
• **Flexible Terms**: You select the closing timeline, leave unwanted items behind, and pay zero wholesaler commissions or assignment fees.
• **Direct Execution**: If we extend an offer, it is backed by verified acquisition capital.

I have prepared a preliminary intake brief. You can review the 4-step seller advisory process or book a direct consultation with Genaro.`,
      generatedBrief: sellerBrief,
      action: {
        actionId: "INITIATE_SELLER_MODE",
        payload: { sellerStepIndex: 1 },
        uiToastMessage: "Prepared Seller Advisory Dossier",
        timestamp: now,
      },
    };
  }

  // 5. General Knowledge Fallback
  const knowledgeMatch = queryOcgKnowledge(lower);
  if (knowledgeMatch) {
    return {
      messageText: `**${knowledgeMatch.title}**:

${knowledgeMatch.detailedFramework}

*Next Step*: ${knowledgeMatch.actionRecommendation || "Consult with OCG team."}`
    };
  }

  // 6. Context-Aware Default Response
  return {
    messageText: `OCG operates with disciplined underwriting, micro-market comps in Wichita, and strategic renovation design. 

Whether you are evaluating a **Fix & Flip**, scaling a **BRRRR rental portfolio**, exploring the **70% Rule**, or need an objective review of a **Wichita property to sell**, tell me your primary objective and I will configure the tools and prepare your strategy dossier.`
  };
}
