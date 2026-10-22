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
}

export const VOICE_VARIANTS: Record<VoiceVariant["key"], VoiceVariant> = {
  fp32: {
    key: "fp32",
    label: "M1 full (398 MB)",
    sizeMB: 398,
    cacheName: "ocg-voice-assets-v1",
  },
  balanced: {
    key: "balanced",
    label: "M1 balanced (182 MB)",
    sizeMB: 182,
    assetBase: "/voice-models/balanced",
    cacheName: "ocg-voice-assets-balanced-v1",
  },
};

export function resolveVoiceVariant(
  loc: { search: string } | undefined = typeof location !== "undefined" ? location : undefined,
  store: { getItem: (k: string) => string | null } | undefined =
    typeof localStorage !== "undefined" ? localStorage : undefined,
): VoiceVariant {
  try {
    const q = loc ? new URLSearchParams(loc.search).get("voiceVariant") : null;
    const saved = store?.getItem("ocg-g-voice-variant");
    if (q === "balanced" || saved === "balanced") return VOICE_VARIANTS.balanced;
  } catch { /* fall through to default */ }
  return VOICE_VARIANTS.fp32;
}
