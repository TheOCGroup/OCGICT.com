# G — Cloud Run fallback host

Temporary fallback hosting for G while Netlify is unavailable (long-term
destination: OCG HOST OS). This host runs the **same certified function
handlers** as Netlify — no handler logic is forked. Everything
platform-specific is isolated behind three seams:

| Concern | Netlify (primary) | Cloud Run fallback |
|---|---|---|
| HTTP entry | Netlify Functions runtime | `server/cloudrun.ts` — static site + dispatch to the same handler modules with a Netlify-shaped context |
| Budget / rate-limit counters | Netlify Blobs (`g-budget` store, CAS) | Firestore `g-counters` collection, transactional increments (`server/services/gFirestoreStore.ts`), registered via `server/services/gPlatform.ts` only when `OCG_STORE_BACKEND=firestore` |
| Lead intake | Netlify Forms (function POSTs the form to the site origin) | The harness answers that same POST at `/` and persists to Firestore `g-leads` (`server/services/gLeadStore.ts`), only when `OCG_LEAD_BACKEND=firestore`; success is returned only after the durable write |

Client identity on Cloud Run: Google's front end appends the real client
IP as the **last** `X-Forwarded-For` entry; the harness passes that entry
as the handler context IP. Earlier (client-supplied) entries are never
trusted — the same forgery resistance the Netlify path gets from the
platform context IP.

Behavior preserved: endpoint contracts and response vocabularies; SSE
streaming (the harness pipes response bodies unbuffered); the daily budget
caps and per-minute rate limits with identical limits and fail-closed
semantics (store failure -> the existing 503 responses); seller safeguards
(the same handler code); the `?poc=1` opt-in. NOT preserved by design:
Netlify Forms dashboard/email notifications (leads land in Firestore;
notification parity is a launch-checklist item), and the PR #19 default-ON
host list (production hostnames are Netlify's; the fallback serves the POC
on explicit opt-in until a production GO names the serving host).

Environment (Cloud Run service): `OCG_STORE_BACKEND=firestore`,
`OCG_LEAD_BACKEND=firestore`, `OCG_G_PAID_MODEL_APPROVED=true`,
`OCG_G_CHAT_ENABLED=true`, `GEMINI_API_KEY` via Secret Manager
(`--set-secrets` in deploy.sh), optional `OCG_G_*_DAILY_LIMIT` /
`OCG_G_RATELIMIT_*` overrides, `GOOGLE_CLOUD_PROJECT` (set automatically
by Cloud Run). Identity: the service's attached service account needs
`roles/datastore.user` on the project — no key files anywhere.

Build/deploy: `pnpm run build:cloudrun`, then the template in
`cloudrun/deploy.sh` (founder-approved project + billing required first —
see the Phase 3 gate document in the release package). Rollback: shift
traffic to the previous revision (`update-traffic`), or delete the service;
Firestore data persists independently. `server/cloudrun.ts` is excluded
from the repo tsconfig (it imports the `.mts` function modules by their
real filenames, which the bundler-resolution program cannot map — the same
reason the functions themselves live outside that program); it is gated by
the esbuild bundle + the harness smoke test instead. Every other module
here is fully typechecked.
