/** Privacy-minimized seller review projection. No raw Firestore fields escape. */
export function projectSellerLeadRows(rows: Array<{ id: string; data: Record<string, unknown> }>) {
  return rows.filter((row) => ["ocg-seller-intake", "ocg-seller-action", "ocg-g-lead"].includes(String(row.data.form || "")))
    .map((row) => {
      const fields = row.data.fields && typeof row.data.fields === "object" && !Array.isArray(row.data.fields)
        ? row.data.fields as Record<string, unknown> : {};
      const safe = (key: string, max: number) => typeof fields[key] === "string" ? String(fields[key]).slice(0, max) : "";
      const receivedAt = row.data.receivedAt as { toDate?: () => Date } | undefined;
      return {
        id: row.id,
        form: String(row.data.form),
        receivedAt: receivedAt && typeof receivedAt.toDate === "function" ? receivedAt.toDate().toISOString() : null,
        reference: safe("reference", 80), name: safe("name", 150),
        address: safe("address", 240), email: safe("email", 254), phone: safe("phone", 40),
        action: safe("action", 40), offerId: safe("offerId", 80),
      };
    });
}