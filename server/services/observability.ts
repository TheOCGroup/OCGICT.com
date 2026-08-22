/**
 * OCG Structured Observability & Event Telemetry Engine
 * Logs operational and intelligence events without recording raw confidential client data.
 */

export type OCGEventType =
  | "G_SESSION_STARTED"
  | "INVESTOR_PATH_SELECTED"
  | "SELLER_PATH_SELECTED"
  | "TOOL_CALLED"
  | "TOOL_SUCCEEDED"
  | "TOOL_FAILED"
  | "STRATEGY_BRIEF_UPDATED"
  | "STRATEGY_BRIEF_PERSISTED"
  | "BOOKING_INITIATED"
  | "PROPERTY_SUBMITTED"
  | "RETRIEVAL_SOURCE_ACCESSED"
  | "RETRIEVAL_UNMATCHED_HONEST_FAILURE"
  | "PROPERTY_PROVIDER_NOT_CONNECTED"
  | "COMPARABLE_PROVIDER_NOT_CONNECTED"
  | "HUNTER_ADAPTER_INVOKED"
  | "VICTOR_ADAPTER_INVOKED"
  | "PIPER_ADAPTER_INVOKED"
  | "PIPER_LEAD_ENQUEUED"
  | "SELLER_INTAKE_PROCESSING_STARTED"
  | "SELLER_INTAKE_PROCESSED_SUCCESSFULLY"
  | "SELLER_OFFER_ACTION_RECORDED";

export interface IOcgTelemetryEvent {
  eventId: string;
  eventType: OCGEventType;
  timestamp: string;
  sessionId?: string;
  metadata: Record<string, any>;
  durationMs?: number;
}

export class OcgObservability {
  private static events: IOcgTelemetryEvent[] = [];

  public static log(eventType: OCGEventType, metadata: Record<string, any> = {}, durationMs?: number, sessionId?: string): void {
    const event: IOcgTelemetryEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || "anon_session",
      metadata: this.sanitizeMetadata(metadata),
      durationMs,
    };

    this.events.push(event);
    if (this.events.length > 500) this.events.shift();

    console.log(`[OCG-TELEMETRY] [${event.eventType}] duration=${durationMs ?? 0}ms meta=${JSON.stringify(event.metadata)}`);
  }

  public static getRecentEvents(limit = 50): IOcgTelemetryEvent[] {
    return this.events.slice(-limit);
  }

  private static sanitizeMetadata(meta: Record<string, any>): Record<string, any> {
    const sanitized = { ...meta };
    const sensitiveKeys = ["ssn", "password", "apiKey", "creditCard", "exactBankBalance"];
    for (const k of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => k.toLowerCase().includes(s.toLowerCase()))) sanitized[k] = "[REDACTED_CONFIDENTIAL]";
    }
    return sanitized;
  }
}
