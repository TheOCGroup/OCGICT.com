import { describe, it, expect } from "vitest";
import { VadGate } from "../../client/src/voice/browser/bargeIn";

/** Feed frames at 30 ms intervals; returns fires with their indices. */
function run(
  gate: VadGate,
  frames: Array<{ rms: number; voice: number; playback?: number }>,
  startMs = 0,
) {
  const fires: Array<{ firedAtMs: number; onsetAtMs: number }> = [];
  frames.forEach((f, i) => {
    const fire = gate.feed({ rms: f.rms, voiceRatio: f.voice, tMs: startMs + i * 30 }, f.playback ?? 0);
    if (fire) fires.push(fire);
  });
  return fires;
}

const quiet = (n: number) => Array.from({ length: n }, () => ({ rms: 0.003, voice: 0.2 }));
const speech = (n: number, rms = 0.12) => Array.from({ length: n }, () => ({ rms, voice: 0.8 }));

describe("VadGate — interruption detection", () => {
  it("fires on sustained committed speech and reports the burst onset", () => {
    const gate = new VadGate();
    const fires = run(gate, [...quiet(10), ...speech(20)]);
    expect(fires.length).toBe(1);
    // Onset = first speech frame (index 10 → 300 ms); fire ≈ onset + 240 ms confirm.
    expect(fires[0].onsetAtMs).toBe(300);
    expect(fires[0].firedAtMs - fires[0].onsetAtMs).toBeGreaterThanOrEqual(240);
    expect(fires[0].firedAtMs - fires[0].onsetAtMs).toBeLessThanOrEqual(300);
  });

  it("language does not matter: a Spanish interruption is the same signal", () => {
    const gate = new VadGate();
    const fires = run(gate, [...quiet(5), ...speech(15, 0.1)]);
    expect(fires.length).toBe(1);
  });

  it("respects cooldown after firing", () => {
    const gate = new VadGate();
    const fires = run(gate, [...speech(12), ...quiet(4), ...speech(12)]);
    expect(fires.length).toBe(1);
  });
});

describe("VadGate — backchannel and noise rejection", () => {
  it("does not fire for a short 'uh-huh' burst", () => {
    const gate = new VadGate();
    const uhhuh = Array.from({ length: 5 }, () => ({ rms: 0.07, voice: 0.75 })); // ~150 ms
    const fires = run(gate, [...quiet(10), ...uhhuh, ...quiet(10), ...uhhuh, ...quiet(10)]);
    expect(fires.length).toBe(0);
    expect(gate.stats.rejectedBursts).toBeGreaterThanOrEqual(1);
  });

  it("does not fire for a quiet backchannel burst under loud playback", () => {
    const gate = new VadGate();
    const burst = Array.from({ length: 8 }, () => ({ rms: 0.05, voice: 0.8, playback: 0.09 })); // ~240 ms max, dies out
    const frames = [...burst, ...Array.from({ length: 12 }, () => ({ rms: 0.004, voice: 0.2, playback: 0.09 }))];
    expect(run(gate, frames).length).toBe(0);
  });

  it("absorbs steady television noise into the floor without firing", () => {
    const gate = new VadGate();
    const tv = Array.from({ length: 100 }, () => ({ rms: 0.015, voice: 0.3 }));
    expect(run(gate, tv).length).toBe(0);
    // And real speech over the TV still fires.
    expect(run(gate, speech(15), 100 * 30).length).toBe(1);
  });

  it("ignores a single loud spike (door slam, cough)", () => {
    const gate = new VadGate();
    const frames = [...quiet(5), { rms: 0.4, voice: 0.6 }, ...quiet(10)];
    expect(run(gate, frames).length).toBe(0);
  });
});

describe("VadGate — echo protection", () => {
  it("never fires on G's own echoed speech (envelope-correlated residual)", () => {
    const gate = new VadGate();
    // Mic hears G's output attenuated after echo cancellation: rms
    // tracks the playback envelope at ~60% with full voice-band energy.
    const echo = Array.from({ length: 60 }, (_, i) => {
      const env = 0.1 + 0.05 * Math.sin(i / 3);
      return { rms: env * 0.6, voice: 0.85, playback: env };
    });
    expect(run(gate, echo).length).toBe(0);
    expect(gate.stats.echoVetoes).toBeGreaterThan(0);
  });

  it("still fires when the visitor talks OVER G (louder than the echo guard)", () => {
    const gate = new VadGate();
    const frames = [
      ...Array.from({ length: 10 }, () => ({ rms: 0.06, voice: 0.85, playback: 0.1 })),
      ...Array.from({ length: 15 }, () => ({ rms: 0.22, voice: 0.85, playback: 0.1 })),
    ];
    expect(run(gate, frames).length).toBe(1);
  });
});
