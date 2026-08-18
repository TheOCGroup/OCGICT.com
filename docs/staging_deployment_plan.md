# OCG Production Staging & Deployment Plan (Cloud Run)

## 1. Infrastructure Specification (Google Cloud Run)
- **Service Name**: `ocg-website-staging`
- **Region**: `us-central1` (Council Bluffs / Iowa) — low latency to Wichita, KS.
- **Compute Tier**: 1 vCPU, 512 MB RAM.
- **Scaling Policy**:
  * `min-instances: 0` (scales to zero when idle for $0 base cost).
  * `max-instances: 3` (burst protection).
  * `concurrency: 80` requests per instance.

---

## 2. Monthly Cost Analysis
| Component | Free Tier Allowance | Staging Consumption Est. | Projected Cost |
| :--- | :--- | :--- | :--- |
| **Cloud Run CPU/Memory** | 2,000,000 requests/mo, 360,000 vCPU-seconds | ~50,000 requests/mo | **$0.00 / mo** |
| **Cloud Build (CI/CD)** | 120 build-minutes / day | ~15 build-minutes / week | **$0.00 / mo** |
| **Artifact Registry** | 500 MB storage | ~120 MB compressed container | **$0.00 / mo** |
| **Total Projected Staging Cost** | — | — | **$0.00 / mo (Free Tier)** |

---

## 3. Environment Variables for Production Staging

| Variable Name | Purpose | Sensitivity | Default / Staging Value |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | Public | `production` |
| `PORT` | Container HTTP port | Public | `8080` |
| `GEMINI_API_KEY` | Server-side G LLM reasoning | **Confidential** | *(Provisioned in Cloud Secret Manager)* |
| `AI_PROVIDER` | Active LLM Gateway Engine | Config | `Gemini` |
| `SUPABASE_URL` | Lead & dossier persistence | Public API | `https://lsaerludzkxjewqgbvkg.supabase.co` |
| `SUPABASE_ANON_KEY` | Client & server auth | Public API | *(Configured)* |
