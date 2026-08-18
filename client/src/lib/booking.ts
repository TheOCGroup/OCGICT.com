import { IOCGStrategyBrief } from "../../../shared/contracts";

export interface BookingSlot {
  datetime: string;
  label: string;
}

export interface BookingConfirmation {
  confirmationId: string;
  scheduledTime: string;
  clientName: string;
  clientEmail: string;
  strategyBriefId?: string;
  status: "Confirmed" | "Pending_Principal_Review";
}

export interface IBookingProvider {
  name: "Cal.com" | "Calendly" | "OCG_Direct_Intake";
  isConfigured(): boolean;
  getBookingUrl(brief?: IOCGStrategyBrief): string;
}

/**
 * Default OCG Direct Booking Provider (Fallback when third-party calendar URLs are not set)
 */
export class OcgDirectBookingProvider implements IBookingProvider {
  name: "OCG_Direct_Intake" = "OCG_Direct_Intake";

  isConfigured(): boolean {
    return true;
  }

  getBookingUrl(brief?: IOCGStrategyBrief): string {
    const params = new URLSearchParams();
    if (brief) {
      params.set("briefId", brief.id);
      params.set("strategy", brief.strategyExploration.primaryFit.value);
    }
    return `/contact?${params.toString()}`;
  }
}

/**
 * Cal.com Provider (Enabled when CAL_COM_URL is supplied)
 */
export class CalComBookingProvider implements IBookingProvider {
  name: "Cal.com" = "Cal.com";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || "";
  }

  isConfigured(): boolean {
    return this.baseUrl.trim().length > 0;
  }

  getBookingUrl(brief?: IOCGStrategyBrief): string {
    if (!this.isConfigured()) return "/contact";
    const url = new URL(this.baseUrl);
    if (brief) {
      url.searchParams.set("notes", `OCG Strategy Brief ID: ${brief.id} (${brief.strategyExploration.primaryFit.value})`);
    }
    return url.toString();
  }
}

/**
 * Active Booking Provider Selector
 */
export function getActiveBookingProvider(): IBookingProvider {
  // Check for environment or global config variable
  const calUrl = (window as any)?.__OCG_CAL_URL__ || "";
  if (calUrl) {
    return new CalComBookingProvider(calUrl);
  }
  return new OcgDirectBookingProvider();
}
