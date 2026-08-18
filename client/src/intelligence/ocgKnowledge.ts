/**
 * OCG Knowledge Base & Reasoning Core
 * Encapsulates the core operating principles, underwriting math, financing rules,
 * and strategic methodologies of Ocasio Capital Group (OCG).
 */

export interface KnowledgeTopic {
  title: string;
  category: "underwriting" | "financing" | "strategy" | "seller_advisory" | "philosophy";
  keywords: string[];
  summary: string;
  detailedFramework: string;
  actionRecommendation?: string;
}

export const OCG_KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    title: "The 70% Rule & Maximum Allowable Offer (MAO)",
    category: "underwriting",
    keywords: ["70%", "rule", "mao", "maximum allowable offer", "formula", "underwrite", "underwriting", "numbers"],
    summary: "MAO = (After Repair Value × 70%) − Estimated Renovation Costs.",
    detailedFramework: `The 70% rule is an underwriting discipline, not a lender regulation.
1. ARV (After Repair Value): Realistic retail sales price after full architectural renovation, based on closed comparable sales in a 0.5-mile radius within 90-180 days.
2. The 30% Buffer: Covers holding costs (hard money interest, utilities, property taxes, insurance), acquisition/sale closing costs (6-9%), and protects a 12-18% net operating margin.
3. Rehab Deduction: The contractor scope of work including materials, labor, permits, and a 10-15% contingency reserve.
4. Purpose: Ensures an investor does not overpay at acquisition, which is where real estate profits are made.`,
    actionRecommendation: "Open MAO Underwriting Explorer with modeled numbers."
  },
  {
    title: "Capital Preservation & Financing Structure Philosophy",
    category: "financing",
    keywords: ["capital", "liquidity", "50k", "100k", "cash", "preserve", "reserves", "debt", "leverage", "hard money", "private money"],
    summary: "Do not deplete liquid cash reserves into illiquid physical assets. Use structured debt for acquisition/rehab while holding liquid capital as a strategic defense shield.",
    detailedFramework: `A fundamental mistake of novice investors is allocating all liquid cash directly into property purchases.
OCG's approach:
1. For Fix & Flip: Structure senior lender or private capital for 85-90% LTC (Loan-to-Cost) covering purchase and 100% of construction draws.
2. Strategic Liquidity Shield: Keep your $30k-$100k liquid in high-yield reserves. This satisfies lender liquidity requirements, shields against timeline extensions, and allows multiple concurrent executions.
3. For BRRRR: Deploy equity into acquisition and rehab, stabilize with quality tenant leasing, then refinance into 30-year fixed DSCR debt to recycle capital back to reserves.`,
    actionRecommendation: "Align with OCG Financing Strategy Framework."
  },
  {
    title: "Fix & Flip vs BRRRR vs Buy & Hold Strategic Fit",
    category: "strategy",
    keywords: ["flip", "brrrr", "buy and hold", "rental", "comparison", "matrix", "strategy fit", "cash flow", "wealth"],
    summary: "Flips build liquid capital and transaction competence. BRRRR recycles capital into long-term equity and cash flow. Buy & Hold delivers passive multi-decade compounding.",
    detailedFramework: `How to choose your path:
- FIX & FLIP:
  * Best for: Investors looking to generate lump-sum capital ($25k-$60k per deal) or those building a primary investment war chest.
  * Trade-off: Short-term capital gains tax; active management required.
- BRRRR (Buy, Rehab, Rent, Refinance, Repeat):
  * Best for: Investors with capital who want to scale a rental portfolio without leaving all their cash trapped in single down payments.
  * Key Constraint: Must hit DSCR ratio (minimum 1.20x-1.25x rent-to-PITI) and survive lender seasoning periods (typically 6 months).
- BUY & HOLD:
  * Best for: High-earning professionals seeking tax depreciation, passive wealth, and steady monthly yield with minimal turnover.`,
    actionRecommendation: "Review Strategy Comparison Matrix."
  },
  {
    title: "Respectful Seller Advisory vs High-Pressure Wholesaling",
    category: "seller_advisory",
    keywords: ["sell", "inherited", "probate", "estate", "repairs", "as-is", "wholesaler", "wholesaling", "distressed"],
    summary: "OCG provides direct, transparent property reviews for owners and heirs. No predatory contract tie-ups, false promises, or high-pressure games.",
    detailedFramework: `Traditional wholesalers often tie up properties with inspection contingencies and attempt to assign contracts with inflated markups, frequently walking away at the last minute if they fail.
OCG's principle:
1. Transparent Preliminary Valuation: We analyze Sedgwick County public records, local market comps, and physical repair realities upfront.
2. Respectful Consultation: For probate, estate transitions, or inherited houses, we accommodate family timelines, clean-out requirements, and flexible closing dates.
3. Certainty: If we make an offer, it is backed by real underwriting and capital capability.`,
    actionRecommendation: "Initiate Respectful Seller Intake Review."
  }
];

export function queryOcgKnowledge(userQuery: string): KnowledgeTopic | null {
  const q = userQuery.toLowerCase();
  for (const topic of OCG_KNOWLEDGE_BASE) {
    if (topic.keywords.some((kw) => q.includes(kw))) {
      return topic;
    }
  }
  return null;
}
