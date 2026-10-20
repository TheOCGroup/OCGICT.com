# G release gate — 2026-10-20

Scope: `TheOCGroup/OCGICT.com`, draft PR #13 only. Do not merge or publish as production without approval.

## Verified
- G browser voice fallback and response-language regression tests: 4 passing.
- G repeated-long-payload heuristic: 3 passing. This is an in-process session heuristic, not bot detection.
- Earlier build and TypeScript checks passed on this branch.
- Netlify manual preview `6ad78077dd056ecee8de8901` registered `ocg-contact`; a clearly labeled QA submission yielded HTTP 200 and increased submissions to 1.

## Not verified / release blockers
- Netlify manual preview is **static**. `dist/index.js` is an Express server bundle but Netlify deploy of `dist/public` contains **no server functions**. Therefore `/api/g/chat` is not operational on this preview.
- `/api/g/stream` now fails closed (503) until properly validated, metered, and approved.
- Live Netlify form email notifications and authorized Piper CRM delivery are not verified.
- Browser-selected male TTS is not a guaranteed premium voice. No realtime audio, real spoken barge-in, or field-tested bilingual latency.
- Existing `server/services/piperAdapter.ts` holds data in memory; its `READY_FOR_PIPER` response must not be interpreted as durable CRM delivery.
- Abuse counters rely on untrusted session IDs and process memory, so session rotation or multiple server instances can bypass them. No claims of user identification.
- Review `/api/g/chat` per-client budget limits and the auth/proxy boundary before exposing a costly model endpoint.

## Next workstream — server deployment architecture (separate scoped review)
1. Identify canonical hosting and authenticated backend destination without changing DNS.
2. Choose a server execution approach compatible with approved Netlify frontend / existing infrastructure; preserve endpoint contract.
3. Add bounded per-client rate limits, provider budget/circuit breakers, origin controls, and safe telemetry before deploying.
4. Test staged `/api/g/chat`, then CRM handoff and voice end-to-end. Keep draft PR and release hold until verified.

No raw visitor conversations, secrets, or personal details are included in this record.

