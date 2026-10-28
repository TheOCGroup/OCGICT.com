/**
 * POC speech player: plays server-synthesized sentences (Gemini TTS via
 * /api/g/tts-gemini) strictly in order. The next sentence is fetched
 * while the current one plays, so playback is gapless when synthesis is
 * faster than speech. stop() — the interruption path — clears the queue,
 * aborts the in-flight fetch, and silences the current audio immediately;
 * a generation counter makes stale completions harmless.
 */
export interface PocSpeechCallbacks {
  /** First audio of a reply actually started playing. */
  onStart?: () => void;
  /** Queue empty and playback finished after finish() was called. */
  onDrained?: () => void;
  /** A sentence could not be synthesized or played. */
  onError?: (err: unknown) => void;
}

interface QueueItem {
  text: string;
  gen: number;
  audioPromise: Promise<Blob>;
}

export class PocSpeechPlayer {
  private queue: QueueItem[] = [];
  private playing = false;
  private finished = false;
  private started = false;
  private gen = 0;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private fetchAbort: AbortController | null = null;
  private cb: PocSpeechCallbacks = {};

  constructor(cb: PocSpeechCallbacks = {}) {
    this.cb = cb;
  }

  /** Begin a new reply: any previous reply's audio is abandoned. */
  begin(cb?: PocSpeechCallbacks) {
    this.stop();
    if (cb) this.cb = cb;
    this.finished = false;
    this.started = false;
  }

  enqueue(text: string) {
    const clean = text.replace(/https?:\/\/\S+/g, "a link").replace(/[*_#`]/g, "").trim();
    if (!clean) return;
    const gen = this.gen;
    const controller = new AbortController();
    this.fetchAbort = controller;
    const audioPromise = fetch("/api/g/tts-gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ text: clean.slice(0, 600) }),
    }).then((res) => {
      if (!res.ok) throw new Error(`tts-gemini HTTP ${res.status}`);
      return res.blob();
    });
    // Prefetch errors surface when the item reaches the head of the
    // queue; swallow here so an unplayed item never logs unhandled.
    audioPromise.catch(() => undefined);
    this.queue.push({ text: clean, gen, audioPromise });
    void this.pump();
  }

  /** No more sentences are coming for this reply. */
  finish() {
    this.finished = true;
    this.maybeDrained();
  }

  stop() {
    this.gen += 1;
    this.queue = [];
    this.playing = false;
    this.fetchAbort?.abort();
    this.fetchAbort = null;
    if (this.currentAudio) {
      try { this.currentAudio.pause(); } catch { /* already stopped */ }
      this.currentAudio = null;
    }
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }

  private async pump(): Promise<void> {
    if (this.playing) return;
    const item = this.queue.shift();
    if (!item) {
      this.maybeDrained();
      return;
    }
    this.playing = true;
    try {
      const blob = await item.audioPromise;
      if (item.gen !== this.gen) return; // superseded while fetching
      const url = URL.createObjectURL(blob);
      this.currentUrl = url;
      const audio = new Audio(url);
      this.currentAudio = audio;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("audio playback failed"));
        audio.play().then(() => {
          if (!this.started) {
            this.started = true;
            this.cb.onStart?.();
          }
        }).catch(reject);
      });
      if (this.currentUrl === url) {
        URL.revokeObjectURL(url);
        this.currentUrl = null;
      }
      this.currentAudio = null;
    } catch (err) {
      if (item.gen === this.gen) this.cb.onError?.(err);
    } finally {
      this.playing = false;
      if (item.gen === this.gen) void this.pump();
      else this.maybeDrained();
    }
  }

  private maybeDrained() {
    if (this.finished && !this.playing && this.queue.length === 0 && this.started) {
      this.finished = false; // fire once per reply
      this.cb.onDrained?.();
    }
  }
}
