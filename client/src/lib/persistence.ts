import { IOCGStrategyBrief } from "../../../shared/contracts";

const SUPABASE_URL = "https://lsaerludzkxjewqgbvkg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWVybHVkemt4amV3cWdidmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTMwNzEsImV4cCI6MjA5MTc2OTA3MX0.k0PmsyeAQ-hq8aTn_AVoyzsx-cbYdmfQzHKhIMp_s1U";

const LOCAL_STORAGE_KEY = "ocg_strategy_briefs_v1";

export async function persistStrategyBrief(brief: IOCGStrategyBrief): Promise<{ success: boolean; id: string; storage: "supabase" | "local" }> {
  // Always write to local storage as fallback and immediate cache
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const updated = [brief, ...existing.filter((b: IOCGStrategyBrief) => b.id !== brief.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Local storage cache warning:", err);
  }

  // Attempt Supabase REST persistence
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: brief.clientName || "OCG Intelligence Lead",
        email: brief.clientEmail || "intake@ocgintelligence.local",
        phone: brief.clientPhone || "",
        source: brief.leadSource,
        notes: JSON.stringify(brief),
        status: "new",
        created_at: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return { success: true, id: brief.id, storage: "supabase" };
    }
  } catch (supabaseErr) {
    console.warn("Supabase persistence fallback to local cache:", supabaseErr);
  }

  return { success: true, id: brief.id, storage: "local" };
}

export function getCachedStrategyBriefs(): IOCGStrategyBrief[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
