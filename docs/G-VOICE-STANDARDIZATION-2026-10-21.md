# G Voice Standardization — 2026-10-21

G's voice now follows the same shared OCG agent voice architecture as the
other OCG agents, instead of an independent browser-speech implementation.
This document records what was reused, what is G's own, and what remains
gated. It supersedes the voice sections of `G-RELEASE-GATE-2026-10-20.md`.

## Shared layer (reused, not reinvented)

Source of truth: `ONCALL-VOICE-PERFORMANCE-BASELINE-AIDEN-2026-10-21.md`
(the certified Aiden/OCG Receptionist baseline).

| Layer | Shared choice | G's application |
|---|---|---|
| Platform | Vapi | Vapi Web SDK (`@vapi-ai/web`) in the browser; G's OWN assistant |
| Transcription | Deepgram Flux Multilingual, automatic language detection | Multilingual with automatic detection; transcriber object kept bare like Aiden's (no fallback plan, no confidenceThreshold — Maya's extras are a suspect lever). Config default: Deepgram Nova-3 `multi` (creatable verbatim, multilingual); at creation, prefer the account's multilingual Flux string if exposed, for exact Aiden parity — never `flux-general-en` (English-only) |
| Endpointing | LiveKit smart endpointing | Same (`startSpeakingPlan.smartEndpointingPlan.provider = livekit`) |
| Interruption | stopSpeakingPlan `numWords 0, voiceSeconds 0.2, backoffSeconds 0.6`; `firstMessageInterruptionsEnabled=true` | Identical |
| Opening | `firstMessageMode = assistant-speaks-first`, backgroundSound off | Same; G's own first message |
| Turn discipline | One question at a time; explicit EN/ES handling | Written explicitly into G's prompt (Maya's live prompt lacked both — the cautionary finding) |

## G's own identity (never merged with other agents)

- Assistant: "G — The OC Group Website Guide", config-as-code in
  `docs/g-vapi-assistant.json`. **Not created yet** — creation is a founder
  financial-authorization step.
- `startSpeakingPlan.waitSeconds = 0.2` — G's own value. Aiden's 0.1 is
  identity-locked and was not copied.
- Voice: natural American male. Primary audition candidate ElevenLabs
  "Adam"; alternates "Antoni" and "Josh". **The founder's listening is the
  selection gate.** No voice is claimed natural or verified until heard.
- Knowledge: G's prompt derives from the existing approved
  `G_SYSTEM_INSTRUCTION` in `server/services/gIntelligenceGateway.ts`
  (same anti-fabrication rules, audiences, and boundaries), plus the
  explicit one-question and bilingual sections.
- G never accesses Aiden's number (316-778-4416), the internal PIPELINE,
  or any private agent. Public website scope only.

## How it is wired

- `client/src/voice/gRealtimeVoice.ts` — session controller: lazy-loads the
  Vapi Web SDK, maps SDK events to UI states (connecting / listening /
  thinking / speaking / ended / error), live transcripts into the same chat
  context, mute, clean stop, error surfacing.
- `netlify/functions/g-voice-session.mts` — `GET /api/g/voice/session`
  reports honest status; `POST` issues a session only when ALL gates pass:
  `OCG_G_VOICE_ENABLED=true`, `VAPI_PUBLIC_KEY` present,
  `OCG_G_VAPI_ASSISTANT_ID` present, and the persistent daily voice budget
  admits a session. Every failure is fail-closed with a plain reason.
- When realtime voice is unavailable or errors, the UI falls back to the
  browser speech path, **labeled "Basic browser voice"** everywhere it is
  offered. Browser speech synthesis is never labeled premium or
  production-quality.
- Text chat continues to work in all modes; voice transcripts and typed
  messages share one conversation context (last-16 history window).

## Spending controls (verified in code, enforced server-side)

- `server/services/gBudget.ts` — persistent daily meter on Netlify Blobs
  (store `g-budget`, strong consistency). Defaults: 500 paid chat
  requests/day, 25 voice sessions/day. Hard ceilings 5000 / 200: an
  environment value may set a limit anywhere up to the ceiling (including
  above the default) but can never exceed it — raising a ceiling takes a
  code change. Consumption is atomic (ETag compare-and-swap) so
  concurrent bursts cannot overrun the cap, and a unit is consumed when
  access is granted (the meter over-counts failed starts rather than
  under-charging). When the meter is unavailable, paid features fail
  closed; free local paths keep working.
- Voice sessions are additionally capped per call:
  `maxDurationSeconds = 600` in the assistant config.
- Nothing is enabled by this change: no env values were set, no assistant
  was created, no purchase was made. Enabling requires the founder to
  (1) approve the spend, (2) create the assistant from
  `docs/g-vapi-assistant.json`, (3) set `VAPI_PUBLIC_KEY`,
  `OCG_G_VAPI_ASSISTANT_ID`, `OCG_G_VOICE_ENABLED=true` in Netlify env.
- Estimated cost once enabled (to confirm against the account at
  authorization time): Vapi platform ≈ $0.05/min plus model/transcriber/
  voice pass-through; plan on roughly $0.10–$0.25 per voice minute,
  bounded by 25 sessions/day × 10 min ≈ $25–$60/day worst case at defaults.
- Paid text chat (`OCG_G_PAID_MODEL_APPROVED`) is likewise meter-gated;
  the previous blanket block is replaced by the budget gate, not removed
  discipline.

## Acceptance battery (before anyone calls voice "done")

Measured against the Aiden baseline bands (response-latency median ≤
Aiden +150 ms / +25%, time-to-stop on interruption, dead air, Spanish
overlap parity), ≥ 3 runs per side, QUINCEY scoring:

1. Natural conversation: seller, investor, buyer, financing, general
   scenarios; context retention across turns and across voice→text.
2. Interruption/barge-in ×3 per scenario, including mid-greeting.
3. Spanish scenario end-to-end; mid-conversation language switch.
4. Latency and voice quality by a human listener (founder audition).
5. Mobile browsers (Chrome/Android, Safari/iOS) mic + playback.
6. Failure recovery: mic denied, network drop, provider error → clean
   fallback to text chat with an honest message.
7. Lead delivery from a voice conversation via the follow-up card,
   verified in Netlify Forms submissions.

Until a human runs this battery with a real microphone and speaker,
voice quality, interruption feel, Spanish behavior, and latency are
**NOT VERIFIED** — build and unit-test passes do not certify them.
