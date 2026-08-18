/* ============================================================
   Supabase client — shared across admin and public pages
   Project: lsaerludzkxjewqgbvkg (OC Group CRM + Marketplace)
   ============================================================ */

const SUPABASE_URL = "https://lsaerludzkxjewqgbvkg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWVybHVkemt4amV3cWdidmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxOTMwNzEsImV4cCI6MjA5MTc2OTA3MX0.k0PmsyeAQ-hq8aTn_AVoyzsx-cbYdmfQzHKhIMp_s1U";

export interface MarketplaceListing {
  id?: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  arv: number | null;
  rehab_estimate: number | null;
  projected_profit: number | null;
  strategy: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  year_built: number | null;
  property_type: string;
  description: string;
  highlights: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

async function sbFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const supabase = {
  // ── Marketplace Listings ──────────────────────────────────────
  async getListings(activeOnly = true): Promise<MarketplaceListing[]> {
    const filter = activeOnly ? "is_active=eq.true&" : "";
    return sbFetch(`marketplace_listings?${filter}order=sort_order.asc,created_at.desc`);
  },

  async getListing(id: string): Promise<MarketplaceListing> {
    const data = await sbFetch(`marketplace_listings?id=eq.${id}&limit=1`);
    return data[0];
  },

  async createListing(listing: Omit<MarketplaceListing, "id" | "created_at" | "updated_at">): Promise<MarketplaceListing> {
    const data = await sbFetch("marketplace_listings", {
      method: "POST",
      body: JSON.stringify({ ...listing, updated_at: new Date().toISOString() }),
    });
    return data[0];
  },

  async updateListing(id: string, listing: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    const data = await sbFetch(`marketplace_listings?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...listing, updated_at: new Date().toISOString() }),
    });
    return data[0];
  },

  async deleteListing(id: string): Promise<void> {
    await sbFetch(`marketplace_listings?id=eq.${id}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  },

  async toggleListingActive(id: string, is_active: boolean): Promise<void> {
    await sbFetch(`marketplace_listings?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active, updated_at: new Date().toISOString() }),
      headers: { Prefer: "return=minimal" },
    });
  },
};
