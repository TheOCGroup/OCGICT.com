# G Release Gate — Addendum 2026-10-21 (voice standardization)

Successor note to `G-RELEASE-GATE-2026-10-20.md`. That document's central
blocker — "paid usage blocked until a persistent usage budget is verified" —
is now resolved in code. This addendum records what is verified, what is
not, and what remains a founder decision. Statuses use the OCG vocabulary:
WORKING / PARTIAL / MOCKED / UNTESTED / BLOCKED, with evidence.

## Resolved by this change

- **Persistent usage budget — WORKING (code + tests).**
  `server/services/gBudget.ts`: Netlify Blobs meter (store `g-budget`,
  strong consistency), per-UTC-day keys, defaults 500 paid chat/day and
  25 voice sessions/day, hard ceilings 5000/200 that env values can only
  lower. Unit-tested (39/39 suite). The previous blanket block in
  `g-chat.mts` is replaced by: credentials + `OCG_G_PAID_MODEL_APPROVED=true`
  + meter headroom, else the free local engine answers and the response
  is flagged `budgetFallback` when the meter was the reason.
- **Realtime voice path — WORKING (integration), UNTESTED (experience).**
  Vapi Web SDK client (`client/src/voice/gRealtimeVoice.ts`), session gate
  function (`g-voice-session.mts`, fail-closed, verified live on preview:
  GET reports disabled with a plain reason; POST refuses 503). G's own
  assistant config-as-code: `docs/g-vapi-assistant.json`. Browser speech
  remains only as a fallback labeled "Basic browser voice".
- **Lead delivery — WORKING (verified end-to-end on preview).**
  Netlify Forms is the durable store. Preview evidence 2026-10-21:
  `ocg-g-lead` submissions recorded via `/api/g/lead` (reference
  G-QA-20261021-LEAD2, exactly once) and directly; `ocg-seller-intake`
  recorded from the Sell flow (SELLER-QA-20261021-V4); `ocg-seller-action`
  recorded REQUEST_CALL; `ocg-contact` count 1 → 2. Email notifications:
  `submission_created` hooks for all four forms → theocgroupict@gmail.com,
  created via API and verified in the hooks listing. A post-hook lead
  (G-QA-20261021-NOTIFY1) was recorded to trigger a live notification;
  mailbox receipt is not readable from the build environment.
- **Seller endpoints on Netlify — WORKING (verified live on preview).**
  preliminary-offer / property-lookup / action / address-suggestions run
  as functions reusing the existing services; production mode returns
  manual-review honesty (no fabricated offers). Address suggestions
  returned live Photon results.
- **Chat on preview — WORKING.** Greeting, seller guidance with a single
  follow-up question, and anti-fabrication refusals verified live.
  Latency ~0.2–1.3s per response from the test environment.

## Not verified / known limitations

- **Voice experience — UNTESTED.** No human has spoken with G yet. Voice
  naturalness, barge-in feel, latency, and Spanish voice behavior require
  the acceptance battery in `G-VOICE-STANDARDIZATION-2026-10-21.md` with
  a real microphone/speaker and the founder's ears. The Vapi assistant
  itself is NOT CREATED (founder financial authorization required).
- **Text-chat Spanish — PARTIAL.** The local deterministic engine answers
  Spanish input with its English generic response (observed live
  2026-10-21). Spanish is properly handled by (a) the realtime voice
  configuration (multilingual transcriber + bilingual prompt sections)
  and (b) the paid chat model when the founder approves it. Until one of
  those is enabled, Spanish text chat is a known gap — do not claim
  otherwise.
- **Admin authentication — PRE-EXISTING RISK, unchanged.** Admin pages
  gate on a client-side password constant and the public Supabase anon
  key (`client/src/contexts/AdminAuthContext.tsx`). Whether the anon key
  can read `deal_submissions` PII could not be probed from this
  environment (Supabase egress blocked); treat as untested. Real admin
  auth is a separate founder-gated fix. New lead paths deliberately keep
  visitor PII in Netlify Forms, not anon-key tables.
- **www.ocgict.com — BLOCKED on founder DNS action.** The `www` CNAME at
  GoDaddy still points to a disabled Vercel deployment (live-verified
  HTTP 402 DEPLOYMENT_DISABLED). Required change at GoDaddy: point the
  `www` CNAME to `theocgroup.netlify.app`; Netlify then provisions TLS.
  No Vercel dependency remains in the codebase (vercel.json and
  api/[...path].ts removed in this PR).
- **Netlify git publishing — PARTIAL.** The site remains git-linked to
  TheOCGroup/RENO; deploys are CLI/API digest deploys (the method used
  for every verified preview here). Relinking the site's repo in Netlify
  settings is a founder-side change; nothing in this PR depends on it.

## Founder decisions queued

1. **Financial authorization (voice):** create G's Vapi assistant from
   `docs/g-vapi-assistant.json`, set `VAPI_PUBLIC_KEY`,
   `OCG_G_VAPI_ASSISTANT_ID`, `OCG_G_VOICE_ENABLED=true` in Netlify env.
   Bounded by 25 sessions/day × 10 min; estimated $0.10–$0.25/min
   all-in (confirm against the account at creation). Includes the voice
   audition: Adam (primary candidate) vs Antoni vs Josh.
2. **Paid text chat (optional):** set `GEMINI_API_KEY` +
   `OCG_G_PAID_MODEL_APPROVED=true` to unlock the metered paid model
   (fixes Spanish text chat properly). Local engine remains the default.
3. **GoDaddy DNS:** the one-line CNAME change above.
4. **Merge PR #13** after reviewing this addendum and the QA findings.
