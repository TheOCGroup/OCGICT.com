# OCG Data Provenance, Public Records, and Comparable Sales Audit

**System Version:** 5.0.0  
**Updated:** 2026-08-18  
**Audit Purpose:** Comprehensive disclosure of data sources, retrieval modes, legal access methods, and classification rules governing the OCG Preliminary Offer Engine and VICTOR Underwriting Service.

---

## 1. Data Source Inventory & Classification Matrix

| Data Dimension | Upstream Provider / Source | Retrieval Method | Mode (Staging vs Prod) | Verified Recorded Closed Sale? | Provenance Classification |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Parcel PIN & Legal Description** | Sedgwick County GIS / Appraiser (MAB) | Public Record Search | Calibrated Benchmark Fixture / API Proxy | Yes (County Public Record) | `KNOWN` |
| **Living Area Sq Ft & Year Built** | Sedgwick County Tax & Assessment Rolls | Public Tax Record Query | Calibrated Benchmark Fixture / API Proxy | Yes (Official Property Roll) | `KNOWN` |
| **Tax Appraisal & Delinquency** | Sedgwick County Treasurer / MAB | Public Record Query | Calibrated Benchmark Fixture / API Proxy | Yes (County Record) | `KNOWN` |
| **Zoning Code & Floodway** | City of Wichita MAPD / FEMA GIS | GIS Spatial Overlay | Static Regulatory Map | Yes (Public Ordinance) | `KNOWN` |
| **Micro-Market Comps (College Hill)** | Sedgwick County Recorded Deed Fixtures | Submarket Price-per-Sqft Model | Static Calibrated Benchmark | Yes (Historical County Deed Transfer) | `PROVISIONAL` |
| **Micro-Market Comps (Crown Heights)** | Sedgwick County Recorded Deed Fixtures | Submarket Price-per-Sqft Model | Static Calibrated Benchmark | Yes (Historical County Deed Transfer) | `PROVISIONAL` |
| **Micro-Market Comps (Delano)** | Sedgwick County Recorded Deed Fixtures | Submarket Price-per-Sqft Model | Static Calibrated Benchmark | Yes (Historical County Deed Transfer) | `PROVISIONAL` |
| **General Wichita Submarket Baseline** | Sedgwick County Median Benchmark | Submarket Valuation Formula | Statistical Proxy | No (Estimated Weighted Average) | `PROVISIONAL` |
| **ARV Valuation** | OCG Deterministic Underwriting Formula | Weighted Price-per-Sqft Calculation | Deterministic Runtime | Derived Metric | `ESTIMATED` |
| **Trade Renovation Scope** | OCG Contractor Unit-Rate Cost Tables | Sqft × Condition Tier + Add-ons | Deterministic Runtime | Trade Rate Estimate | `ESTIMATED` |
| **Internal MAO Ceiling** | OCG 70% Formula: (ARV × 0.70) - Rehab | Deterministic Runtime Formula | Deterministic Runtime | Financial Ceiling | `ESTIMATED` |

---

## 2. No-Pretending Disclosure Policy

1. **Static Benchmark vs Live MLS Distinction**:
   - In staging and local sandbox, comparable sales are **Calibrated Historical Sedgwick County Benchmark Fixtures**, not live MLS streaming feeds.
   - They are labeled with provenance `PROVISIONAL` and data source `"Sedgwick County Calibrated Submarket Baseline"`.
   - The system NEVER presents static benchmark comps as "live real-time MLS listings."

2. **Automated Confidence Gating Rules**:
   - If a submitted property address is outside the verified Sedgwick County corridor database, the system returns `null` for public records and flags `HUMAN_REVIEW_REQUIRED`.
   - **No Manufactured Figures**: The system does NOT invent fake comps or synthetic dollar ranges when public records cannot be verified.
   - When evidence is incomplete, the customer-facing presentation states: `Additional Property Review Required (Human Specialist Assigned)` and enqueues a work item for Genaro Ocasio.

3. **Preliminary Non-Binding Legal Status**:
   - Every seller result includes clear disclosure that preliminary figures are non-binding estimates based on available records, subject to on-site contractor inspection, mechanical verification, clear title, and mutual written agreement.
