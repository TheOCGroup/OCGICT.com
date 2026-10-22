/** Low-confidence interaction signals are never used to label a person or store transcripts. */
export class GAbuseGuard {
  private static recent = new Map<string, { fingerprint: string; repeated: number; expires: number }>();
  static assess(sessionId: string, message: string, now = Date.now()): "allow" | "slow_down" {
    if (!sessionId || sessionId.length > 128) return "allow";
    if (this.recent.size > 3000) {
      this.recent.forEach((value, key) => { if (value.expires < now) this.recent.delete(key); });
      if (this.recent.size > 3000) this.recent.delete(this.recent.keys().next().value!);
    }
    // Counts exact repeated payloads only. Do not record raw text, addresses or contact details.
    // A short normal conversational response ('yes', an address) is never flagged.
    const normalized = message.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized.length < 80) return "allow";
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) hash = Math.imul(hash ^ normalized.charCodeAt(i), 16777619);
    const fingerprint = (hash >>> 0).toString(16);
    const previous = this.recent.get(sessionId);
    const repeated = previous && previous.expires > now && previous.fingerprint === fingerprint ? previous.repeated + 1 : 1;
    this.recent.set(sessionId, { fingerprint, repeated, expires: now + 120000 });
    return repeated >= 5 ? "slow_down" : "allow";
  }
}

