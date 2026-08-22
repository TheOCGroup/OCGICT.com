# OCGICT Cloud Run Setup

## Target

- Service: `ocg-website-staging`
- Region: `us-central1`
- Access: authenticated / owner-only staging
- Container port: `8080`
- Source: `TheOCGroup/OCGICT.com`

## GitHub Actions deployment

Workflow: `.github/workflows/cloud-run-staging.yml`

The workflow validates TypeScript and the production build before any deployment. It then builds the repository Dockerfile, pushes the image to Artifact Registry, and deploys the exact commit SHA to Cloud Run.

Deployment trigger status: cinematic Wichita gateway revision approved for staging deployment on 2026-08-22.

## Required Google Cloud resources

1. Google Cloud project selected for OCGICT.
2. APIs enabled:
   - Cloud Run API
   - Artifact Registry API
   - IAM Credentials API
3. Artifact Registry Docker repository named `ocgict` in `us-central1`.
4. A deployment service account with only the permissions required to push images and deploy/update the staging Cloud Run service.
5. GitHub Workload Identity Federation configured for repository `TheOCGroup/OCGICT.com`.
6. Cloud Run runtime secrets/configuration provisioned in Google Cloud Secret Manager or Cloud Run configuration. Do not commit secret values to GitHub.

## GitHub configuration required

Configure these in the GitHub `staging` environment:

### Variable

- `GCP_PROJECT_ID` — Google Cloud project ID.

### Secrets

- `GCP_WIF_PROVIDER` — full Workload Identity Provider resource name.
- `GCP_SERVICE_ACCOUNT` — deployment service-account email.

No service-account JSON key should be stored in the repository.

## Runtime configuration

At minimum confirm the existing Cloud Run service has the approved runtime configuration required by the current application, including:

- `NODE_ENV=production`
- `PORT=8080`
- `AI_PROVIDER=Gemini`
- `GEMINI_API_KEY` sourced from Secret Manager
- approved Supabase configuration
- `OCGICT_DATA_MODE=production`
- production-safe mock/demo provider settings disabled
- Pipeline/PIPER configuration only when its receiving endpoint is actually available

Do not copy secret values into this document.

## Safety gate

Before public DNS cutover, verify the complete staging journey:

1. Homepage loads at desktop, tablet, and mobile widths.
2. The homepage clearly positions The OC Group as real estate investment, acquisition, renovation strategy, and consulting—not only an investor education site or generic home buyer.
3. Seller conversion CTA is prominent and communicates the real flow: address → a few questions → property intelligence → preliminary offer when confidence gates pass.
4. Wichita-specific visual identity renders correctly, including local architectural/landmark references and motion with reduced-motion accessibility respected.
5. Seller intake validates required fields and explicit consent.
6. Submission persists.
7. Property research uses production-safe providers only.
8. If reliable property/comparable data is unavailable, the record routes to `MANUAL_REVIEW_REQUIRED` or equivalent and no fabricated ARV, repair estimate, comparable, or offer appears.
9. Admin authentication protects private property and seller intelligence.
10. Manual underwriting works.
11. Published preliminary offer creates an immutable offer version and secure seller result link.
12. Accept preliminary offer, counteroffer, request call, and request walkthrough create the correct seller actions. Preliminary acceptance must remain explicitly non-binding and subject to walkthrough, verification, title review, and a separate written purchase agreement.
13. Pipeline outbox event is created and preserved even if downstream delivery is unavailable.
14. Browser console contains no material errors.

## Public cutover

Only after the staging safety gate passes:

1. Create or select the production Cloud Run service.
2. Deploy the validated image SHA.
3. Configure custom domain mapping for `ocgict.com` and `www.ocgict.com`.
4. Update DNS only after domain mapping reports the required records.
5. Verify TLS/SSL is active.
6. Re-run the seller and admin smoke tests against the public domain.

Do not describe OCGICT as publicly launched until those checks pass.
