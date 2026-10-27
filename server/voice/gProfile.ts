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

/** Engines the shared ocg-voice service can run (ocg-tts/v1 extension). */
export type GVoiceEngine = "kokoro" | "supertonic";

export interface GVoiceProfile {
  /** Kokoro voice id for American English (primary candidate). */
  enVoice: string;
  /** Kokoro voice id auditioned as the alternate. */
  enAlternate: string;
  /** Kokoro voice id for Spanish. */
  esVoice: string;
  /**
   * Supertonic voice id for English — founder-directed primary candidate
   * (2026-10-22). M1 is the audition default; M2–M5 are auditioned too
   * and the founder's pick replaces this value.
   */
  supertonicEnVoice: string;
  /** Supertonic voice id for Spanish (same id speaks both languages). */
  supertonicEsVoice: string;
  speed: number;
  /** The provider G uses today; preserved as fallback/rollback. */
  fallbackProvider: "vapi-realtime";
  /** G's rollout switch. Default OFF; flipping is founder-gated. */
  rolloutEnv: "OCG_G_KOKORO_TTS_ENABLED";
  /**
   * Engine selection switch: OCG_G_TTS_ENGINE=supertonic selects the
   * Supertonic engine; anything else (including unset) keeps Kokoro,
   * the certified baseline and rollback.
   */
  engineEnv: "OCG_G_TTS_ENGINE";
}

export const G_VOICE_PROFILE: GVoiceProfile = {
  enVoice: "am_michael",
  enAlternate: "am_adam",
  esVoice: "em_alex",
  supertonicEnVoice: "M1",
  supertonicEsVoice: "M1",
  speed: 1.0,
  fallbackProvider: "vapi-realtime",
  rolloutEnv: "OCG_G_KOKORO_TTS_ENABLED",
  engineEnv: "OCG_G_TTS_ENGINE",
};

export function gVoiceProfile(): GVoiceProfile {
  return G_VOICE_PROFILE;
}

/** Pick the voice for a language: Spanish uses the es voice; everything else the EN primary. */
export function voiceForLanguage(profile: GVoiceProfile, lang: string): { voice: string; serviceLang: string } {
  if (lang.toLowerCase().startsWith("es")) return { voice: profile.esVoice, serviceLang: "es" };
  return { voice: profile.enVoice, serviceLang: "en-us" };
}

/** Which engine G asks the shared service for. Default: kokoro (rollback-safe). */
export function engineForEnv(profile: GVoiceProfile, env: Record<string, string | undefined>): GVoiceEngine {
  return env[profile.engineEnv] === "supertonic" ? "supertonic" : "kokoro";
}

/** Voice + service language for a specific engine. */
export function voiceForEngineLanguage(
  profile: GVoiceProfile,
  engine: GVoiceEngine,
  lang: string,
): { voice: string; serviceLang: string } {
  const spanish = lang.toLowerCase().startsWith("es");
  if (engine === "supertonic") {
    return spanish
      ? { voice: profile.supertonicEsVoice, serviceLang: "es" }
      : { voice: profile.supertonicEnVoice, serviceLang: "en" };
  }
  return voiceForLanguage(profile, lang);
}

export function rolloutEnabled(profile: GVoiceProfile, env: Record<string, string | undefined>): boolean {
  return env[profile.rolloutEnv] === "true";
}
