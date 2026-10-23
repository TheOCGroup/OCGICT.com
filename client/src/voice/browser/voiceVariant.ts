/**
 * Model variant selection for the OCG browser voice runtime.
 *
 * fp32 is the certified default and the standing rollback: the full
 * Supertonic 3 set served from the public Hugging Face CDN. The
 * balanced set (FP16 estimator/encoder + INT8 vocoder, 181.9 MB,
 * quality-attributed in docs/voice-evaluation) is served same-origin
 * from /voice-models/balanced when that package is deployed; until
 * then, selecting it fails honestly into the normal voice cascade.
 *
 * Selection: `?voiceVariant=balanced` on the page URL, or
 * localStorage `ocg-g-voice-variant` = "balanced". Anything else is
 * fp32. Each variant has its own browser cache namespace so they can
 * coexist and roll back independently.
 */
export interface VoiceVariant {
  key: "fp32" | "balanced";
  label: string;
  sizeMB: number;
  assetBase?: string;
  cacheName: string;
  /** Supertonic voice style (timbre). M1 is the certified default;
   *  M2 is the evaluated alternative selectable for comparison. */
  styleName: string;
}

export const VOICE_VARIANTS: Record<VoiceVariant["key"], VoiceVariant> = {
  fp32: {
    key: "fp32",
    label: "M1 full (398 MB)",
    sizeMB: 398,
    cacheName: "ocg-voice-assets-v1",
    styleName: "M1",
  },
  balanced: {
    key: "balanced",
    label: "M1 balanced (182 MB)",
    sizeMB: 182,
    assetBase: "/voice-models/balanced",
    // v2, not v1: pre-deployment probes of the variant (when the
    // package was not yet hosted) could cache the host's HTML
    // fallback page under v1 (QUINCEY N1) — v2 starts clean.
    cacheName: "ocg-voice-assets-balanced-v2",
    styleName: "M1",
  },
};

export function resolveVoiceVariant(
  loc: { search: string } | undefined = typeof location !== "undefined" ? location : undefined,
  store: { getItem: (k: string) => string | null } | undefined =
    typeof localStorage !== "undefined" ? localStorage : undefined,
): VoiceVariant {
  try {
    const params = loc ? new URLSearchParams(loc.search) : null;
    const q = params?.get("voiceVariant");
    const style = params?.get("voiceStyle");
    const saved = store?.getItem("ocg-g-voice-variant");
    const base = q === "balanced" || saved === "balanced" ? VOICE_VARIANTS.balanced : VOICE_VARIANTS.fp32;
    // Style override is allowlisted to the styles shipped for
    // evaluation (M1 default, M2 alternative). The label follows the
    // style so the on-page diag line never misstates the voice.
    if (style === "M2") {
      return { ...base, styleName: "M2", label: base.label.replace(/^M1/, "M2") };
    }
  } catch { /* fall through to default */ }
  return VOICE_VARIANTS.fp32;
}
