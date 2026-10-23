/**
 * Voice barge-in for G — OCGICT.com only.
 *
 * While G is speaking, a microphone monitor (getUserMedia with echo
 * cancellation, noise suppression and auto-gain control) watches for
 * the VISITOR's voice. When sustained, committed speech is detected,
 * the monitor fires onInterrupt and GExperience stops playback through
 * the same path as the Stop button, then starts listening so the
 * visitor's interruption is actually heard — not talked over.
 *
 * The detector (VadGate) is a pure state machine over per-frame level
 * statistics, deliberately conservative:
 *  - Backchannels ("uh-huh", "mm-hmm") are short and quieter: a burst
 *    must sustain ~240 ms at interruption-level energy to fire.
 *  - Echo: the trigger threshold tracks BOTH an adaptive noise floor
 *    (measured live) and G's own current output level, so G's speech
 *    leaking into the mic must be implausibly loud to self-trigger.
 *    The browser's acoustic echo cancellation is the first line of
 *    defense; this gate is the second.
 *  - Noise (television, room tone) raises the floor rather than the
 *    trigger count: steady noise is absorbed into the floor estimate.
 *
 * Honest limits: this is browser voice-activity detection, not a
 * realtime voice platform. It detects THAT the visitor is speaking and
 * stops G promptly; what the visitor said is then captured by the
 * normal speech-recognition turn. Physical-device behavior (real
 * speakers, real rooms) can only be certified on hardware.
 */

export interface VadFrame {
  /** Root-mean-square level of the mic frame, 0..1. */
  rms: number;
  /** Share of spectral energy in the human voice band (300–3400 Hz), 0..1. */
  voiceRatio: number;
  /** Frame timestamp in milliseconds (any monotonic clock). */
  tMs: number;
}

export interface VadConfig {
  /** Sustained candidate time required to confirm an interruption. */
  confirmMs: number;
  /** Minimum absolute RMS for a candidate frame. */
  minRms: number;
  /** Candidate RMS must exceed noise floor × this factor. */
  floorFactor: number;
  /**
   * Candidate RMS must exceed current playback level × this factor.
   * Calibrated to the RESIDUAL echo expected after the browser's echo
   * cancellation and room attenuation (a small fraction of G's
   * electrical output level), not to the output level itself.
   */
  playbackFactor: number;
  /** Minimum voice-band share for a candidate frame. */
  minVoiceRatio: number;
  /** Allowed dropouts inside a candidate burst. */
  gapToleranceMs: number;
  /** Time after firing before the gate can fire again. */
  cooldownMs: number;
  /**
   * Echo veto: when the mic envelope correlates with G's playback
   * envelope above this Pearson coefficient AND the mic is quieter
   * than echoLevelRatio × playback, the signal is G's own echo —
   * never a candidate, however speech-like it is.
   */
  echoCorrThreshold: number;
  echoLevelRatio: number;
}

export const DEFAULT_VAD_CONFIG: VadConfig = {
  confirmMs: 240,
  minRms: 0.02,
  floorFactor: 3.2,
  playbackFactor: 0.18,
  minVoiceRatio: 0.45,
  gapToleranceMs: 70,
  cooldownMs: 900,
  echoCorrThreshold: 0.8,
  echoLevelRatio: 0.75,
};

export interface VadFire {
  /** When the confirming frame arrived. */
  firedAtMs: number;
  /** When the candidate burst began — interruption-to-silence latency
   *  is measured from here to when playback actually stops. */
  onsetAtMs: number;
}

export class VadGate {
  private cfg: VadConfig;
  private floor = 0.004;
  private candidateStart: number | null = null;
  private lastCandidateMs = 0;
  private cooldownUntil = 0;
  private micHist: number[] = [];
  private pbHist: number[] = [];
  private candidateStartIdx = -1;
  /** Diagnostic counters for the acceptance battery. */
  stats = { frames: 0, candidates: 0, rejectedBursts: 0, fires: 0, echoVetoes: 0 };

  constructor(cfg: Partial<VadConfig> = {}) {
    this.cfg = { ...DEFAULT_VAD_CONFIG, ...cfg };
  }

  get noiseFloor(): number {
    return this.floor;
  }

  reset(): void {
    this.candidateStart = null;
    this.candidateStartIdx = -1;
    this.micHist = [];
    this.pbHist = [];
    this.stats.candidates = 0;
  }

  private static pearson(m: number[], p: number[]): number {
    const n = Math.min(m.length, p.length);
    if (n < 6) return 0;
    const mm = m.reduce((a, b) => a + b, 0) / n;
    const pm = p.reduce((a, b) => a + b, 0) / n;
    let cov = 0, vm = 0, vp = 0;
    for (let i = 0; i < n; i++) {
      cov += (m[i] - mm) * (p[i] - pm);
      vm += (m[i] - mm) ** 2;
      vp += (p[i] - pm) ** 2;
    }
    if (vm < 1e-9 || vp < 1e-9) return 0;
    return cov / Math.sqrt(vm * vp);
  }

  /**
   * Echo test: the mic signal is G's own voice leaking back when its
   * envelope moves WITH the playback envelope — over the recent
   * trailing window, or over the current candidate burst itself (a
   * scaled, slightly delayed copy correlates almost perfectly even
   * over a few hundred milliseconds). Real interruptions have
   * independent envelopes: different words, different pauses.
   */
  private isEcho(frame: VadFrame, playbackLevel: number): boolean {
    const c = this.cfg;
    if (playbackLevel <= 0 || frame.rms >= playbackLevel * c.echoLevelRatio) return false;
    const n = Math.min(this.micHist.length, 32);
    if (n >= 20 && VadGate.pearson(this.micHist.slice(-n), this.pbHist.slice(-n)) > c.echoCorrThreshold) {
      return true;
    }
    if (this.candidateStartIdx >= 0) {
      const m = this.micHist.slice(this.candidateStartIdx);
      const p = this.pbHist.slice(this.candidateStartIdx);
      if (m.length >= 6 && VadGate.pearson(m, p) > 0.85) return true;
    }
    return false;
  }

  /**
   * Feed one frame. Returns a VadFire exactly once per confirmed
   * interruption. `playbackLevel` is G's current output RMS (0 when
   * silent) — the echo guard input.
   */
  feed(frame: VadFrame, playbackLevel = 0): VadFire | null {
    this.stats.frames += 1;
    const c = this.cfg;
    this.micHist.push(frame.rms);
    this.pbHist.push(playbackLevel);
    if (this.micHist.length > 512) { this.micHist.shift(); this.pbHist.shift(); if (this.candidateStartIdx > 0) this.candidateStartIdx -= 1; }

    const echoLocked = this.isEcho(frame, playbackLevel);
    if (echoLocked) this.stats.echoVetoes += 1;

    const threshold = Math.max(
      c.minRms,
      this.floor * c.floorFactor,
      playbackLevel * c.playbackFactor,
    );
    const isCandidate =
      !echoLocked &&
      frame.rms > threshold && frame.voiceRatio >= c.minVoiceRatio && frame.tMs >= this.cooldownUntil;

    if (isCandidate) {
      if (this.candidateStart === null) {
        this.candidateStart = frame.tMs;
        this.candidateStartIdx = this.micHist.length - 1;
        this.stats.candidates += 1;
      }
      this.lastCandidateMs = frame.tMs;
      if (frame.tMs - this.candidateStart >= c.confirmMs) {
        const fire: VadFire = { firedAtMs: frame.tMs, onsetAtMs: this.candidateStart };
        this.candidateStart = null;
        this.candidateStartIdx = -1;
        this.cooldownUntil = frame.tMs + c.cooldownMs;
        this.stats.fires += 1;
        return fire;
      }
      return null;
    }

    // Not a candidate frame. A short burst that dies before confirming
    // was a backchannel or a noise spike — count it, never fire. An
    // echo-vetoed burst ends the same way: it was never the visitor.
    if (this.candidateStart !== null && (echoLocked || frame.tMs - this.lastCandidateMs > c.gapToleranceMs)) {
      this.candidateStart = null;
      this.candidateStartIdx = -1;
      this.stats.rejectedBursts += 1;
    }
    // Adapt the floor toward quiet frames only (never toward speech,
    // never while a candidate is open), and only slowly.
    if (this.candidateStart === null && frame.rms < this.floor * c.floorFactor) {
      this.floor = Math.max(0.0015, this.floor * 0.98 + frame.rms * 0.02);
    }
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Microphone monitor (browser wiring around the gate)               */
/* ------------------------------------------------------------------ */

export interface BargeInMonitorOptions {
  onInterrupt: (fire: VadFire) => void;
  /** G's current output level 0..1 (echo guard input). */
  playbackLevel?: () => number;
  config?: Partial<VadConfig>;
  /** Test seam: supply a MediaStream instead of getUserMedia. */
  stream?: MediaStream;
  /** Diagnostics seam: observe every analyzed frame (off in normal use). */
  onFrame?: (f: { rms: number; voiceRatio: number; playback: number; tMs: number }) => void;
}

export class BargeInMonitor {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private gate: VadGate;
  private armed = false;
  readonly log: Array<{ type: string; atMs: number; onsetAtMs?: number }> = [];

  constructor(private opts: BargeInMonitorOptions) {
    // Explicit construction: field-initializer ordering vs parameter
    // properties differs across transpilers — the gate must never be
    // built from an undefined options object.
    this.gate = new VadGate(opts.config);
  }

  get isArmed(): boolean {
    return this.armed;
  }

  get hasMic(): boolean {
    return this.stream !== null;
  }

  /** Acquire the microphone (echo-cancelled). Resolves false when the
   *  visitor declines or no mic exists — barge-in simply stays off and
   *  every other voice control keeps working. */
  async start(): Promise<boolean> {
    if (this.stream) return true;
    try {
      this.stream =
        this.opts.stream ??
        (await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }));
    } catch {
      return false;
    }
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    // The monitor is created inside a user-gesture chain, but async
    // setup can outlive the gesture window; resume defensively.
    void this.ctx.resume().catch(() => {});
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
    const timeBuf = new Float32Array(this.analyser.fftSize);
    const freqBuf = new Float32Array(this.analyser.frequencyBinCount);
    this.timer = setInterval(() => {
      if (!this.armed || !this.analyser || !this.ctx) return;
      this.analyser.getFloatTimeDomainData(timeBuf);
      let sum = 0;
      for (let i = 0; i < timeBuf.length; i++) sum += timeBuf[i] * timeBuf[i];
      const rms = Math.sqrt(sum / timeBuf.length);
      this.analyser.getFloatFrequencyData(freqBuf);
      const nyquist = this.ctx.sampleRate / 2;
      let voice = 0;
      let total = 0;
      for (let i = 0; i < freqBuf.length; i++) {
        const hz = (i / freqBuf.length) * nyquist;
        const power = Math.pow(10, freqBuf[i] / 10);
        total += power;
        if (hz >= 300 && hz <= 3400) voice += power;
      }
      const playback = this.opts.playbackLevel ? this.opts.playbackLevel() : 0;
      const frame = { rms, voiceRatio: total > 0 ? voice / total : 0, tMs: performance.now() };
      this.opts.onFrame?.({ ...frame, playback });
      const fire = this.gate.feed(frame, playback);
      if (fire) {
        this.log.push({ type: "interrupt", atMs: fire.firedAtMs, onsetAtMs: fire.onsetAtMs });
        this.armed = false;
        this.opts.onInterrupt(fire);
      }
    }, 30);
    return true;
  }

  arm(): void {
    this.gate.reset();
    this.armed = true;
  }

  disarm(): void {
    this.armed = false;
  }

  stop(): void {
    this.armed = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
  }
}
