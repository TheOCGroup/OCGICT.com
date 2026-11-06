# OCGICT P0 Property Resolution — QUINCEY Review Packet

**Date:** 2026-11-06
**Working branch:** `feat/p0-property-resolution-20261106`
**Base:** seller-intake persistence candidate `5f1f57b878bc44375365acce464717e69217d59b`
**Release state:** DRAFT / STAGING HOLD. Production unchanged.

## Implemented in this candidate

- Single-address Sedgwick County parcel lookup through the City of Wichita GIS public Property_and_Location layer.
- Typed outcomes: matched, not found, ambiguous, invalid address, unsupported location, and provider unavailable.
- Server-side production activation gate: `OCGICT_SEDGWICK_GIS_ENABLED=true`; default remains disabled.
- No owner names, owner mailing addresses, bulk parcel enumeration, or county sales records requested.
- Appraisal facts are provenance-tagged public-record facts, never comparable sales or ARV.
- Seller intake preserves submitted city/state/ZIP; no silent Wichita substitution.
- Address autocomplete is limited to Sedgwick County, Kansas; manual entry remains available.
- Human review remains mandatory without a separately verified comparable-sales source.
- Cloud Run host-level durable per-client rate limits: property lookup 20/minute; address suggestions 30/minute; configurable downward/upward only within existing hard ceiling. Store failures fail closed.

## Verification performed on DESKTOP-5E83JLJ

- `pnpm check`: PASS.
- `pnpm vitest run`: 262/262 PASS across 25 files.
- `pnpm build:cloudrun`: PASS.
- `git diff --check`: PASS.
- Live GIS provider: matched one test address; returned ambiguous for a multi-parcel address; returned not-found for two test addresses.
- Local Cloud Run host: health, autocomplete, matched parcel, ambiguous parcel, and unsupported-location API paths returned expected results.
- No seller lead was submitted. No Firestore lead write/read-back test was performed.
- No production deployment, environment change, paid inference, or voice activation occurred.

## QUINCEY independent review required

Review the exact pushed candidate head and verify:

1. GIS query is single-address only, exact-match, bounded, and excludes owner/mailing fields.
2. Address normalization, unit handling, duplicate parcel handling, and transfer-limit behavior are correct.
3. Source attribution and certainty remain attached to each returned field.
4. Unsupported/no-match/provider outage never becomes a guessed parcel or offer.
5. Cloud Run rate limiting uses the trusted platform-appended client IP, durable shared storage, and fail-closed behavior.
6. Netlify and Cloud Run paths enforce equivalent limits without global cross-user throttling.
7. Seller UI handles ambiguous/no-match/provider failure and preserves manual correction.
8. No appraisal value is treated as a comparable sale; production seller offer remains human-review-only until verified comps exist.
9. Existing G seller policy, privacy, consent, and lead persistence behavior remain intact.

## Remaining acceptance gates

- QUINCEY independent verdict on exact candidate head.
- Authorized Cloud Run staging deployment only; verify the GIS flag is absent by default, then enable only in isolated staging for acceptance.
- Live-like synthetic seller intake followed by Firestore read-back and duplicate-submission proof in staging.
- Verify staging rollback and preserve production revision `00016-dad`.
- Separate G voice latency measurement and voice-path acceptance; do not incur paid model usage without approval.

**Do not merge or promote production until every required gate is independently evidenced.**
