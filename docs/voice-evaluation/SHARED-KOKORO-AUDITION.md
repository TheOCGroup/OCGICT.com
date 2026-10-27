# OCG Shared Voice Audition — G / Aiden / Piper / TED / ORION

Status: DESIGN AND AUDITION PLAN ONLY. No model installed, no audio generated, no voice changed, and no paid provider activated.

## Architecture
One independently deployed Kokoro inference service, multiple isolated agent profiles. Keep dialogue intelligence, microphone ASR, endpointing, real-time session state, and barge-in separate from TTS. Reuse proven Aiden voice lifecycle behaviors with no changes to Aiden live settings until QA certification.

## Proposed audition profiles (not selections)
- G: American male `am_michael`, alternate `am_adam`; Spanish `em_alex` candidate
- Aiden: American male `am_adam`, alternate `am_michael`; Spanish `em_alex` candidate
- Piper: American female `af_heart`, alternate `af_bella`; Spanish `ef_dora` candidate
- TED: audition `am_eric` and `am_michael`; do not change personality or role
- ORION: audition `am_puck` and `am_liam`; do not change personality or role

All these are Kokoro voice IDs; actual speaking quality and licensing need verification for the specific distributed files. Retain each agent's existing voice as rollback. Avoid voice identity collisions when agents appear in the same workflow.

## Required quality gates
1. Compare samples at matched loudness: 15s intro, 60s real estate talk, proper names, English, Spanish, numbers/currency/addresses.
2. Measure first-audio latency and p50/p95 across 20 utterances on target hardware. Set acceptance thresholds based on current Aiden baseline, not guesswork.
3. Prove user interruption in mid-sentence; no speech overlap, stale response, orphaned restart, or unmuted playback.
4. Prove 10 consecutive turn exchanges, network recovery, muted microphone, and background/resume.
5. Independent listening QA: G male, Piper female; other roles retain accepted identities. Founder approves audible quality before replacing any live profile.
6. Verify multilingual transcription and text intelligence separately: TTS does not fix English-only answers.
7. Per-agent rollout flags, device/browser tests, logs scrubbed of voice transcripts/PII, instant rollback.

## Costs and deployment
Kokoro is a permissively licensed model, but hosting and compute are not free. Do not promise zero operational cost. Evaluate local CPU inference first, then hosted infrastructure only with cost authorization. Docker CLI exists locally but engine was not running at time of audit; Python 3.13 available, GPU unverified. Do not publish a local TTS endpoint or open ports without auth and TLS.

## Repo boundaries
This file lives in OCGICT only as an evaluation artifact; do not edit Aiden/Piper/TED/ORION repositories until ownership and active worktrees are reconciled. Never deploy this experiment to production.
