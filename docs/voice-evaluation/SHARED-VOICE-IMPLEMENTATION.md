# OCG Shared Voice — Implementation Record

Status: RESTRUCTURED 2026-10-21 per the founder ownership decision.
Nothing here changes a live voice. Production G (main, PR #13) is
untouched by this branch; Aiden's live Vapi configuration is untouched
everywhere.

## Ownership model (FINAL)

| Component | Canonical owner |
|---|---|
| Kokoro inference service | Standalone `ocg-voice` repository (shared OCG voice infrastructure) |
| G voice + integration | OCGICT.com (this repo) |
| Aiden voice + integration | Aiden's canonical surfaces (`TheOCGroup/bryan-os`) |
| Piper voice + integration | PIPELINE (`TheOCGroup/PIPELINE`) |
| TED voice + integration | OCG LAB (`TheOCGroup/ocg-lab-site`) |
| ORION voice + integration | OCG MEDIA (`TheOCGroup/nova`) |

G is not the hub. There is only one G, and he belongs exclusively to
OCGICT.com. The shared service is product-agnostic; each product keeps
its own voice profile and rollout flag in its own repository and calls
the service with its own caller key.

## Where the evaluation originally lived (traceability)

The evaluation was staged on this branch through commit `d21cd79`
(implementation) and `6573028` (QUINCEY/TED correction cycle): the
service under `services/kokoro-tts/`, all five profiles in
`server/voice/profiles.ts`. The 2026-10-21 restructure commit extracts
and relocates those pieces as below — no evidence, tests, or QA
findings were discarded (audition samples + manifest and measurements
remain in the evaluation evidence set; see MEASUREMENTS.md).

## What lives where now

- **ocg-voice repo** (`60656b5` at extraction): `service/` (FastAPI +
  kokoro-onnx, Docker, per-caller keys, per-caller rate limits, `/stats`
  cost observability, contract version in `/health`), `contracts/`
  (HTTP contract `ocg-tts/v1`, canonical TypeScript client + profile
  types, profile JSON schema), `tests/test_contract.py` (17/17 wire
  checks against the real service, incl. Spanish synthesis, streaming
  framing, stream abort, per-caller isolation, rate limiting).
- **This repo (G's adapter only)**: `server/voice/gProfile.ts` (G's
  profile — am_michael / am_adam / em_alex — nothing else),
  `server/voice/voiceProvider.ts` (vendored client, canonical home in
  ocg-voice contracts), `netlify/functions/g-tts.mts` (`POST /api/g/tts`:
  rollout flag + service config gate → validation → persistent daily
  `tts` budget → synthesize), `client/src/voice/gKokoroSpeech.ts`
  (playback; stop = pause + revoke), `GExperience.tsx` wiring with the
  visitor label "OCG voice (preview)" — the engine name never appears
  on the visitor surface (TED ruling).
- **Home-repo profile branches (draft PRs, unmerged)**:
  Piper → PIPELINE `voice/piper-kokoro-profile`; TED → ocg-lab-site
  `voice/ted-kokoro-profile`; ORION → nova `voice/orion-kokoro-profile`;
  Aiden → bryan-os `voice/aiden-kokoro-profile` (web surfaces only;
  telephony frozen).

## Spanish identity (known v1 limitation)

G, Aiden, TED, and ORION all share the same Spanish voice (em_alex) — a
Spanish-speaking caller hears the same voice under different names.
Piper alone has a distinct Spanish voice (ef_dora). Splitting Spanish
identities is a founder decision pending the listening session.

## Rollback

Every agent's existing provider is preserved as its fallback; flipping
that agent's rollout flag off restores it. The shared service is never
in the critical path of a live voice while flags are off.

## QA history (carried from the evaluation)

- QUINCEY PASS WITH NOTES on `d21cd79`; findings U1–U3, U5 fixed in
  `6573028`; U4 (client language heuristic) recorded as a known
  limitation for the dialogue layer to fix before rollout.
- TED: experience design SOUND; audible quality NOT VERIFIED by anyone
  (founder listening session is the gate); visitor-copy rulings applied
  (engine name off the visitor surface, "Stop voice" label, per-reply
  fallback notice, "G is about to speak…" state, alternate-promotion
  uniqueness rule).
- Latency on the evaluation sandbox (2 shared vCPU): first-audio p50
  4.82 s fp32 / 3.83 s int8 — NOT conversational on that hardware.
  Rollout gate: re-run the battery on the target host, p50 ≤ 800 ms.

## Boundaries kept

- No paid service activated; no live voice replaced; the experiment is
  never deployed to production (previews only).
- Founder approves audible quality before any live profile changes.
- Founder action outstanding: create `TheOCGroup/ocg-voice` in the org
  (automation cannot create org repos) so the standalone repo can be
  pushed; deployment/hosting remains a separate founder decision.
