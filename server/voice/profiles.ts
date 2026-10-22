/**
 * OCG shared voice profiles — one Kokoro inference service, many isolated
 * agent identities. Profiles are data, not code paths: each agent keeps
 * its own personality, prompts, permissions, and rollout flag, and every
 * profile names its previous provider as the rollback target.
 *
 * Voice selections are AUDITION CANDIDATES (see
 * docs/voice-evaluation/SHARED-KOKORO-AUDITION.md). No profile here
 * replaces a live accepted voice until the founder approves audible
 * quality and the agent's own lane flips its rollout flag.
 *
 * PROMOTION RULE (TED experience review, 2026-10-21): alternates
 * intentionally collide with other agents' primaries (am_adam is
 * Aiden's primary and G's alternate; am_michael is G's primary and the
 * Aiden/TED alternate). No alternate may be promoted to a primary
 * until primary-voice uniqueness is re-verified across all five
 * profiles and any displaced agent is re-auditioned.
 */

export interface AgentVoiceProfile {
  agentId: "g" | "aiden" | "piper" | "ted" | "orion";
  /** Kokoro voice id for American English (primary candidate). */
  enVoice: string;
  /** Kokoro voice id auditioned as the alternate. */
  enAlternate: string;
  /** Kokoro voice id for Spanish. */
  esVoice: string;
  speed: number;
  /** The provider this agent uses today; preserved as fallback/rollback. */
  fallbackProvider: "vapi-realtime" | "gemini-live" | "browser-speech" | "voice-core";
  /** Per-agent rollout switch. All default OFF; flipping is the agent lane's call. */
  rolloutEnv: string;
}

export const AGENT_VOICE_PROFILES: Record<AgentVoiceProfile["agentId"], AgentVoiceProfile> = {
  g: {
    agentId: "g",
    enVoice: "am_michael",
    enAlternate: "am_adam",
    esVoice: "em_alex",
    speed: 1.0,
    fallbackProvider: "vapi-realtime",
    rolloutEnv: "OCG_G_KOKORO_TTS_ENABLED",
  },
  aiden: {
    agentId: "aiden",
    enVoice: "am_adam",
    enAlternate: "am_michael",
    esVoice: "em_alex",
    speed: 1.0,
    // Aiden's live Vapi configuration is frozen; Kokoro is a candidate for
    // his web surfaces only, never a silent telephony change.
    fallbackProvider: "vapi-realtime",
    rolloutEnv: "OCG_AIDEN_KOKORO_TTS_ENABLED",
  },
  piper: {
    agentId: "piper",
    enVoice: "af_heart",
    enAlternate: "af_bella",
    esVoice: "ef_dora",
    speed: 1.0,
    fallbackProvider: "gemini-live",
    rolloutEnv: "OCG_PIPER_KOKORO_TTS_ENABLED",
  },
  ted: {
    agentId: "ted",
    enVoice: "am_eric",
    enAlternate: "am_michael",
    esVoice: "em_alex",
    speed: 1.0,
    fallbackProvider: "voice-core",
    rolloutEnv: "OCG_TED_KOKORO_TTS_ENABLED",
  },
  orion: {
    agentId: "orion",
    enVoice: "am_puck",
    enAlternate: "am_liam",
    esVoice: "em_alex",
    speed: 1.0,
    fallbackProvider: "vapi-realtime",
    rolloutEnv: "OCG_ORION_KOKORO_TTS_ENABLED",
  },
};

/** Every Kokoro voice id referenced by any profile (audition set). */
export function auditionVoiceIds(): string[] {
  const ids = new Set<string>();
  for (const p of Object.values(AGENT_VOICE_PROFILES)) {
    ids.add(p.enVoice);
    ids.add(p.enAlternate);
    ids.add(p.esVoice);
  }
  return Array.from(ids).sort();
}

export function profileFor(agentId: string): AgentVoiceProfile | null {
  return (AGENT_VOICE_PROFILES as Record<string, AgentVoiceProfile>)[agentId] ?? null;
}

/** Pick the voice for a language: Spanish profiles use the es voice; everything else the EN primary. */
export function voiceForLanguage(profile: AgentVoiceProfile, lang: string): { voice: string; serviceLang: string } {
  if (lang.toLowerCase().startsWith("es")) return { voice: profile.esVoice, serviceLang: "es" };
  return { voice: profile.enVoice, serviceLang: "en-us" };
}

export function rolloutEnabled(profile: AgentVoiceProfile, env: Record<string, string | undefined>): boolean {
  return env[profile.rolloutEnv] === "true";
}
