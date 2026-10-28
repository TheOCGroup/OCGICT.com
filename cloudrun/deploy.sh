#!/usr/bin/env bash
# G Cloud Run fallback — deployment TEMPLATE. NOT executed by the build lane.
# Requires: founder-approved GCP project + billing (Phase 3 gate), gcloud auth.
set -euo pipefail
PROJECT="${GCP_PROJECT:?set GCP_PROJECT to the founder-approved project id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE:-ocg-g-fallback}"

# Secrets: GEMINI_API_KEY must exist in Secret Manager in the project
# (gcloud secrets create gemini-api-key) — never pass keys on the command line.
gcloud run deploy "$SERVICE" \
  --project "$PROJECT" \
  --region "$REGION" \
  --source . \
  --allow-unauthenticated \
  --max-instances 3 \
  --concurrency 40 \
  --set-env-vars "OCG_STORE_BACKEND=firestore,OCG_LEAD_BACKEND=firestore,OCG_G_PAID_MODEL_APPROVED=true,OCG_G_CHAT_ENABLED=true" \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest"
# Rollback: gcloud run services update-traffic "$SERVICE" --to-revisions <previous>=100
# Full teardown: gcloud run services delete "$SERVICE" (Firestore data persists).
