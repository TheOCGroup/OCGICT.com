import { IGActionInvocation, IOCGStrategyBrief } from "../../../shared/contracts";
import { queryOcgKnowledge } from "./ocgKnowledge";
import { queryWichitaNeighborhood } from "./wichitaMarketIntelligence";

export interface GEngineResponse {
  messageText: string;
  action?: IGActionInvocation;
  generatedBrief?: IOCGStrategyBrief;
}

/**
 * G Intelligence Reasoning & Action Engine (Phase V Production Core)
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
        payload: { propertyCaseId: "delano" },
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

${isCollegeHill || isCrownHeights || isDelano ? "I have also activated the interactive Before/After architectural transformation model on the page for you to inspect." : ""}`;

    return {
      messageText: reply,
      action,
    };
  }

  // 2. Check for 70% Rule / Underwriting Calculation Request with Dynamic Number Parsing
  if (lower.includes("70%") || lower.includes("calculate") || lower.includes("mao") || lower.includes("underwrite") || lower.includes("repairs") || (lower.includes("arv") && lower.includes("property"))) {
    let arv = 240000;
    let rehab = 45000;

    // Dynamic number extraction for ARV
    const arvMatch = lower.match(/(?:\$|arv\s*of\s*|\b)(\d{2,3}(?:,\d{3})|\d{2,3}k|\d{5,6})\s*(?:k|arv|\$|\b)/i) || lower.match(/\$(\d+[\d,]*)/);
    if (lower.includes("300k") || lower.includes("300,000") || lower.includes("300000")) arv = 300000;
    else if (lower.includes("250k") || lower.includes("250,000") || lower.includes("250000")) arv = 250000;
    else if (lower.includes("200k") || lower.includes("200,000") || lower.includes("200000")) arv = 200000;
    else if (lower.includes("150k") || lower.includes("150,000") || lower.includes("150000")) arv = 150000;

    // Dynamic number extraction for Rehab
    if (lower.includes("55k") || lower.includes("55,000") || lower.includes("55000")) rehab = 55000;
    else if (lower.includes("50k") || lower.includes("50,000") || lower.includes("50000")) rehab = 50000;
    else if (lower.includes("40k") || lower.includes("40,000") || lower.includes("40000")) rehab = 40000;
    else if (lower.includes("30k") || lower.includes("30,000") || lower.includes("30000")) rehab = 30000;

    const seventyPercent = Math.round(arv * 0.70);
    const mao = seventyPercent - rehab;

    return {
      messageText: `The 70% Rule is an underwriting discipline to establish your acquisition ceiling: **MAO = (ARV × 70%) − Estimated Renovation**.

On a modeled **$${arv.toLocaleString()} ARV** with an estimated **$${rehab.toLocaleString()} repair scope**:
• **70% Base Ceiling**: $${seventyPercent.toLocaleString()}
• **Less Repair Scope**: −$${rehab.toLocaleString()}
• **Maximum Allowable Offer (MAO)**: **$${mao.toLocaleString()}**
• **Gross Margin Buffer (30% / $${(arv * 0.30).toLocaleString()})**: Safeguards holding interest, transaction closing costs, and investor gross margin.

*Important*: The 70% rule is a risk-mitigation framework rather than a guaranteed purchase formula. I have updated the interactive **70% Rule & MAO Explorer** on this page with these figures.`,
      action: {
        actionId: "SET_CALCULATOR_VALUES",
        payload: { arv, rehab },
        uiToastMessage: `Updated 70% MAO Explorer to ARV $${arv.toLocaleString()} / Rehab $${rehab.toLocaleString()} (MAO: $${mao.toLocaleString()})`,
        timestamp: now,
      },
    };
  }

  // 3. Check for Cash Deployment vs. Financing Question ("Why wouldn't I just put all my cash into the flip?")
  if (lower.includes("all my cash") || lower.includes("why wouldn't i") || lower.includes("why not put all") || lower.includes("put all cash") || lower.includes("all cash into")) {
    return {
      messageText: `A fundamental pillar of OCG's financing philosophy is: **Preserve liquid cash as strategic armor.**

Here is why deploying 100% of your personal cash into a single flip increases downside risk:
1. **Contingency Protection**: Unforeseen structural repairs, city permit extensions, or material supply delays require liquid reserves. Running low on liquidity mid-project can stall contractor progress.
2. **Senior Lender Leverage**: For qualified acquisitions, we explore structuring senior lender capital for purchase and up to 100% of construction draws.
3. **Lender Reserves & Strength**: Institutional lenders require 6–12 months of interest reserves. Retaining your cash satisfies liquidity requirements and allows you to participate in multiple concurrent opportunities.
4. **Balanced Capital**: While client capital (skin-in-the-game) is still required or strategically deployed for equity buffers, draining personal liquidity to zero removes your margin of safety.`
    };
  }

  // 4. Check for DSCR Rental Inquiries ("I want to buy a rental using DSCR")
  if (lower.includes("dscr") || lower.includes("debt service") || (lower.includes("rental") && lower.includes("loan"))) {
    return {
      messageText: `**DSCR (Debt Service Coverage Ratio) Loans** evaluate the cash-flow viability of the property rather than your personal W-2 income.

**Key DSCR Underwriting Mechanics**:
• **Coverage Formula**: DSCR = Projected Net Monthly Rent ÷ Total Monthly PITI (Principal, Interest, Taxes, Insurance).
• **Target Threshold**: Lenders typically require a minimum **1.20x to 1.25x** coverage ratio to approve the loan.
• **Capital Profile**: Unlike short-term Fix & Flip bridge loans (which finance construction draws), DSCR permanent financing requires a **20%–25% equity down payment** plus 3–6 months of verified PITI reserves.
• **Wichita Advantage**: Because Wichita has favorable rent-to-price ratios in corridors like Crown Heights, Delano, and South City, well-renovated single-family and duplex properties frequently exceed 1.25x DSCR requirements.

Let's look at your target neighborhood and rental projections.`
    };
  }

  // 5. Check for Beginner / Open Investor Qualification ($60k inquiry)
  if (lower.includes("60,000") || lower.includes("60k") || (lower.includes("have $") && lower.includes("not sure")) || lower.includes("get into real estate")) {
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
          value: "Beginner",
          certainty: "PROVISIONAL",
          source: "G Conversational Intake Inference",
          retrievalTimestamp: now,
        },
        availableLiquidityTier: {
          value: "$50k-$100k",
          certainty: "PROVISIONAL",
          source: "G Conversational Intake Inference",
          retrievalTimestamp: now,
        },
        involvementPreference: "Hybrid Advisory",
      },
      strategyExploration: {
        primaryFit: {
          value: "Exploratory / Unsure",
          certainty: "PROVISIONAL",
          source: "G Intake Inference (Multiple Strategic Fits)",
          retrievalTimestamp: now,
        },
        secondaryFit: "BRRRR or Fix & Flip with Senior Leverage",
        timeline: {
          value: "30-90 Days",
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
          targetArv: 220000,
          estimatedRehabBudget: 38000,
          targetMaoCeiling: 116000,
          modeledGrossMargin: 66000,
          contingencyBuffer: 8000,
        },
      },
      executiveIntelligence: {
        gConversationSummary: "Investor has $60,000 in capital looking to enter real estate. G emphasized not exhausting all $60k in a single deal, and outlined BRRRR equity recycling vs. leveraged flip.",
        keyRiskConsiderations: [
          "Retain at least $15k-$20k in cash reserves rather than deploying the full $60k.",
          "Match project timeline with personal active vs passive capacity."
        ],
        unresolvedQuestions: [
          "Determine whether investor prefers active project involvement or turnkey equity partnership.",
          "Verify target Wichita submarket preference (historic core vs suburban rental)."
        ],
        nextRecommendedHumanAction: "Schedule Strategy Session with Genaro to review tailored deal structures.",
        disclaimerAcknowledged: true,
      },
      lifecycle: {
        status: "Persisted_Staging",
      },
    };

    return {
      messageText: `Having **$60,000** in available liquidity puts you in a strong position in the Wichita market, but **you should not deploy all $60,000 into your first project**.

Here is how OCG evaluates your options:
1. **Fix & Flip with Senior Debt**: Deploy ~$35k–$40k for loan down payment, closing costs, and initial contractor draw, while retaining $20k+ as your liquid reserve defense.
2. **BRRRR Strategy**: Acquire an undervalued property, renovate for value-add, lease, and refinance into long-term DSCR debt to recycle your initial equity into the next asset.
3. **Passive Capital Allocation**: Partner on pre-underwritten OCG deals without managing daily job site construction.

I have initiated a **Structured Strategy Brief** on the right. When you are ready, we can schedule an introductory strategy session with Genaro to review Wichita deal scenarios.`,
      generatedBrief: brief,
      action: {
        actionId: "UPDATE_STRATEGY_BRIEF",
        payload: { briefUpdates: brief },
        uiToastMessage: "Initiated Investor Strategy Brief ($60k Liquidity Tier)",
        timestamp: now,
      },
    };
  }

  // 6. Check for Seller / Estate / Inherited House ("My mother passed away and I need to sell her house")
  if (lower.includes("passed away") || lower.includes("mother") || lower.includes("inherited") || lower.includes("probate") || lower.includes("estate") || lower.includes("sell her house") || lower.includes("sell house")) {
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
          source: "G Conversational Intake Inference",
          retrievalTimestamp: now,
        },
        availableLiquidityTier: {
          value: "Equity / Real Estate Only",
          certainty: "PROVISIONAL",
          source: "G Conversational Intake Inference",
          retrievalTimestamp: now,
        },
        involvementPreference: "Passive Capital Partner",
      },
      strategyExploration: {
        primaryFit: {
          value: "Direct Sale / Liquidation",
          certainty: "ESTIMATED",
          source: "OCG Seller Advisory Protocol",
          retrievalTimestamp: now,
        },
        timeline: {
          value: "Immediate (0-30 Days)",
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
      },
      executiveIntelligence: {
        gConversationSummary: "Family navigating an estate property transition in Wichita. G provided compassionate advisory, outlining direct acquisition, zero commissions, and flexible closing timelines without high-pressure games.",
        keyRiskConsiderations: ["Probate / title authorization status.", "Physical deferred maintenance evaluation."],
        unresolvedQuestions: ["On-site condition walkthrough pending.", "Heir timeline requirements."],
        nextRecommendedHumanAction: "Schedule a respectful property consultation with Genaro.",
        disclaimerAcknowledged: true,
      },
      lifecycle: {
        status: "Persisted_Staging",
      },
    };

    return {
      messageText: `First, please accept my condolences. Navigating an inherited estate is emotional and logistically demanding, especially when managing property repairs and cleanout from a distance.

**How OCG Assists Families with Inherited Wichita Properties**:
• **Respectful & Transparent Assessment**: We evaluate Sedgwick County public records, condition, and fair value directly—without aggressive wholesaler pressure.
• **As-Is Sale**: You do not need to make repairs, paint, clean out personal items, or stage the property. Take what matters to your family, and leave the rest to us.
• **Zero Commissions or Assignment Fees**: We are direct acquisition principals, meaning you pay no 6% agent commissions.
• **Closing on Your Timeline**: Whether your estate requires 14 days or several months to clear probate, we align with your family's schedule.

I have created an initial intake dossier for our team. You can step through our 4-step seller intake or speak directly with Genaro.`,
      generatedBrief: sellerBrief,
      action: {
        actionId: "INITIATE_SELLER_MODE",
        payload: { sellerStepIndex: 1 },
        uiToastMessage: "Prepared Seller Advisory Dossier for Estate Review",
        timestamp: now,
      },
    };
  }

  // 7. General Knowledge Fallback
  const knowledgeMatch = queryOcgKnowledge(lower);
  if (knowledgeMatch) {
    return {
      messageText: `**${knowledgeMatch.title}**:

${knowledgeMatch.detailedFramework}

*Next Step*: ${knowledgeMatch.actionRecommendation || "Consult with OCG team."}`
    };
  }

  // 8. Context-Aware Default Response
  return {
    messageText: `OCG operates with disciplined underwriting, micro-market comps in Wichita, and strategic renovation design. 

Whether you are evaluating a **Fix & Flip**, exploring a **BRRRR rental portfolio**, stress-testing the **70% Rule**, or need an objective review of a **Wichita property to sell**, tell me your primary objective and I will configure the tools and prepare your strategy dossier.`
  };
}
