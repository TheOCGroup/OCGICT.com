/**
 * Canonical OCG Operating Contracts & Type Specifications (Phase III)
 * Shared across G Gateway, HUNTER, VICTOR, PIPER, and Frontend Operations.
 */

// ============================================================
// 1. DATA CERTAINTY & PROVENANCE CLASSIFICATIONS
// ============================================================
export type DataCertaintyLevel =
  | "KNOWN"                         // Formally verified public record / deed / closed title
  | "ESTIMATED"                     // Computed via deterministic underwriting formula
  | "PROVISIONAL"                   // Derived from heuristic models / preliminary intake
  | "PROFESSIONAL_VERIFICATION_REQ"; // Requires on-site contractor inspection or certified appraisal

export interface IDataFieldProvenance<T> {
  value: T;
  certainty: DataCertaintyLevel;
  source: string;
  retrievalTimestamp: string;
  confidenceScore?: number; // 0.00 - 1.00
  verificationNotes?: string;
}

// ============================================================
// 2. CANONICAL OCG STRATEGY BRIEF CONTRACT
// ============================================================
export interface IOCGStrategyBrief {
  id: string;
  version: "3.0.0";
  createdAt: string;
  updatedAt: string;
  provenance: {
    origin: "G_CONVERSATIONAL_INTAKE" | "DIRECT_INVESTOR_FORM" | "DIRECT_SELLER_FORM" | "OPERATOR_MANUAL";
    sessionId: string;
    clientIpHash?: string;
    userAgent?: string;
  };
  clientContext: {
    fullName?: string;
    email?: string;
    phone?: string;
    preferredContactMethod?: "Email" | "Phone" | "SMS";
    investorStage: IDataFieldProvenance<"Beginner" | "Active Operator" | "Capital Allocator" | "Seller / Disposing">;
    availableLiquidityTier: IDataFieldProvenance<"$10k-$25k" | "$25k-$50k" | "$50k-$100k" | "$100k-$250k" | "$250k+" | "Equity / Real Estate Only">;
    investmentExperienceYears?: number;
    involvementPreference?: "Active Project Oversight" | "Passive Capital Partner" | "Hybrid Advisory";
  };
  strategyExploration: {
    primaryFit: IDataFieldProvenance<"Fix & Flip" | "BRRRR" | "Buy & Hold" | "Direct Sale / Liquidation" | "Exploratory / Unsure">;
    secondaryFit?: string;
    targetNeighborhoods?: string[];
    timeline: IDataFieldProvenance<"Immediate (0-30 Days)" | "30-90 Days" | "90-180 Days" | "Flexible">;
    riskTolerance: IDataFieldProvenance<"Conservative (Preserve Capital First)" | "Balanced Growth" | "Aggressive Turnkey">;
    modeledUnderwritingContext?: {
      targetArv?: number;
      estimatedRehabBudget?: number;
      targetMaoCeiling?: number;
      modeledGrossMargin?: number;
      contingencyBuffer?: number;
    };
  };
  executiveIntelligence: {
    gConversationSummary: string;
    keyRiskConsiderations: string[];
    unresolvedQuestions: string[];
    nextRecommendedHumanAction: string;
    disclaimerAcknowledged: boolean;
  };
  lifecycle: {
    status: "Draft" | "Persisted_Staging" | "Scheduled_Strategy_Session" | "Ingested_by_PIPER" | "Archived";
    piperDealId?: string;
    assignedPrincipal?: string;
  };
}

// ============================================================
// 3. PROPERTY INTELLIGENCE RECORD (VICTOR / PIPER INPUT)
// ============================================================
export interface IPropertyIntelligenceRecord {
  id: string;
  address: string;
  city: "Wichita" | string;
  state: "KS" | string;
  zip: string;
  sedgwickCountyParcelId?: IDataFieldProvenance<string>;
  legalDescription?: IDataFieldProvenance<string>;
  
  // Physical Characteristics
  propertyType: IDataFieldProvenance<"Single Family Craftsman" | "Mid-Century Ranch" | "Victorian / Cottage" | "Multi-Family" | "Other">;
  sqft: IDataFieldProvenance<number>;
  yearBuilt: IDataFieldProvenance<number>;
  bedrooms: IDataFieldProvenance<number>;
  bathrooms: IDataFieldProvenance<number>;
  
  // Underwriting & Scope
  arvRetailEstimate: IDataFieldProvenance<number>;
  rehabScopeEstimate: IDataFieldProvenance<number>;
  maximumAllowableOffer: IDataFieldProvenance<number>;
  projectedMonthlyRent: IDataFieldProvenance<number>;
  
  // Risk & Physical Verification Flags
  foundationInspectionStatus: DataCertaintyLevel;
  roofAgeAndCondition: DataCertaintyLevel;
  mepSystemsCondition: DataCertaintyLevel; // Mechanical, Electrical, Plumbing
  floodPlainZone: IDataFieldProvenance<string>;
  taxDelinquencyStatus: IDataFieldProvenance<"Current" | "Delinquent" | "In Foreclosure">;
}

// ============================================================
// 4. G ACTION & WEBSITE CONTROL REGISTRY
// ============================================================
export type GActionId =
  | "NAVIGATE"
  | "OPEN_STRATEGY_COMPARISON"
  | "SELECT_STRATEGY_TAB"
  | "SET_CALCULATOR_VALUES"
  | "SELECT_PROPERTY_TRANSFORMATION"
  | "INITIATE_SELLER_MODE"
  | "INITIATE_INVESTOR_QUALIFICATION"
  | "INITIATE_BOOKING"
  | "UPDATE_STRATEGY_BRIEF";

export interface IGActionInvocation {
  actionId: GActionId;
  payload?: {
    path?: string;
    strategyTab?: "flip" | "brrrr" | "buy_hold";
    arv?: number;
    rehab?: number;
    propertyCaseId?: "bungalow" | "ranch" | "delano";
    sellerStepIndex?: number;
    briefUpdates?: Partial<IOCGStrategyBrief>;
    bookingContext?: {
      briefId?: string;
      requestedStrategy?: string;
    };
  };
  uiToastMessage?: string;
  timestamp: string;
}

// ============================================================
// 5. HUNTER / VICTOR / PIPER ADAPTER CONTRACTS
// ============================================================
export interface IHunterAdapterRequest {
  targetZipCodes?: string[];
  distressVector?: "Tax Delinquency" | "Probate / Estate" | "Deferred Exterior Maintenance" | "All";
  minAppraisalDeltaPercent?: number;
}

export interface IHunterAdapterResponse {
  status: "SPECIFICATION_MOCK" | "LIVE_CONNECTED" | "ERROR";
  signalsFound: Array<{
    signalId: string;
    address: string;
    neighborhood: string;
    distressVector: string;
    marketDeltaPercent: number;
    priorityScore: number;
  }>;
  retrievalTimestamp: string;
  upstreamService: "HUNTER_CORE_V1";
}

export interface IVictorAdapterRequest {
  propertyAddress: string;
  sqft: number;
  yearBuilt: number;
  observedConditionTier: "Light Cosmetic" | "Standard Renovation" | "Heavy Gut / Structural";
  targetStrategy: "Fix & Flip" | "BRRRR";
}

export interface IVictorAdapterResponse {
  status: "SPECIFICATION_MOCK" | "LIVE_CONNECTED" | "ERROR";
  underwritingRecord: IPropertyIntelligenceRecord;
  rehabBreakdown: {
    exteriorAndRoof: number;
    kitchensAndBaths: number;
    mechanicals: number;
    contingencyReserve: number;
    totalRehab: number;
  };
  maoCeiling: number;
  dscrRefiFeasibility: {
    projectedRent: number;
    estimatedPiti: number;
    coverageRatio: number;
    qualifiesForDscr: boolean;
  };
  underwritingConfidenceScore: number;
}

export interface IPiperAdapterRequest {
  strategyBrief: IOCGStrategyBrief;
  associatedPropertyRecord?: IPropertyIntelligenceRecord;
}

export interface IPiperAdapterResponse {
  status: "SPECIFICATION_MOCK" | "LIVE_CONNECTED" | "ERROR";
  piperTrackingId: string;
  dealStage: "1. Intake & Initial Triage";
  assignedWorkflow: "Investor Strategy Assessment" | "Seller Direct Review";
  ingestionTimestamp: string;
}

// ============================================================
// 6. VOICE PROVIDER AGNOSTIC INTERFACES
// ============================================================
export interface ISTTProvider {
  name: string;
  connect(stream: MediaStream): Promise<void>;
  onTranscript(callback: (text: string, isFinal: boolean) => void): void;
  disconnect(): Promise<void>;
}

export interface ITTSProvider {
  name: string;
  synthesizeStreaming(textStream: AsyncIterable<string>): Promise<AsyncIterable<ArrayBuffer>>;
  cancel(): void;
}

export interface ILiveAvatarProvider {
  name: string;
  initialize(containerElement: HTMLElement): Promise<void>;
  speak(audioStream: ArrayBuffer): void;
  interrupt(): void;
}
