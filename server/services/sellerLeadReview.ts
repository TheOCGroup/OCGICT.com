/** Convert supported Firestore/ISO timestamp values without allowing malformed data to fail the queue. */
function safeIsoTimestamp(value: unknown): string | null {
  try {
    const date = value instanceof Date
      ? value
      : value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function"
        ? (value as { toDate: () => Date }).toDate()
        : typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)
          ? new Date(value)
          : null;
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
  } catch {
    return null;
  }
}

/** Privacy-minimized seller review projection. No raw Firestore fields escape. */
export function projectSellerLeadRows(rows: Array<{ id: string; data: Record<string, unknown> }>) {
  return rows.filter((row) => {
    const form = String(row.data.form || "");
    if (form === "ocg-seller-intake" || form === "ocg-seller-action") return true;
    if (form !== "ocg-g-lead") return false;
    const fields = row.data.fields;
    return !!fields && typeof fields === "object" && !Array.isArray(fields) &&
      (fields as Record<string, unknown>).role === "seller";
  })
    .map((row) => {
      const fields = row.data.fields && typeof row.data.fields === "object" && !Array.isArray(row.data.fields)
        ? row.data.fields as Record<string, unknown> : {};
      const safe = (key: string, max: number) => typeof fields[key] === "string" ? String(fields[key]).slice(0, max) : "";
      return {
        id: row.id,
        form: String(row.data.form),
        receivedAt: safeIsoTimestamp(row.data.receivedAt),
        reference: safe("reference", 80), name: safe("name", 150),
        address: safe("address", 240), email: safe("email", 254), phone: safe("phone", 40),
        action: safe("action", 40), offerId: safe("offerId", 80),
      };
    });
}
/** Firestore query surface used to fetch only seller submissions before applying a limit. */
export interface SellerLeadQuery {
  where(field: string, operator: "in" | "==", value: unknown): SellerLeadQuery;
  orderBy(field: string, direction: "desc"): SellerLeadQuery;
  limit(count: number): SellerLeadQuery;
  get(): Promise<{ docs: Array<{ id: string; data(): Record<string, unknown> }> }>;
}

function receivedAtMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") { const parsed = Date.parse(value); return Number.isFinite(parsed) ? parsed : 0; }
  if (value && typeof value === "object") {
    const timestamp = value as { toMillis?: () => number; toDate?: () => Date };
    if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
    if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  }
  return 0;
}

/**
 * Query seller forms and seller-tagged G leads independently. Filtering
 * fields.role === seller happens in Firestore BEFORE limit(), so general
 * concierge traffic cannot crowd genuine seller submissions out of review.
 */
export async function queryRecentSellerLeadRows(collection: SellerLeadQuery, limit: number) {
  const bounded = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const [sellerForms, sellerGLeads] = await Promise.all([
    collection.where("form", "in", ["ocg-seller-intake", "ocg-seller-action"])
      .orderBy("receivedAt", "desc").limit(bounded).get(),
    collection.where("form", "==", "ocg-g-lead")
      .where("fields.role", "==", "seller")
      .orderBy("receivedAt", "desc").limit(bounded).get(),
  ]);
  return [...sellerForms.docs, ...sellerGLeads.docs]
    .sort((a, b) => receivedAtMillis(b.data().receivedAt) - receivedAtMillis(a.data().receivedAt))
    .slice(0, bounded)
    .map((doc) => ({ id: doc.id, data: doc.data() }));
}
