# G Cloud Run fallback — STAGING RUNBOOK (founder/workstation executed)

Authorization required before step 1: the founder's Phase 3 approval naming
project `ocg-voice-acceptance` and the CLOUDRUN-GATE estimate. Every step is
~$0; the first billable surface is the deployed service itself (idle cost
$0 at min-instances 0; the Phase 4 battery costs under $1).

**Shared-project caution:** `ocg-voice-acceptance` also hosts the OCG VOICE
lane's work. Step 0 lists what exists; this runbook creates ONLY the
resources named `ocg-g-fallback*` / `ocg-g-gemini-api-key` and never touches
any other service, account, or secret.

0. PREFLIGHT (verify, change nothing)
   - `gcloud config set account <founder account>`; `gcloud config set project ocg-voice-acceptance`
   - `gcloud billing projects describe ocg-voice-acceptance` -> billingEnabled: true
   - `gcloud run services list --region us-central1` (note existing services; expect possibly the voice lane's)
   - `gcloud firestore databases list` (note whether a (default) database exists)
1. ENABLE APIS (~$0): `gcloud services enable run.googleapis.com firestore.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com`
2. FIRESTORE: if no (default) database: `gcloud firestore databases create --location=us-central1 --type=firestore-native` (one-time, project-global). Then paste `cloudrun/firestore.rules` in Firebase Console -> Firestore -> Rules -> Publish (deny-all client posture; the Admin SDK is unaffected).
3. SERVICE ACCOUNT: `gcloud iam service-accounts create ocg-g-fallback --display-name "G fallback runtime"`; `gcloud projects add-iam-policy-binding ocg-voice-acceptance --member serviceAccount:ocg-g-fallback@ocg-voice-acceptance.iam.gserviceaccount.com --role roles/datastore.user`
4. SECRET: in AI Studio, display the Gemini API key; on the workstation run `gcloud secrets create ocg-g-gemini-api-key` then `gcloud secrets versions add ocg-g-gemini-api-key` and paste the key at the prompt (the key transits only the workstation + Google). Grant: `gcloud secrets add-iam-policy-binding ocg-g-gemini-api-key --member serviceAccount:ocg-g-fallback@ocg-voice-acceptance.iam.gserviceaccount.com --role roles/secretmanager.secretAccessor`
5. BUDGET ALERTS: Console -> Billing -> Budgets: create budget on the project, alerts at $10 / $25 / $50 to the founder's email. (Alerts warn; they do not stop spend — the in-code daily caps are the hard bound.)
6. DEPLOY: from the repo checkout of the certified branch head: `bash cloudrun/deploy.sh` (builds from source via Cloud Build; first build a few minutes).
7. SMOKE (5 minutes): open the service URL: `/healthz` -> ok; `/` -> the site; `/?poc=1` -> G answers; one ES chat turn; one TTS sentence. Then STOP and hand over for the Phase 4 battery + QUINCEY deployment certification — no DNS, no production traffic, no PR merges.
8. TEARDOWN (if staging is abandoned): `gcloud run services delete ocg-g-fallback --region us-central1`; Firestore data can be left (cents) or the two collections deleted in Console.
