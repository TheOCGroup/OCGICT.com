/**
 * First-audio deadline gate for the on-device voice (P0 repair).
 *
 * While the engine is not yet ready, a spoken reply must not wait in
 * silence forever for a cold model load: if the provider has not
 * reported onStart within the deadline, the caller falls this reply
 * through to the fallback cascade. Once the engine IS ready, no gate
 * is armed — warm synthesis is bounded by the worker-call timeouts
 * and a slow-but-working engine is never cut off mid-synthesis.
 *
 * QUINCEY delta note (2026-10-23): this logic previously lived inline
 * in GExperience behind a `clearDeadline` helper whose body a blanket
 * rename turned into infinite recursion (`clearDeadline` calling
 * itself), which threw RangeError in every speak callback whenever
 * the deadline was armed. It lives here now, small and dependency-
 * free, so the callbacks are executed by unit tests — not merely
 * string-matched.
 */
export interface FirstAudioGate {
  /** The provider started speaking: disarm permanently. */
  markStarted(): void;
  /** Disarm without firing (reply ended, errored, or was superseded). */
  clear(): void;
}

export function armFirstAudioDeadline(opts: {
  ready: boolean;
  timeoutMs: number;
  onTimeout: () => void;
}): FirstAudioGate {
  if (opts.ready) {
    return { markStarted() {}, clear() {} };
  }
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
