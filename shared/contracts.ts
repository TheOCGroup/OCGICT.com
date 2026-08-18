/**
 * OCG Core Type Contracts & System Interfaces
 * Shared across G Intelligence, HUNTER, VICTOR, PIPER, and Frontend Operations.
 */

// ============================================================
// 1. OCG STRATEGY BRIEF CONTRACT
// ============================================================
export interface IOCGStrategyBrief {
  id: string;
  createdAt: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  investorStage: "Beginner" | "Active Operator" | "Capital Allocator" | "Seller / Disposing";
  availableLiquidityTier: "$10k-$25k" | "$25k-$50k" | "$50k-$100k" | "$100k-$250k" | "$250k+" | "Equity / Real Estate Only";
  preferredStrategy: "Fix & Flip" | "BRRRR" | "Buy & Hold / Cash Flow" | "Direct Sale / Liquidation" | "Exploratory / Unsure";
  targetNeighborhoods?: string[];
  targetTimeline: "Immediate (0-30 Days)" | "30-90 Days" | "90-180 Days" | "Flexible";
  riskTolerance: "Conservative (Preserve Capital First)" | "Balanced Growth" | "Aggressive Turnkey";
  underwritingNotes?: {
    estimatedBudget?: number;
    targetArv?: number;
    projectedRehabTier?: "Cosmetic ($15-$25/sqft)" | "Standard ($30-$45/sqft)" | "Full Architectural ($50-$75/sqft)";
  };
  executiveSummary: string;
  leadSource: "Website G Conversation" | "Direct Booking" | "Seller Intake" | "Investor Intake";
  status: "Draft" | "Submitted" | "Scheduled" | "Ingested_by_PIPER";
}

// ============================================================
// 2. G WEBSITE CONTROL & TOOL ACTIONS
// ============================================================
export type GActionType =
  | "navigate"
  | "open_calculator"
  | "set_calculator_values"
  | "load_property_case"
  | "activate_seller_intake"
  | "book_strategy_session"
  | "generate_strategy_brief";

export interface IGWebsiteAction {
  type: GActionType;
  payload?: {
    path?: string;
    arv?: number;
    rehab?: number;
    propertyId?: "bungalow" | "ranch";
    sellerStep?: number;
    briefingData?: Partial<IOCGStrategyBrief>;
  };
  uiNotice?: string;
}

// ============================================================
// 3. HUNTER / VICTOR / PIPER SYSTEM INTERFACES
// ============================================================
export interface IHunterSignal {
  id: string;
  timestamp: string;
  neighborhood: string;
  address: string;
  distressVector: "Tax Delinquency" | "Probate / Estate" | "Deferred Exterior Maintenance" | "Code Compliance" | "Landlord Portfolio Exit";
  countyAppraisal: number;
  estimatedMarketDeltaPercent: number;
  priorityScore: number; // 1-100
  intakeStatus: "Signal Flagged" | "Victor Queued" | "Manual Review" | "Dismissed";
}

export interface IVictorUnderwritingPayload {
  dealId: string;
  address: string;
  sqft: number;
  yearBuilt: number;
  compsRadiusMiles: number;
  comparableCount: number;
  computedArv: number;
  itemizedRehabScope: {
    roofAndExterior: number;
    kitchenAndBaths: number;
    mepSystems: number; // Mechanical, Electrical, Plumbing
    interiorFinishes: number;
    contingencyReserve: number;
  };
  totalEstimatedRehab: number;
  maximumAllowableOffer: number; // (ARV * 0.70) - Rehab
  flipProjectedProfit: number;
  brrrrRefiCapRate: number;
  dscrCoverageRatio: number;
  underwritingConfidenceScore: number; // 1-100
}

export interface IPiperDealPipelineStage {
  dealId: string;
  propertyAddress: string;
  currentStage: "1. Lead Sourced" | "2. Underwriting Complete" | "3. Offer Extended" | "4. In Escrow" | "5. Due Diligence / Inspections" | "6. Closed / Title Transferred" | "7. Active Renovation" | "8. Stabilized / Exit";
  closingDateTarget: string;
  contingenciesCleared: string[];
  lenderPacketReady: boolean;
  assignedPrincipal: string;
}

// ============================================================
// 4. INTEGRATION COMPONENT STATUS ENUM
// ============================================================
export type IntegrationStatus = "LIVE" | "STAGING" | "SPECIFICATION" | "BLOCKED";

export interface IIntegrationMatrixItem {
  subsystem: string;
  component: string;
  status: IntegrationStatus;
  currentCapability: string;
  productionRequirement: string;
  blockerOrDecisionRequired?: string;
}
