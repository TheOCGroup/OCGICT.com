import { PiperQueueAdapter } from "./piperAdapter";
import { OcgObservability } from "./observability";

export type ContactAudience = "investor" | "seller" | "capital" | "partner" | "other";

export interface PublicContactRequest {
  audience: ContactAudience;
  name: string;
  email: string;
  phone?: string;
  propertyAddress?: string;
  strategyInterest?: string;
  capitalAmount?: string;
  timeline?: string;
  message?: string;
  source?: string;
}

export interface NewsletterSubscribeRequest {
  email: string;
  source?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const subscribers = new Map<string, { email: string; source: string; subscribedAt: string }>();

export class PublicEngagementService {
  static async submitContact(input: PublicContactRequest) {
    const name = input.name?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!name) throw new Error("Name is required");
    if (!email || !EMAIL.test(email)) throw new Error("A valid email address is required");

    const audience = input.audience || "other";
    const targetStrategy =
      audience === "seller"
        ? "Direct Property Sale"
        : audience === "capital"
          ? "Capital / Lending Partnership"
          : audience === "partner"
            ? "OCG Partnership"
            : input.strategyInterest || "OCG Strategy Conversation";

    const handoff = await PiperQueueAdapter.enqueueLead({
      briefId: `PUBLIC_${Date.now()}`,
      fullName: name,
      email,
      phone: input.phone?.trim() || "",
      targetStrategy,
      liquidityTier: input.capitalAmount || "Not provided",
      timeline: input.timeline || "Not provided",
      summary: input.message?.trim() || `${audience} inquiry from OCG website`,
      address: input.propertyAddress?.trim() || undefined,
    });

    OcgObservability.log("PUBLIC_CONTACT_SUBMITTED", {
      audience,
      source: input.source || "contact-page",
      outboxId: handoff.outboxId,
      workItemId: handoff.workItemId,
    });

    return {
      status: "RECEIVED",
      handoffStatus: handoff.status,
      trackingId: handoff.outboxId,
      workItemId: handoff.workItemId,
    };
  }

  static async subscribeNewsletter(input: NewsletterSubscribeRequest) {
    const email = input.email?.trim().toLowerCase();
    if (!email || !EMAIL.test(email)) throw new Error("A valid email address is required");

    const source = input.source || "lab-report";
    const webhook = process.env.NEWSLETTER_WEBHOOK_URL;

    if (webhook) {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, subscribedAt: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Newsletter subscription provider rejected the request");
      OcgObservability.log("NEWSLETTER_SUBSCRIBED", { source, persistence: "REMOTE_WEBHOOK" });
      return { status: "SUBSCRIBED", persistence: "REMOTE_WEBHOOK" } as const;
    }

    const subscribedAt = new Date().toISOString();
    subscribers.set(email, { email, source, subscribedAt });
    OcgObservability.log("NEWSLETTER_INTEREST_CAPTURED", { source, persistence: "STAGING_MEMORY" });
    return {
      status: "CAPTURED_STAGING_ONLY",
      persistence: "STAGING_MEMORY",
      message: "Subscription interest was captured in staging. Persistent newsletter delivery is not connected yet.",
    } as const;
  }

  static getStagingSubscribers() {
    return [...subscribers.values()];
  }
}
