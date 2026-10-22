# OCG Shared Voice — Implementation Record (Kokoro evaluation branch)

Status: IMPLEMENTED on `experiment/shared-kokoro-voice-audition` for
evaluation and staged rollout. Nothing here changes a live voice.
Production G (main, PR #13) is untouched by this branch; Aiden's live
Vapi configuration is untouched everywhere.

## What exists today (reconciled 2026-10-21)

| Agent | Current voice path | Source of truth |
|---|---|---|
| G | Vapi realtime (primary, founder-gated off) + local chat + labeled basic browser speech | OCGICT.com production (verified live) |
| Aiden | Vapi assistant v29 (LIVE, frozen by founder rule) + Gemini Live web client (Agent Workspace) | Vapi dashboard inspection; ONCALL voice baseline doc |
| Piper | Gemini Live voice in the agent-floor client (Sulafat profile) inside PIPELINE | Implementation record 2026-10-15 |
| TED | Provider-independent voice core (`voiceCore.ts`: VoiceProvider contract + session, web-speech provider, turn detection) in OCG LAB | Implementation record 2026-10-02 |
| ORION | Vapi "ORION - OCG MEDIA Voice" v3 (Published) | Vapi dashboard inspection |

## Architecture (one service, isolated profiles)

- `services/kokoro-tts/` — the single Kokoro inference service
  (FastAPI + kokoro-onnx, Docker image, key-authenticated, no transcript
  logging). Endpoints: `/health`, `/voices`, `/tts`, `/tts/stream`
  (sentence-chunked, length-prefixed WAV).
- `server/voice/profiles.ts` — the five agent profiles as data:
  primary/alternate EN voices, Spanish voices, speed, the current
  provider preserved as fallback, and a **per-agent rollout env flag**
  (all default off; one agent's flag never enables another).
- `server/voice/voiceProvider.ts` — the provider contract (mirrors the
  shape of TED's existing VoiceProvider core) + the Kokoro HTTP client.
  Server-side only; the service key never reaches a browser.
- Synthesis is metered: G's endpoint consumes the persistent daily
  `tts` budget (default 300/day, hard ceiling 5000) and fails closed.

## G integration (this repo, flag-gated)

- `netlify/functions/g-tts.mts` — `POST /api/g/tts`: rollout flag +
  service config gate → text validation → budget → synthesize with G's
  profile voice (EN `am_michael`, ES `em_alex`). `GET` reports
  availability only.
- `client/src/voice/gKokoroSpeech.ts` — playback client (Blob URL +
  HTMLAudioElement; stop = pause + revoke, so interruption is real).
- `GExperience.tsx` — when Kokoro is available, spoken replies use it;
  every stop path (Talk toggle, typing interrupt, listening re-arm,
  unmount, widget close) halts Kokoro playback too. The UI labels the
  three modes distinctly: "Realtime voice" / "Kokoro voice" / "Basic
  browser voice". Any Kokoro failure falls back per-reply to the basic
  browser voice; realtime Vapi remains the primary path when enabled.

## Per-agent adoption (other lanes, unchanged repos)

Each agent adopts the same contract without this branch editing its repo:

1. Point a server-side `KokoroHttpProvider` at the shared service
   (`OCG_KOKORO_TTS_URL` / `OCG_KOKORO_TTS_KEY`).
2. Take its profile from `server/voice/profiles.ts` (single source).
3. Synthesize spoken replies through the provider; keep the existing
   provider wired as fallback behind the agent's own rollout flag
   (`OCG_<AGENT>_KOKORO_TTS_ENABLED`).
4. Aiden telephony is excluded: his live Vapi assistant, number, and
   routing are frozen; Kokoro candidates apply to web surfaces only
   after founder listening approval.

Rollback for every agent = flip its rollout flag off; the previous
provider path is never removed by this layer.

## Hypotheses under test

- H1: Kokoro-82M quality is at or above the current browser/Gemini
  spoken paths for OCG scripts (founder/TED listening verdict — pending).
- H2: Self-hosted CPU inference is fast enough for conversational
  replies with sentence streaming (measured — see MEASUREMENTS.md;
  this sandbox's 2 shared vCPUs are contention-bound and are NOT the
  target hardware).
- H3: Per-minute cost ≈ compute only (no per-call API fees); the
  binding constraint is CPU throughput per concurrent speaker.

## QA correction cycle (2026-10-21, after QUINCEY PASS WITH NOTES + TED review)

- QUINCEY U1: MEASUREMENTS.md per-voice RTF attribution corrected
  (weighted minimum is am_michael 1.35; ef_dora max 2.36).
- QUINCEY U2: `GET /api/g/tts` now consults the tts budget when the
  gate is open, mirroring the voice-session status endpoint.
- QUINCEY U3: the Kokoro service validates `lang` against its
  supported set and returns 400 instead of an unhandled 500.
- QUINCEY U5: the service docstring now states that logs carry an
  8-char text-hash prefix as a correlation aid.
- QUINCEY U4 (known limitation, recorded not fixed): the client picks
  the synthesis language from a reply-text heuristic; a real language
  signal from the dialogue layer should replace it before rollout.
- TED 3-A: the engine name never appears on the visitor surface —
  the mode is labeled "OCG voice (preview)" everywhere a visitor can
  see it (code/docs keep the Kokoro name).
- TED 3-B: duplicated bilingual claim removed from the realtime banner.
- TED 4-A: a Kokoro failure no longer swaps engines silently — the
  status line says that reply used the basic browser voice.
- TED 4-B: "G is about to speak…" covers the synthesis wait.
- TED 4-C: the widget button that ends the voice session is labeled
  "Stop voice", not "Mute" (Mute is the realtime mic toggle only).
- TED 6-A: MEASUREMENTS.md no longer implies int8 listening pairs
  exist; int8 was benchmarked for speed only.
- TED 2-A: the alternate-promotion uniqueness rule is recorded in
  `server/voice/profiles.ts`.

## Boundaries kept

- No paid service activated; no live voice replaced; no other repo
  edited; the experiment is never deployed to production (previews only).
- Founder approves audible quality before any live profile changes.
