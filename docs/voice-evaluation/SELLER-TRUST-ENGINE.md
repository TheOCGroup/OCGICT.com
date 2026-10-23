# G — Seller Trust & Natural Voice Engine

**Scope:** G on OCGICT.com only. **Status:** preview; production unchanged.
**Companion evidence:** Phase 1 voice evaluation (66 renders + cadence
metrics), seller scenario battery (61/61 checks), barge-in acoustic
battery, unit suites — all in the goal evidence folder
(`files/g-voice-transformation/natural-voice/`).

## What changed and why

G already had intelligence, a certified expression layer, and a locked
voice (Supertonic M1). What it did not have: a model of the *seller's*
emotional state, a tracked conversation framework, delivery that adapts
to that state, or any way for a homeowner to interrupt him by voice.
This mission adds exactly those four things and nothing else — the
website interface, lead capture, and business functions are untouched.

## Phase 1 — Voice evaluation (before any selection)

Eight male voices were rendered on identical seller scripts (EN + ES):
Supertonic M1–M5, Kokoro am_michael (G's server voice today), am_adam,
am_eric, and Kokoro ES em_alex. Measured per voice: speech rate,
pauses per line, mean pause length, loudness, synthesis RTF.

Findings (sandbox CPU; RTF is not a device figure):

- Supertonic voices share a conversational cadence structure: ~5
  pauses per line, ~0.45–0.50 s mean pauses, 13.5–16.9 chars/s.
- M3 is the brisk outlier (16.9 chars/s EN) — efficient, but the
  pacing least suited to sensitive conversations.
- M1/M2/M5 cluster at the calm end; M2 measures slightly louder at
  equal settings.
- Kokoro males speak faster with far fewer pauses (am_eric: 19.4
  chars/s, 1.3 pauses/line); Kokoro Spanish (em_alex) averages 0.7
  pauses per line — a run-on delivery in exactly the conversations
  where pacing matters most.

**Decision discipline:** the metrics shortlist; they do not choose.
The preview defaults to M1 (the founder's locked selection) with M2
one URL parameter away (`&voiceStyle=M2`); the founder's listening
comparison is the selection instrument. No silent substitution.

## Phase 2/3 — Emotional intelligence + trust framework

`server/voice/sellerPolicy.ts` (deterministic, unit-tested, EN + ES):

- **Emotional context detection:** hesitant, stressed (repairs),
  stressed (finances), attached, inherited, urgent, skeptical,
  comparing, frustrated, motivated, curious. Current-turn signals
  lead; earlier signals keep shaping delivery.
- **Stated-fact memory:** bedrooms, condition, timeline, address hint
  are extracted from what the seller actually said; **corrections win**
  ("Actually, it's three bedrooms" updates the fact and the reply
  acknowledges the corrected value explicitly).
- **Stage tracking** over the trust framework: welcome → motivation →
  property → timeline → how OCG evaluates → questions → voluntary
  next step. Stages guide; they never script.
- **Guardrails on every reply** (gateway choke point, any provider):
  at most ONE question per seller reply; any sentence carrying a price
  promise or manufactured pressure is removed, never softened.
- **Dedicated honest answers** for the hard moments: skepticism
  (written offer, every number explained, no obligation), listing-vs-
  direct comparison (both sides stated fairly, including that listing
  can pay more), financial distress (acknowledgment, no promised
  outcome), frustration (de-escalate, respect a stop), and the
  evaluation explainer (comparable sales + repairs + real costs →
  preliminary range; a formal offer only follows a real team review).

The same policy is written into the gateway's system instruction, so
behavior is consistent if a paid model is ever enabled.

## Phase 4 — Delivery mapping

The gateway returns the emotional context with each reply
(`delivery.emotion`); both speech paths consume it through the
certified expression layer:

- Sensitive contexts (inherited, stressed, attached, hesitant,
  frustrated): speed × 0.95, pauses × 1.3, at most 2 spoken
  sentences, sensitive pacing.
- Urgent/motivated: efficient pacing, shorter pauses, ≤ 2 sentences.
- Skeptical/comparing/curious: measured explanatory pacing.
- Voice identity never changes with emotion — only pacing.

## P0 — Voice barge-in

`client/src/voice/browser/bargeIn.ts`: while G speaks, an
echo-cancelled microphone monitor analyzes frames every 30 ms:

- **VadGate** (pure, unit-tested state machine): a burst must sustain
  ~240 ms above an adaptive threshold (noise floor × 3.2, residual-
  echo ceiling, absolute floor) with voice-band energy to confirm an
  interruption. Onset→fire is 240–300 ms in frame-exact unit tests.
- **Backchannel rejection:** short bursts ("uh-huh") die before
  confirming and are counted, never fired.
- **Echo protection, two layers:** the browser's acoustic echo
  cancellation, plus an envelope-correlation veto — if the mic signal
  moves *with* G's own playback envelope (and is quieter than it), it
  is G's echo, however speech-like.
- **On interrupt:** playback stops through the same path as the Stop
  button, recognition opens, the conversation context is untouched —
  the seller's correction or new statement is simply the next turn.
- **Privacy/controls:** the monitor exists only inside an active
  voice session, watches only while G is speaking, releases the mic
  when voice stops, and every prior control (Stop button, tap-to-
  talk, typing interrupts) works exactly as before. If the mic is
  unavailable, barge-in is simply absent.

## Honest limits (not claimed)

- Voice quality and emotional appropriateness are **listening
  judgments** — the founder's, via the comparison page. No model-
  generated score in this package certifies them.
- Barge-in device behavior is **not certified from a sandbox**: the
  acoustic battery runs in headless Chromium with injected audio;
  physical desktop + Galaxy S25 Ultra verification (real speakers,
  real rooms, real echo) remains a founder-device gate, with a
  protocol in the evidence folder.
- The local conversation engine is deterministic and rule-based; its
  coverage is the framework above, not open-ended dialogue.
- No conversion-rate or business-outcome claims are made.
