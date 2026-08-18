import { IOCGStrategyBrief, IPiperAdapterRequest, IPiperAdapterResponse } from "../../shared/contracts";
import { OcgObservability } from "./observability";

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

/**
 * PIPER Queue & Handoff Adapter
 * Manages the transition from public website conversational intake into the OCG acquisition pipeline.
 */
export class PiperQueueAdapter {
  private static outboxQueue: PiperOutboxRecord[] = [];

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
    if (this.outboxQueue.length > 200) {
      this.outboxQueue.shift();
    }

    OcgObservability.log("PIPER_ADAPTER_INVOKED", {
      outboxId: outboxRecord.outboxId,
      briefId: brief.id,
      strategy: outboxRecord.primaryStrategy,
      status: outboxRecord.status,
    }, Date.now() - startTime);

    return {
      status: "SPECIFICATION_MOCK",
      piperTrackingId: outboxRecord.outboxId,
      dealStage: "1. Intake & Initial Triage",
      assignedWorkflow:
        brief.clientContext.investorStage.value === "Seller / Disposing"
          ? "Seller Direct Review"
          : "Investor Strategy Assessment",
      ingestionTimestamp: outboxRecord.createdAt,
    };
  }

  public static async enqueueLead(lead: {
    briefId: string;
    fullName: string;
    email: string;
    phone: string;
    targetStrategy: string;
    liquidityTier: string;
    timeline: string;
    summary: string;
  }): Promise<{ outboxId: string; status: string }> {
    const outboxId = `OUTBOX_LEAD_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    OcgObservability.log("PIPER_LEAD_ENQUEUED", {
      outboxId,
      fullName: lead.fullName,
      email: lead.email,
      strategy: lead.targetStrategy
    });

    return { outboxId, status: "READY_FOR_PIPER" };
  }

  public static getPendingOutbox(): PiperOutboxRecord[] {
    return [...this.outboxQueue];
  }
}

export const PiperOutboxService = PiperQueueAdapter;

