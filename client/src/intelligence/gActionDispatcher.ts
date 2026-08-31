import { IGActionInvocation, IOCGStrategyBrief } from "../../../shared/contracts";
import { queryWichitaNeighborhood } from "./wichitaMarketIntelligence";

export interface GEngineResponse {
  messageText: string;
  action?: IGActionInvocation;
  generatedBrief?: IOCGStrategyBrief;
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

/**
 * Local fallback for G when the server-side model gateway is unavailable.
 * This path intentionally stays conservative: it can explain OCG frameworks and
 * perform deterministic math from explicit user inputs, but it must not invent
 * property facts, market statistics, financing terms, or strategy-brief numbers.
 */
export function processGDialogue(
  userInput: string,
  _currentHistory: Array<{ sender: "g" | "user"; text: string }>
): GEngineResponse {
  const query = userInput.trim();
  const lower = query.toLowerCase();
  const now = new Date().toISOString();

  const neighborhoodMatch = queryWichitaNeighborhood(lower);
  if (neighborhoodMatch) {
    const propertyCaseId = neighborhoodMatch.id === "college-hill"
      ? "bungalow"
      : neighborhoodMatch.id === "crown-heights"
        ? "ranch"
        : neighborhoodMatch.id === "delano"
          ? "delano"
          : undefined;

    const action: IGActionInvocation | undefined = propertyCaseId
      ? {
          actionId: "SELECT_PROPERTY_TRANSFORMATION",
          payload: { propertyCaseId },
          uiToastMessage: "Opened a conceptual Wichita renovation case study.",
          timestamp: now,
        }
      : undefined;

    return {
      messageText: `${neighborhoodMatch.name} has a distinct housing-stock and renovation context that can affect scope, buyer expectations, and exit strategy. The site can discuss general architectural patterns and OCG's renovation approach, but this fallback does not have live MLS, deed, permit, tax, or current comp data. For a real acquisition decision, use verified property data and current comparable sales rather than a neighborhood-wide assumption.`,
      action,
    };
  }

  if (lower.includes("70%") || lower.includes("mao") || lower.includes("underwrite") || lower.includes("arv") || lower.includes("rehab")) {
    const arv = parseLabeledMoney(query, "arv");
    const rehab = parseLabeledMoney(query, "rehab");

    if (arv === undefined || rehab === undefined) {
      const missing = [arv === undefined ? "ARV" : null, rehab === undefined ? "rehab budget" : null].filter(Boolean).join(" and ");
      return {
        messageText: `I can run the 70% screening math, but I will not guess the inputs. Please give me the ${missing}. Example: “ARV $300k, rehab $55k.” The result will be a heuristic MAO, not a complete profit model.`,
      };
    }

    const seventyPercent = Math.round(arv * 0.70);
    const mao = Math.max(0, seventyPercent - rehab);

    return {
      messageText: `Using only your stated assumptions:\n\nARV: $${arv.toLocaleString()}\n70% of ARV: $${seventyPercent.toLocaleString()}\nLess rehab: $${rehab.toLocaleString()}\nHeuristic MAO: $${mao.toLocaleString()}\n\nFormula: (ARV × 70%) − rehab. This is a first-pass screen only. A real deal decision still needs financing, holding period, taxes, insurance, utilities, transaction costs, selling costs, contingency, and exit assumptions.`,
      action: {
        actionId: "SET_CALCULATOR_VALUES",
        payload: { arv, rehab },
        uiToastMessage: "Loaded your stated ARV and rehab assumptions into the MAO explorer.",
        timestamp: now,
      },
    };
  }

  if (lower.includes("all my cash") || lower.includes("put all cash") || lower.includes("all cash into") || lower.includes("liquidity") || lower.includes("capital")) {
    return {
      messageText: `OCG generally evaluates liquidity as part of the risk structure rather than assuming every available dollar should go into the purchase. For a renovation deal, compare the actual lender down payment and draw structure against the cash you need for contingency, interest carry, taxes, insurance, utilities, closing costs, and unexpected delays. I can help model that once you provide the deal price, lender terms, rehab budget, and intended reserve level.`,
    };
  }

  if (lower.includes("dscr") || lower.includes("debt service") || (lower.includes("rental") && lower.includes("loan"))) {
    return {
      messageText: `DSCR measures how comfortably property income covers debt service under a lender's definition. The exact numerator, qualifying rent, reserve requirement, leverage, and minimum ratio vary by lender and product. I will not claim a property qualifies without the rent, taxes, insurance, loan amount, rate, term, and lender standard. Give me those inputs and I can show the math as assumptions rather than a financing guarantee.`,
    };
  }

  if (lower.includes("inherited") || lower.includes("probate") || lower.includes("estate") || lower.includes("sell") || lower.includes("house")) {
    return {
      messageText: `If you are considering selling a Wichita property, start with the address and the facts you know about condition, occupancy, timing, and title or estate context. OCG's current website flow can collect the property for review, but it should not invent an offer when verified property and comparable-sale evidence are unavailable. Any displayed preliminary offer is non-binding and remains subject to verification, walkthrough, title review, and a separate written purchase agreement.`,
      action: {
        actionId: "INITIATE_SELLER_MODE",
        payload: { sellerStepIndex: 1 },
        uiToastMessage: "Opened the seller property-review path.",
        timestamp: now,
      },
    };
  }

  return {
    messageText: `I can help with OCG's real-estate frameworks, seller property review, strategy trade-offs, and deterministic underwriting math. I will separate verified facts from assumptions and will not invent property or market numbers. Tell me whether you are evaluating a property, choosing an investment strategy, or considering a sale, and give me any numbers you already know.`,
  };
}
