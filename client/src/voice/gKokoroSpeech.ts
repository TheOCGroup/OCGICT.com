/**
 * G Kokoro speech — plays G's replies as audio synthesized by the shared,
 * self-hosted Kokoro service (via the server-side /api/g/tts gate) instead
 * of the browser's built-in speech synthesis.
 *
 * Playback is a plain HTMLAudioElement over a Blob URL: stopping is
 * immediate (pause + revoke), which is what makes interruption honest —
 * when the visitor talks or types, playback halts before listening
 * re-arms. If the endpoint is disabled, unconfigured, over budget, or
 * errors, `speak` reports the failure and the caller falls back to the
 * labeled basic browser voice for that reply.
 */

export interface KokoroSpeechEvents {
  onStart: () => void;
  onEnd: () => void;
  onError: (detail: string) => void;
}

export class GKokoroSpeech {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private controller: AbortController | null = null;
  private generation = 0;

  /** Probe the server gate once; true only when Kokoro replies are enabled. */
  static async probe(signal?: AbortSignal): Promise<boolean> {
    try {
      const res = await fetch("/api/g/tts", { method: "GET", signal });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return data.enabled === true;
    } catch {
      return false;
    }
  }

  get isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused && !this.audio.ended;
  }

  async speak(text: string, lang: string, events: KokoroSpeechEvents): Promise<void> {
    this.stop();
    const gen = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    try {
      const res = await fetch("/api/g/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kokoro voice is unavailable right now.");
      }
      const blob = await res.blob();
      if (gen !== this.generation) return; // stopped while fetching
      const url = URL.createObjectURL(blob);
      this.objectUrl = url;
      const audio = new Audio(url);
      this.audio = audio;
      audio.onplay = () => { if (gen === this.generation) events.onStart(); };
      audio.onended = () => {
        if (gen !== this.generation) return;
        this.cleanup();
        events.onEnd();
      };
      audio.onerror = () => {
        if (gen !== this.generation) return;
        this.cleanup();
        events.onError("Voice playback failed.");
      };
      await audio.play();
    } catch (err) {
      if (gen !== this.generation) return; // aborted by stop()
      this.cleanup();
      events.onError(err instanceof Error ? err.message : "Kokoro voice is unavailable right now.");
    }
  }

  stop(): void {
    this.generation += 1;
    try { this.controller?.abort(); } catch { /* already aborted */ }
    this.controller = null;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.audio) {
      try { this.audio.pause(); } catch { /* already stopped */ }
      this.audio.removeAttribute("src");
      this.audio = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
