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

async function persistLead(record: {
  name: string;
  email: string;
  phone?: string;
  source: string;
  notes: string;
}) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return "NOT_CONFIGURED" as const;

  const response = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: record.name,
      email: record.email,
      phone: record.phone || "",
      source: record.source,
      notes: record.notes,
      status: "new",
      created_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Lead persistence failed (${response.status})${detail ? `: ${detail.slice(0, 160)}` : ""}`);
  }

  return "SUPABASE" as const;
}

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

    const persistence = await persistLead({
      name,
      email,
      phone: input.phone?.trim(),
      source: `OCG_WEBSITE_${audience.toUpperCase()}`,
      notes: JSON.stringify({
        audience,
        propertyAddress: input.propertyAddress?.trim() || undefined,
        strategyInterest: input.strategyInterest || undefined,
        capitalAmount: input.capitalAmount || undefined,
        timeline: input.timeline || undefined,
        message: input.message?.trim() || undefined,
        source: input.source || "contact-page",
      }),
    });

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
      persistence,
      outboxId: handoff.outboxId,
      workItemId: handoff.workItemId,
    });

    return {
      status: persistence === "SUPABASE" ? "RECEIVED" : "CAPTURED_STAGING_ONLY",
      persistence,
      handoffStatus: handoff.status,
      trackingId: handoff.outboxId,
      workItemId: handoff.workItemId,
      message:
        persistence === "SUPABASE"
          ? "Your inquiry was saved for OCG review."
          : "The intake workflow is working, but durable lead persistence is not configured in this environment yet.",
    } as const;
  }

  static async subscribeNewsletter(input: NewsletterSubscribeRequest) {
    const email = input.email?.trim().toLowerCase();
    if (!email || !EMAIL.test(email)) throw new Error("A valid email address is required");

    const source = input.source || "lab-report";
    const persistence = await persistLead({
      name: "Lab Report Subscriber",
      email,
      source: "LAB_REPORT_SUBSCRIBER",
      notes: JSON.stringify({ source, subscription: "The Lab Report" }),
    });

    if (persistence === "SUPABASE") {
      OcgObservability.log("NEWSLETTER_SUBSCRIBED", { source, persistence });
      return { status: "SUBSCRIBED", persistence, message: "You’re subscribed to the next Lab Report." } as const;
    }

    OcgObservability.log("NEWSLETTER_INTEREST_CAPTURED", { source, persistence });
    return {
      status: "CAPTURED_STAGING_ONLY",
      persistence,
      message: "The signup flow is working, but durable newsletter persistence is not configured in this environment yet.",
    } as const;
  }
}
