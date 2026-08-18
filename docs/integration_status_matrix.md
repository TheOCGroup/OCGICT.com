# OCG Production Integration Status Matrix (Phase III)

This matrix establishes the definitive, unvarnished operational status across all OCG subsystems and capabilities. Under our strict **no-pretending** rule, static profiles, mocks, or architectural contracts are never labeled as production-live.

---

## 1. Subsystem Operational Status

| Subsystem / Capability | Exact Status | Active Implementation | Production Requirement | Decision / Key Needed |
| :--- | :---: | :--- | :--- | :--- |
| **G Website Action Registry** | **LOCAL INTELLIGENCE — LIVE** | `GActionRegistry` executing tool calls (`SET_CALCULATOR_VALUES`, `SELECT_PROPERTY_TRANSFORMATION`, `NAVIGATE`) via custom event bus | Preserved in frontend client layer | None |
| **G Client-Side Reasoning** | **LOCAL INTELLIGENCE — LIVE** | Deterministic rule & framework matching in `gActionDispatcher.ts` with instant responses | Fallback engine when server gateway is offline | None |
| **Production G Gateway Backend** | **STAGING** | Express server gateway `/api/g/chat` with `IModelProvider` abstraction and rate limiter | Server environment `GEMINI_API_KEY` (or OpenAI key) provisioned in deployment | `GEMINI_API_KEY` |
| **Wichita Neighborhood Profiles** | **STATIC VERIFIED KNOWLEDGE** | Verified architectural archetypes, price bands, and scope profiles in `wichitaMarketIntelligence.ts` | Static baseline for underwriting heuristics | None |
| **Runtime Property / Market Retrieval** | **STAGING / NOT CONNECTED** | Data source integration architecture documented for Sedgwick County MAB and SCKMLS | Active API integration / scraper for live daily comps | Sedgwick County GIS & SCKMLS credentials |
| **HUNTER (Acquisition Discovery)** | **SPECIFICATION** | Schema contracts (`IHunterAdapterRequest/Response`) & adapter `/api/adapters/hunter` | Dedicated background ETL service querying tax delinquency & probate filings | Backend scraping infrastructure |
| **VICTOR (Underwriting Engine)** | **SPECIFICATION** | Schema contracts (`IVictorAdapterRequest/Response`), 70% rule heuristics & adapter `/api/adapters/victor` | MLS comparable clustering algorithm + local contractor rate database | SCKMLS feed & contractor cost tables |
| **PIPER (Pipeline Operations)** | **SPECIFICATION** | Lifecycle tracking schema (`IPiperDealPipelineStage`) & adapter `/api/adapters/piper` | Central CRM deal stage database with automated lender packet generator | Database migrations for PIPER deals |
| **OCG Strategy Brief Lifecycle** | **WORKING LOCALLY + STAGING SUPABASE** | Canonical `IOCGStrategyBrief` v3.0.0 with data provenance, JSON export, and Supabase `leads` sync | Ingestion webhook into CRM / PIPER | None |
| **Streaming Voice Mode** | **STAGING** | Provider-agnostic interface (`ISTTProvider`, `ITTSProvider`, `ILiveAvatarProvider`) with UI preview notice | Full-duplex WebSocket audio relay with STT/TTS keys | `DEEPGRAM_API_KEY` / `CARTESIA_API_KEY` |
| **Strategy Session Booking** | **WORKING LOCALLY** | Provider-neutral adapter (`IBookingProvider`) supporting Cal.com, Calendly, and OCG Direct Intake | Genaro's live calendar URL | Cal.com / Calendly link |
| **Observability & Telemetry** | **WORKING LOCALLY** | Structured event logger (`OcgObservability`) tracking sessions, tool calls, and latencies | Cloud logging aggregation (Datadog / CloudWatch / Logflare) | Cloud log sink |
| **Canonical Repository** | **SPECIFIED** | Target remote: `TheOCGroup/OCGICT.com` | Push git main to canonical remote when repository exists | GitHub repo creation permissions |

---

## 2. Summary of Immediate External Dependencies
1. **GitHub Canonical Remote**: Target `TheOCGroup/OCGICT.com` for git remote push.
2. **Server Environment AI Keys (Optional for local dev, needed for public cutover)**: `GEMINI_API_KEY` for server-side G reasoning.
3. **Calendar Booking Link**: Cal.com or Calendly URL when ready to connect live calendar scheduling.
