# G Voice Transformation — 2026-10-22

Founder directive: Supertonic 3 is G's primary voice candidate, Kokoro is
the comparison baseline and rollback, Piper is a fallback subject to
per-voice licensing, Fish Audio Drama 3 is a research reference only
(no paid activation). G only — no other agent's configuration changes.

## What shipped on this branch

1. **Engine extension in the shared service** (`ocg-voice`, contract
   `ocg-tts/v1`, backward compatible): requests may carry
   `"engine": "supertonic"`; omitting it selects Kokoro exactly as
   before. Voice and language are validated per engine; the Supertonic
   engine is enabled per deployment with `OCG_TTS_SUPERTONIC=1` and
   loads lazily. Responses carry `X-OCG-Engine`.
2. **G's profile** (`server/voice/gProfile.ts`): adds G's Supertonic
   selection (`M1` English + Spanish audition default) and the engine
   switch `OCG_G_TTS_ENGINE`. Unset or any other value keeps Kokoro —
   rollback is an env change, not a deploy.
3. **G's expression layer** (`server/voice/gExpression.ts`): separates
   content from delivery. Replies are classified by intent (greeting,
   question, explanation, confirmation, sensitive, closing, statement;
   the chat layer may hint), rewritten into spoken form (numbers,
   currency, percents, times, phone numbers digit-by-digit, Wichita
   street addresses — in English and Spanish), then delivered as
   per-segment synthesis at intent-paced speeds with real silence
   between sentences (`server/voice/wavStitch.ts`). No performance
   instruction text is ever inserted into what is spoken; speeds stay
   within 0.93–1.03.
4. **Spanish end-to-end fix**: the local chat engine previously answered
   Spanish in English. It now detects Spanish conservatively and
   answers in Spanish across the core flows (greeting, seller,
   inheritance with intake, investor, about, 70%-rule with the
   visitor's own numbers, short follow-ups in context).
5. **Client**: `GKokoroSpeech.speak` accepts `{ expressive, intent }`;
   `GExperience` requests expressive delivery for Kokoro-path replies.
   Interruption behavior is unchanged (stop = abort fetch + pause +
   revoke, before listening re-arms).

## Enabling (staging only — production stays as-is until the founder picks a voice)

- Deploy the `ocg-voice` service with `OCG_TTS_SUPERTONIC=1`.
- Site env: `OCG_KOKORO_TTS_URL`, `OCG_KOKORO_TTS_KEY`,
  `OCG_G_KOKORO_TTS_ENABLED=true`, and `OCG_G_TTS_ENGINE=supertonic`
  for the Supertonic candidate (omit for the Kokoro baseline).

## Evidence

- Audition samples, latency/interruption drill results, and the
  certification record are delivered with the mission's final package
  (goal files: `g-voice-transformation/`).
- Suites: OCGICT vitest (incl. new `gExpression` and `gSpanishChat`
  suites), `ocg-voice` contract tests (Kokoro v1 checks + Supertonic
  engine checks).

## Not changed

- Production site and G's live configuration (Vapi gated off, browser
  voice labeled) — untouched.
- Aiden, Piper, TED, ORION — no repositories modified.
- No billable service activated. Fish Audio remains research-only.
