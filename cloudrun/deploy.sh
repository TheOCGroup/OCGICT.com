#!/usr/bin/env bash
# G Cloud Run fallback — staging deployment. TEMPLATE: executed only by the
# founder/workstation lane AFTER the Phase 3 authorization, following
# cloudrun/STAGING-RUNBOOK.md step by step. Never run unattended.
set -euo pipefail
PROJECT="${GCP_PROJECT:-ocg-voice-acceptance}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE:-ocg-g-fallback}"
SA="ocg-g-fallback@${PROJECT}.iam.gserviceaccount.com"

# Prereqs (runbook steps 1-4): APIs enabled, Firestore (default) DB created,
# dedicated service account with roles/datastore.user, and the secret
# ocg-g-gemini-api-key present in Secret Manager with secretAccessor granted
# to the service account. The key value NEVER appears on a command line here.
gcloud run deploy "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --source . \
  --allow-unauthenticated \
  --service-account "$SA" \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 40 \
  --set-env-vars "OCG_STORE_BACKEND=firestore,OCG_LEAD_BACKEND=firestore,OCG_G_PAID_MODEL_APPROVED=true,OCG_G_CHAT_ENABLED=true" \
  --set-secrets "GEMINI_API_KEY=ocg-g-gemini-api-key:latest"
# Rollback: gcloud run services update-traffic "$SERVICE" --project "$PROJECT" --region "$REGION" --to-revisions <previous>=100
# Teardown: gcloud run services delete "$SERVICE" --project "$PROJECT" --region "$REGION" (Firestore data persists).
