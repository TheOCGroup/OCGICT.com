/**
 * First-audio deadline gate for the on-device voice.
 *
 * EVERY spoken reply gets a deadline, cold or warm (founder latency
 * directive, 2026-10-23): if the provider has not reported onStart
 * within the budget, the caller falls this reply through to the
 * fallback cascade with an honest notice, while the engine keeps
 * preparing in the background. The caller picks the budget — longer
 * while the engine is still loading (a one-time model download is
 * legitimately slow), shorter once warm, because a warm stall is a
 * defect, not a download. Worker-call timeouts remain the outer
 * bound for the synthesis jobs themselves.
 *
 * History: this logic previously lived inline in GExperience behind
 * a `clearDeadline` helper whose body a blanket rename turned into
 * infinite recursion (QUINCEY P0 catch, 2026-10-23). It lives here,
 * small and dependency-free, so the callbacks are executed by unit
 * tests — not merely string-matched.
 */
export interface FirstAudioGate {
  /** The provider started speaking: disarm permanently. */
  markStarted(): void;
  /** Disarm without firing (reply ended, errored, or was superseded). */
  clear(): void;
}

export function armFirstAudioDeadline(opts: {
  timeoutMs: number;
  onTimeout: () => void;
}): FirstAudioGate {
  let started = false;
  let cleared = false;
  const timer = setTimeout(() => {
    if (!started && !cleared) opts.onTimeout();
  }, opts.timeoutMs);
  return {
    markStarted() {
      started = true;
      clearTimeout(timer);
    },
    clear() {
      cleared = true;
      clearTimeout(timer);
    },
  };
}
