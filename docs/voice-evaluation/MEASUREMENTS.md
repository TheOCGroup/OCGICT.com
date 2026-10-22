# Kokoro evaluation — measurements (2026-10-21)

All numbers below were measured in this sandbox: **2 shared vCPUs,
7 GB RAM, no GPU, heavy multi-tenant contention** (several other agent
lanes were running concurrently). Treat them as a worst-case bound for
the model, not as target-hardware performance. Target-hardware figures
must be re-measured on the host that would actually serve production
before any rollout decision (acceptance thresholds per the audition
plan are set against the Aiden baseline, not against these numbers).

## Runtime

- kokoro-onnx 0.6.1, onnxruntime 1.31, Kokoro-82M v1.0
  (`kokoro-v1.0.onnx` fp32, 325 MB; `kokoro-v1.0.int8.onnx`, 92 MB),
  `voices-v1.0.bin` (54 voices). Model load ≈ 3.1 s.
- All nine audition voice ids exist in the distributed pack:
  am_michael, am_adam, am_eric, am_puck, am_liam, af_heart, af_bella,
  em_alex, ef_dora (+ em_santa sampled as an extra Spanish candidate).
- Licensing: Kokoro-82M weights are Apache-2.0 (commercial use
  permitted); kokoro-onnx is MIT. Hosting/compute is the only cost —
  there are no per-call fees.

## Audition matrix (fp32, matched scripts, loudness-normalized MP3s)

45 files, 653 s of audio, 1,064 s of generation → overall RTF 1.63 on
this sandbox. (RTF is real-time factor: 1.63 means this machine needs
about 1.6 seconds to produce 1 second of speech — slower than real
time.) Per-voice RTF, weighted by audio seconds, ranged 1.35
(am_michael) – 2.36 (ef_dora); longer utterances amortize better
(numbers script ≈ 0.75–1.8) than short ones (up to 3.4). Audio integrity independently checkable:
every file's duration matches its manifest entry, all carry real signal
(no silent or empty files). Scripts: 15 s intro, numbers/currency/
address, ~60 s real-estate talk, short follow-up, empathy passage;
Spanish intro + numbers. Files: `auditions/manifest.json` in the
evaluation evidence set.

## Latency battery (seeded-plan protocol: 20 short utterances, streaming)

| Model | First-chunk p50 | First-chunk p95 | Mean |
|---|---|---|---|
| fp32 | 4.82 s | 10.25 s | 5.87 s |
| int8 | 3.83 s | 6.43 s | 4.41 s |

Single-sentence utterances, so first-chunk == full generation. A
multi-sentence G reply streamed first audio at 3.46 s (fp32) / 4.00 s
(int8) in spot checks. **Verdict for this hardware: not conversational.**
Aiden's cloud baseline answers in well under a second; this sandbox
cannot. The architecture (sentence streaming, per-agent flags) is built
so the same code passes or fails on measured target hardware — the
rollout gate is a re-run of this battery on the production host, with
acceptance at p50 first-audio ≤ 800 ms.

## Cost picture (measured inputs, labeled estimates)

- Per-minute API fees: $0 (open weights, self-hosted).
- Compute: at sandbox RTF 1.63, one CPU core produces ~37 audio-seconds
  per minute; a dedicated modern 4-vCPU host is *expected* (not measured
  here) to run several concurrent speakers at RTF < 0.3. The binding
  production cost is therefore one always-on small host (typical VPS
  $20–$80/mo class — market estimate, not a quote) versus Vapi's
  ≈ $0.10–$0.25/min all-in for G's realtime path. Break-even vs. metered
  realtime is a few hundred voice-minutes per month.
- int8 was benchmarked for speed only (~25% faster first audio, 3.5×
  smaller model); **no int8 listening samples were generated** — the
  audition package is fp32 throughout, so any int8 quality delta is
  unmeasured here. int8 is the better default candidate for CPU
  hosting; fp32 remains the quality reference.

## What was NOT measured here

- Perceptual quality (founder/TED listening verdicts — samples attached
  to the delivery; no machine score is claimed as a substitute).
- Real-device browser playback, microphone barge-in against Kokoro
  playback, and network-drop recovery — these run with the staged
  preview on real hardware (see SHARED-VOICE-IMPLEMENTATION.md).
- GPU inference (no GPU in this sandbox).
