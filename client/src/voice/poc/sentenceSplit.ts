/**
 * Incremental sentence segmenter for streamed replies: feed token deltas,
 * receive complete speakable segments as soon as they are known, so the
 * first sentence can be synthesized and played while the model is still
 * generating the rest. A long sentence is cut at a clause boundary once
 * it passes the soft cap, keeping first-audio latency bounded; the final
 * remainder comes from flush() when the stream ends.
 */
const SENTENCE_END = /[.!?…]["')\]]?\s+/;
const CLAUSE_END = /[,;:]\s+$/;

export class SentenceSegmenter {
  private buffer = "";
  private readonly minChars: number;
  private readonly softCap: number;

  constructor(opts: { minChars?: number; softCap?: number } = {}) {
    this.minChars = opts.minChars ?? 12;
    this.softCap = opts.softCap ?? 160;
  }

  push(delta: string): string[] {
    this.buffer += delta;
    const out: string[] = [];
    for (;;) {
      const seg = this.takeSegment();
      if (!seg) break;
      out.push(seg);
    }
    return out;
  }

  flush(): string | null {
    const rest = this.buffer.trim();
    this.buffer = "";
    return rest ? rest : null;
  }

  private takeSegment(): string | null {
    const buf = this.buffer;
    // Sentence boundary: the first ender already followed by whitespace
    // (the whitespace proves the sentence ended — it arrives with the
    // next token). Cut there once the segment is long enough to speak.
    const m = SENTENCE_END.exec(buf);
    if (m && m.index + m[0].length >= this.minChars) {
      const end = m.index + m[0].length;
      const seg = buf.slice(0, end).trim();
      this.buffer = buf.slice(end);
      return seg || null;
    }
    if (buf.length >= this.softCap) {
      // Clause cut: last clause boundary before the cap, else last space.
      const head = buf.slice(0, this.softCap);
      const clause = head.lastIndexOf(", ") >= this.minChars ? head.lastIndexOf(", ") + 1
        : head.lastIndexOf("; ") >= this.minChars ? head.lastIndexOf("; ") + 1
        : head.lastIndexOf(" ");
      if (clause >= this.minChars) {
        const seg = buf.slice(0, clause).trim();
        this.buffer = buf.slice(clause);
        return seg || null;
      }
    }
    return null;
  }
}
