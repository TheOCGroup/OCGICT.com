# OCG Voice Runtime — browser prototype (OCG LAB R&D)

Status: PROTOTYPE on an isolated branch. Nothing here changes
production behavior: the path activates only with `?browserVoice=1`
(or localStorage `ocg-g-browser-voice=1`), loads lazily, and any
failure falls through to the existing cascade (server voice → labeled
basic browser voice).

## What it is

G's replies are synthesized **on the visitor's device** — no voice
server, no per-call cost, no new hosting subscription:

- `client/src/voice/browser/supertonicEngine.ts` — OCG's browser
  inference engine (ONNX Runtime Web, MIT) running the Supertonic 3
  graphs (third-party weights, OpenRAIL-M): unicode text processing →
  duration predictor → text encoder → 8-step flow-matching vector
  estimator → vocoder, 44.1 kHz. Voice identity: **M1**, the founder's
  selected voice, same style tensors for English and Spanish.
- `client/src/voice/browser/gBrowserSpeech.ts` — playback provider:
  runs the reply through the SAME certified expression layer as the
  server path (`planDelivery`: spoken-form numbers/addresses,
  per-intent pacing, real pauses), synthesizes segment by segment
  (sentence-level streaming — first audio after the first segment,
  not the whole reply), and implements the certified stop semantics
  (stop halts the current segment and cancels the queue).
- Model assets (~398 MB fp32) load from the public HuggingFace CDN on
  first use and persist in Cache Storage; repeat visits are warm.
  Netlify bandwidth is not consumed. A self-hosted mirror is possible
  later but metered bandwidth is why the CDN is the default.

## Measured behavior

See `browser-measurements.json` alongside the R&D evidence package
(real Chromium run: cold/warm load, per-line synthesis EN+ES, memory,
WebGPU probe). Sandbox/VM numbers are floors, not product claims;
the acceptance environment is a real visitor device.

## Known limits (stated, not hidden)

- 398 MB first-visit download is heavy; fp16/quantized graphs would
  roughly halve it (the upstream repo ships fp32 only; self-quantizing
  needs a quality re-verification cycle).
- The deploy payload includes the ONNX Runtime Web WASM binary
  (~28 MB static asset) — fetched only when the flag is on.
- WASM multithreading needs cross-origin isolation (COOP/COEP); the
  engine runs single-threaded WASM without it, WebGPU where available.
- Mobile Safari: WASM works; memory pressure on low-end devices is
  the open question the measurement pass must answer honestly.
