/**
 * G's voice profile — G's own data, in G's own repository (OCGICT.com).
 *
 * There is only one G, and he belongs exclusively to OCGICT.com. The
 * other OCG agents keep their profiles in their own canonical products
 * (Aiden: bryan-os surfaces; Piper: PIPELINE; TED: OCG LAB; ORION: OCG
 * MEDIA/nova). The shared Kokoro inference service and the canonical
 * profile types live in the standalone ocg-voice repository (contract
 * ocg-tts/v1); this file holds only G's selection.
 *
 * The voice selections are AUDITION CANDIDATES. They do not replace G's
 * live providers until the founder approves audible quality and flips
 * G's rollout flag.
 *
 * PROMOTION RULE (TED experience review, 2026-10-21): G's alternate
 * (am_adam) is another agent's primary. No alternate may be promoted to
 * a primary until primary-voice uniqueness is re-verified across all
 * five profiles and any displaced agent is re-auditioned.
 */

export interface GVoiceProfile {
  /** Kokoro voice id for American English (primary candidate). */
  enVoice: string;
  /** Kokoro voice id auditioned as the alternate. */
  enAlternate: string;
  /** Kokoro voice id for Spanish. */
  esVoice: string;
  speed: number;
  /** The provider G uses today; preserved as fallback/rollback. */
  fallbackProvider: "vapi-realtime";
  /** G's rollout switch. Default OFF; flipping is founder-gated. */
  rolloutEnv: "OCG_G_KOKORO_TTS_ENABLED";
}

export const G_VOICE_PROFILE: GVoiceProfile = {
  enVoice: "am_michael",
  enAlternate: "am_adam",
  esVoice: "em_alex",
  speed: 1.0,
  fallbackProvider: "vapi-realtime",
  rolloutEnv: "OCG_G_KOKORO_TTS_ENABLED",
};

export function gVoiceProfile(): GVoiceProfile {
  return G_VOICE_PROFILE;
}

/** Pick the voice for a language: Spanish uses the es voice; everything else the EN primary. */
export function voiceForLanguage(profile: GVoiceProfile, lang: string): { voice: string; serviceLang: string } {
  if (lang.toLowerCase().startsWith("es")) return { voice: profile.esVoice, serviceLang: "es" };
  return { voice: profile.enVoice, serviceLang: "en-us" };
}

export function rolloutEnabled(profile: GVoiceProfile, env: Record<string, string | undefined>): boolean {
  return env[profile.rolloutEnv] === "true";
}
