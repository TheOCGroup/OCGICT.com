/**
 * Opt-in voice-pipeline trace (latency investigation, 2026-10-23).
 *
 * Enabled only when localStorage "ocg-g-voice-trace" is "1". Stages
 * are pushed to window.__gVoiceTrace with performance.now() stamps so
 * a test harness (or a developer console) can attribute a slow first
 * audio to the exact stage: chat request/response, speak call, model
 * prepare, per-segment synthesis, playback start, deadline, fallback.
 * Disabled by default; costs nothing when off.
 */
export function voiceTrace(stage: string, data?: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    if (window.localStorage?.getItem("ocg-g-voice-trace") !== "1") return;
    const w = window as unknown as { __gVoiceTrace?: Array<Record<string, unknown>> };
    if (!w.__gVoiceTrace) w.__gVoiceTrace = [];
    w.__gVoiceTrace.push({ stage, at: Math.round(performance.now()), ...(data ?? {}) });
  } catch {
    /* tracing must never break speech */
  }
}
