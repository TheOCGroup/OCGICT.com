import { IOCGStrategyBrief, IPiperAdapterRequest, IPiperAdapterResponse } from "../../shared/contracts.js";
import { OcgObservability } from "./observability.js";

export interface PiperOutboxRecord {
  outboxId: string;
  briefId: string;
  clientName: string;
  clientContact: string;
  investorStage: string;
  availableLiquidity: string;
  primaryStrategy: string;
  timeline: string;
  riskTolerance: string;
  unresolvedQuestions: string[];
  nextHumanAction: string;
  modeledMaoCeiling?: number;
  status: "READY_FOR_PIPER" | "DISPATCHED_TO_PIPER" | "MANUAL_PRINCIPAL_REVIEW";
  createdAt: string;
  payload: IOCGStrategyBrief;
}

export interface IOperationalWorkItem {
  workItemId: string;
  category: "SELLER_ACQUISITION" | "INVESTOR_STRATEGY" | "CAPITAL_PARTNER";
  priority: "HIGH" | "MEDIUM" | "STANDARD";
  leadName: string;
  contact: { email: string; phone: string };
  propertyAddress?: string;
  summary: string;
  timeline: string;
  assignedSpecialist: "Genaro Ocasio" | "OCG Acquisitions";
  status: "PENDING_TRIAGE" | "ACTION_REQUIRED" | "CONTACTED";
  receivedAt: string;
}

export type SellerActionType = "ACCEPT_PRELIMINARY_OFFER" | "COUNTEROFFER" | "REQUEST_CALL" | "REQUEST_WALKTHROUGH";

export interface SellerActionRecord {
  actionId: string;
  offerId: string;
  action: SellerActionType;
  counterAmount?: number;
  preferredWindow?: string;
  notes?: string;
  createdAt: string;
  status: "RECORDED_FOR_OCG_REVIEW";
}

export class PiperQueueAdapter {
  private static outboxQueue: PiperOutboxRecord[] = [];
  private static workItems: IOperationalWorkItem[] = [];
  private static sellerActions: SellerActionRecord[] = [];

  public static async enqueueStrategyBrief(req: IPiperAdapterRequest): Promise<IPiperAdapterResponse> {
    const startTime = Date.now();
    const brief = req.strategyBrief;
    const outboxRecord: PiperOutboxRecord = {
      outboxId: `OUTBOX_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      briefId: brief.id,
      clientName: brief.clientContext.fullName || "Prospect via G Gateway",
      clientContact: brief.clientContext.email || brief.clientContext.phone || "intake@ocgintelligence.local",
      investorStage: brief.clientContext.investorStage.value,
      availableLiquidity: brief.clientContext.availableLiquidityTier.value,
      primaryStrategy: brief.strategyExploration.primaryFit.value,
      timeline: brief.strategyExploration.timeline.value,
      riskTolerance: brief.strategyExploration.riskTolerance.value,
      unresolvedQuestions: brief.executiveIntelligence.unresolvedQuestions,
      nextHumanAction: brief.executiveIntelligence.nextRecommendedHumanAction,
      modeledMaoCeiling: brief.strategyExploration.modeledUnderwritingContext?.targetMaoCeiling,
      status: "READY_FOR_PIPER",
      createdAt: new Date().toISOString(),
      payload: brief,
    };

    this.outboxQueue.push(outboxRecord);
    if (this.outboxQueue.length > 200) this.outboxQueue.shift();

    this.workItems.unshift({
      workItemId: `WORK_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: brief.clientContext.investorStage.value === "Seller / Disposing" ? "SELLER_ACQUISITION" : "INVESTOR_STRATEGY",
      priority: "HIGH",
      leadName: brief.clientContext.fullName || "Investor / Prospect",
      contact: { email: brief.clientContext.email || "", phone: brief.clientContext.phone || "" },
      summary: brief.executiveIntelligence.gConversationSummary || `Strategy exploration: ${brief.strategyExploration.primaryFit.value}`,
      timeline: brief.strategyExploration.timeline.value,
      assignedSpecialist: "Genaro Ocasio",
      status: "ACTION_REQUIRED",
      receivedAt: new Date().toISOString(),
    });

    OcgObservability.log("PIPER_ADAPTER_INVOKED", { outboxId: outboxRecord.outboxId, briefId: brief.id, strategy: outboxRecord.primaryStrategy, status: outboxRecord.status }, Date.now() - startTime);

    return {
      status: "SPECIFICATION_MOCK",
      piperTrackingId: outboxRecord.outboxId,
      dealStage: "1. Intake & Initial Triage",
      assignedWorkflow: brief.clientContext.investorStage.value === "Seller / Disposing" ? "Seller Direct Review" : "Investor Strategy Assessment",
      ingestionTimestamp: outboxRecord.createdAt,
    };
  }

  public static async enqueueLead(lead: {
    briefId: string; fullName: string; email: string; phone: string; targetStrategy: string;
    liquidityTier: string; timeline: string; summary: string; address?: string;
  }): Promise<{ outboxId: string; status: string; workItemId: string }> {
    const outboxId = `OUTBOX_LEAD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const workItemId = `WORK_LEAD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.workItems.unshift({
      workItemId,
      category: lead.targetStrategy.includes("Sale") ? "SELLER_ACQUISITION" : "INVESTOR_STRATEGY",
      priority: "HIGH",
      leadName: lead.fullName,
      contact: { email: lead.email, phone: lead.phone },
      propertyAddress: lead.address,
      summary: lead.summary,
      timeline: lead.timeline,
      assignedSpecialist: "Genaro Ocasio",
      status: "ACTION_REQUIRED",
      receivedAt: new Date().toISOString(),
    });
    OcgObservability.log("PIPER_LEAD_ENQUEUED", { outboxId, workItemId, fullName: lead.fullName, email: lead.email, strategy: lead.targetStrategy });
    return { outboxId, status: "READY_FOR_PIPER", workItemId };
  }

  public static async recordSellerAction(input: {
    offerId: string;
    action: SellerActionType;
    counterAmount?: number;
    preferredWindow?: string;
    notes?: string;
  }): Promise<SellerActionRecord> {
    const record: SellerActionRecord = {
      actionId: `SELLER_ACTION_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      offerId: input.offerId,
      action: input.action,
      counterAmount: input.counterAmount,
      preferredWindow: input.preferredWindow,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      status: "RECORDED_FOR_OCG_REVIEW",
    };
    this.sellerActions.unshift(record);
    if (this.sellerActions.length > 500) this.sellerActions.pop();

    this.workItems.unshift({
      workItemId: `WORK_ACTION_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: "SELLER_ACQUISITION",
      priority: "HIGH",
      leadName: `Seller action for ${input.offerId}`,
      contact: { email: "", phone: "" },
      summary: `${input.action}${input.counterAmount ? ` — counter $${input.counterAmount.toLocaleString()}` : ""}${input.preferredWindow ? ` — preferred ${input.preferredWindow}` : ""}`,
      timeline: "Immediate follow-up",
      assignedSpecialist: "OCG Acquisitions",
      status: "ACTION_REQUIRED",
      receivedAt: record.createdAt,
    });

    OcgObservability.log("SELLER_OFFER_ACTION_RECORDED", record);
    return record;
  }

  public static getPendingOutbox(): PiperOutboxRecord[] { return [...this.outboxQueue]; }
  public static getWorkItems(): IOperationalWorkItem[] { return [...this.workItems]; }
  public static getSellerActions(): SellerActionRecord[] { return [...this.sellerActions]; }
}

export const PiperOutboxService = PiperQueueAdapter;
