# OCG Production Integration Status Matrix (Phase II)

This matrix provides a rigorous, transparent breakdown of the current operational state of all OCG capabilities across **LIVE**, **STAGING**, **SPECIFICATION**, and **BLOCKED** tiers.

---

## 1. System Integration Matrix

| Subsystem | Capability / Feature | Status | Current Active Implementation | Production Requirement | Decision / Credential Required |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **G Intelligence** | Context Reasoning Core | **LIVE** | Rule & framework evaluation across OCG underwriting, capital preservation, and strategies in `gActionDispatcher.ts` | Connect to production Gemini / LLM endpoint for unbounded long-tail queries | `GEMINI_API_KEY` or OpenAI Key |
| **G Intelligence** | Website Tool Calling & Actions | **LIVE** | Custom event dispatcher (`ocg:g-action`) dynamically updates calculators, loads property case studies, and sets intake states | Persist actions across multi-page router transitions | None (Frontend operational) |
| **G Intelligence** | OCG Strategy Brief Generation | **LIVE** | Structured `IOCGStrategyBrief` object generation, JSON export, and automated dual-persistence | Ingestion trigger into CRM / PIPER | None |
| **G Intelligence** | Streaming Voice & Interruption | **STAGING** | Labeled as `Voice (Preview Staging)` with user feedback modal & architecture spec | Full-duplex WebSocket relay with Deepgram STT + Cartesia/ElevenLabs TTS | `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY` |
| **Data & Market Intel** | Wichita Micro-Market Profiles | **LIVE** | Hard-coded verified architectural archetypes, price bands, and scope profiles in `wichitaMarketIntelligence.ts` | Dynamic MLS / County Assessor data query cache | Sedgwick County GIS & SCKMLS API access |
| **Data & Market Intel** | Dynamic Market Statistics | **SPECIFICATION** | Data source plan documented in `wichitaMarketIntelligence.ts` | Scheduled cron pipeline polling Sedgwick County & South Central Kansas MLS | SCKMLS Bridge Interactive API credentials |
| **HUNTER** | Deal Finder & Distress Signals | **SPECIFICATION** | Architectural specification & sample signal protocol displayed in UI | Independent Python/Go ingestion service polling tax delinquency & probate lists | Server infrastructure for background scraper / ETL |
| **VICTOR** | Underwriting & Property Scope | **SPECIFICATION** | Structured underwriting contract (`IVictorUnderwritingPayload`) & interactive 70% calculator | Automated MLS comp clustering & automated contractor cost-table lookup | Integration with local contractor cost databases |
| **PIPER** | Acquisition Pipeline Engine | **SPECIFICATION** | Operational lifecycle specification (`IPiperDealPipelineStage`) | CRM / Kanban pipeline database backend with lender memo generation | Database migration for deal stage tables |
| **Conversion & Data** | Lead & Strategy Brief Persistence | **LIVE** | Supabase table persistence (`leads`) with localStorage fallback cache | Auto-dispatch webhook notifications to Genaro's email/SMS | Supabase Edge Function / Resend API key |
| **Conversion & Data** | 4-Step Seller Intake | **LIVE** | Interactive intake modal with motivation, timeline, condition, and contact collection | Direct routing to seller evaluation queue | None |
| **Conversion & Data** | Strategy Session Booking | **LIVE** | Appointment booking interface with pre-filled Strategy Brief attachment | Live Google Calendar / Cal.com OAuth sync | Genaro Cal.com / Calendly embed URL |
| **Media & Assets** | Authentic Wichita Visuals | **LIVE** | Real Wichita architectural Before/After pairs (College Hill Bungalow & Crown Heights Ranch) | High-res cinematic video & photography pass | On-site photo shoot / video production |
| **Production DevOps** | TypeScript Engine & Bundle | **LIVE** | `npm run check` $\rightarrow$ 0 errors; `npm run build` generates minified production bundle | Automated CI/CD pipeline | GitHub Repository creation |
| **Production DevOps** | Public Domain Deployment | **BLOCKED** | Running on local staging server (`http://127.0.0.1:5173`) | Final Genaro review & domain DNS configuration (`ocg.com` / custom domain) | Domain registrar access & DNS records |

---

## 2. Summary of Immediate Action Items for Genaro
1. **Cal.com / Calendly Embed**: If Genaro has a preferred direct booking calendar link, provide the URL to wire into `/contact` and G's booking button.
2. **API Keys for Live AI / Voice (Optional for Phase II Staging)**: When ready to transition from client-side intelligence to unbounded streaming LLM / Voice, provide `GEMINI_API_KEY` or `OPENAI_API_KEY` and voice provider keys.
3. **Domain & GitHub**: Provide the target GitHub organization/repo name for canonical remote push.
