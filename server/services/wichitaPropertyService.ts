import { IPropertyIntelligenceRecord, DataCertaintyLevel } from "../../shared/contracts";
import { OcgObservability } from "./observability";

export interface PropertyLookupQuery {
  address: string;
  parcelPin?: string;
  zipCode?: string;
}

export interface WichitaPublicPropertyRecord {
  parcelId: string;
  situsAddress: string;
  taxDistrict: string;
  appraisedLandValue: number;
  appraisedBuildingValue: number;
  totalAppraisedValue: number;
  priorYearTaxes: number;
  taxStatus: "Current" | "Delinquent" | "Exempt";
  zoningCode: string;
  zoningDescription: string;
  floodPlainStatus: "Zone X (Low Risk)" | "Zone AE (100-Year Floodway / High Risk)";
  legalDescription: string;
  yearBuilt: number;
  livingAreaSqft: number;
  provenance: {
    source: string;
    retrievalTimestamp: string;
    certainty: DataCertaintyLevel;
    mode: "STAGING_FIXTURE" | "LIVE_PUBLIC_RECORD";
  };
}

/**
 * Wichita & Sedgwick County Property Data Service.
 *
 * IMPORTANT: the current repository ships with representative staging fixtures only.
 * They exercise seller/VICTOR workflows but are NOT a live Sedgwick County retrieval.
 * A future production adapter may return LIVE_PUBLIC_RECORD data once separately verified.
 */
export class WichitaPropertyService {
  public static async lookupPublicRecord(query: PropertyLookupQuery): Promise<WichitaPublicPropertyRecord | null> {
    const cleanAddr = query.address.trim().toUpperCase();

    OcgObservability.log("RETRIEVAL_SOURCE_ACCESSED", {
      source: "OCG representative Wichita staging fixture",
      query: cleanAddr,
      mode: "STAGING_FIXTURE",
    });

    // Representative fixtures for deterministic workflow/QA coverage.
    // These values must never be presented as freshly retrieved county records.
    const fixtureDb: Record<string, Partial<WichitaPublicPropertyRecord>> = {
      "248 S RUTAN": {
        parcelId: "00142857",
        situsAddress: "248 S RUTAN AVE, WICHITA, KS 67218",
        taxDistrict: "0101 WICHITA CITY",
        appraisedLandValue: 28500,
        appraisedBuildingValue: 124200,
        totalAppraisedValue: 152700,
        priorYearTaxes: 2184.5,
        taxStatus: "Current",
        zoningCode: "SF-5",
        zoningDescription: "Single-Family Residential (5,000 sq ft min)",
        floodPlainStatus: "Zone X (Low Risk)",
        legalDescription: "LOTS 14-16 INC BLOCK 4 COLLEGE HILL 2ND ADD.",
        yearBuilt: 1932,
        livingAreaSqft: 1640,
      },
      "1421 N GLENDALE": {
        parcelId: "00198421",
        situsAddress: "1421 N GLENDALE AVE, WICHITA, KS 67208",
        taxDistrict: "0101 WICHITA CITY",
        appraisedLandValue: 34000,
        appraisedBuildingValue: 148500,
        totalAppraisedValue: 182500,
        priorYearTaxes: 2610.2,
        taxStatus: "Current",
        zoningCode: "SF-5",
        zoningDescription: "Single-Family Residential",
        floodPlainStatus: "Zone X (Low Risk)",
        legalDescription: "LOT 8 BLOCK 2 CROWN HEIGHTS ADD.",
        yearBuilt: 1965,
        livingAreaSqft: 1820,
      },
      "814 N DELANO": {
        parcelId: "00244109",
        situsAddress: "814 N DELANO ST, WICHITA, KS 67203",
        taxDistrict: "0101 WICHITA CITY",
        appraisedLandValue: 16500,
        appraisedBuildingValue: 74200,
        totalAppraisedValue: 90700,
        priorYearTaxes: 1298.4,
        taxStatus: "Current",
        zoningCode: "TF-3",
        zoningDescription: "Two-Family Residential / Multi-Option",
        floodPlainStatus: "Zone X (Low Risk)",
        legalDescription: "LOTS 3-5 BLOCK 8 DELANO ADD.",
        yearBuilt: 1922,
        livingAreaSqft: 1280,
      },
    };

    if (!cleanAddr) return null;

    const matchedEntry = Object.entries(fixtureDb).find(([key]) => cleanAddr.includes(key));
    if (!matchedEntry) {
      OcgObservability.log("RETRIEVAL_UNMATCHED_HONEST_FAILURE", {
        query: cleanAddr,
        mode: "STAGING_FIXTURE",
      });
      return null;
    }

    const record = matchedEntry[1];
    return {
      parcelId: record.parcelId!,
      situsAddress: record.situsAddress!,
      taxDistrict: record.taxDistrict!,
      appraisedLandValue: record.appraisedLandValue!,
      appraisedBuildingValue: record.appraisedBuildingValue!,
      totalAppraisedValue: record.totalAppraisedValue!,
      priorYearTaxes: record.priorYearTaxes!,
      taxStatus: record.taxStatus!,
      zoningCode: record.zoningCode!,
      zoningDescription: record.zoningDescription!,
      floodPlainStatus: record.floodPlainStatus!,
      legalDescription: record.legalDescription!,
      yearBuilt: record.yearBuilt!,
      livingAreaSqft: record.livingAreaSqft!,
      provenance: {
        source: "OCG representative Wichita staging fixture — not live county retrieval",
        retrievalTimestamp: new Date().toISOString(),
        certainty: "PROVISIONAL",
        mode: "STAGING_FIXTURE",
      },
    };
  }

  /** Convert a source record to the canonical VICTOR property-intelligence shape. */
  public static toPropertyIntelligenceRecord(pub: WichitaPublicPropertyRecord): IPropertyIntelligenceRecord {
    const now = pub.provenance.retrievalTimestamp;
    const source = pub.provenance.source;
    const sourceCertainty = pub.provenance.certainty;
    const estArv = Math.round(pub.livingAreaSqft * 145);
    const estRehab = Math.round(pub.livingAreaSqft * 32);
    const mao = Math.max(Math.round(estArv * 0.7) - estRehab, 0);

    return {
      id: `prop_${pub.parcelId}`,
      address: pub.situsAddress,
      city: "Wichita",
      state: "KS",
      zip: pub.situsAddress.match(/\b\d{5}\b/)?.[0] || "67208",
      sedgwickCountyParcelId: {
        value: pub.parcelId,
        certainty: sourceCertainty,
        source,
        retrievalTimestamp: now,
      },
      legalDescription: {
        value: pub.legalDescription,
        certainty: sourceCertainty,
        source,
        retrievalTimestamp: now,
      },
      propertyType: {
        value: pub.yearBuilt < 1945 ? "Single Family Craftsman" : "Mid-Century Ranch",
        certainty: "ESTIMATED",
        source: "Year Built Classification Heuristic",
        retrievalTimestamp: now,
      },
      sqft: {
        value: pub.livingAreaSqft,
        certainty: sourceCertainty,
        source,
        retrievalTimestamp: now,
      },
      yearBuilt: {
        value: pub.yearBuilt,
        certainty: sourceCertainty,
        source,
        retrievalTimestamp: now,
      },
      bedrooms: {
        value: pub.livingAreaSqft > 1600 ? 3 : 2,
        certainty: "PROVISIONAL",
        source: "Architectural Archetype Modeling",
        retrievalTimestamp: now,
      },
      bathrooms: {
        value: pub.livingAreaSqft > 1500 ? 2 : 1,
        certainty: "PROVISIONAL",
        source: "Architectural Archetype Modeling",
        retrievalTimestamp: now,
      },
      arvRetailEstimate: {
        value: estArv,
        certainty: "ESTIMATED",
        source: "VICTOR preliminary $/sqft heuristic — not verified closed comps",
        retrievalTimestamp: now,
        confidenceScore: pub.provenance.mode === "LIVE_PUBLIC_RECORD" ? 0.7 : 0.5,
      },
      rehabScopeEstimate: {
        value: estRehab,
        certainty: "ESTIMATED",
        source: "Wichita representative $/sqft unit-rate heuristic",
        retrievalTimestamp: now,
      },
      maximumAllowableOffer: {
        value: mao,
        certainty: "ESTIMATED",
        source: "70% screening framework: (estimated ARV × 0.70) − estimated rehab",
        retrievalTimestamp: now,
      },
      projectedMonthlyRent: {
        value: Math.round(estArv * 0.008),
        certainty: "ESTIMATED",
        source: "Representative Wichita rent heuristic — market verification required",
        retrievalTimestamp: now,
      },
      foundationInspectionStatus: "PROFESSIONAL_VERIFICATION_REQ",
      roofAgeAndCondition: "PROFESSIONAL_VERIFICATION_REQ",
      mepSystemsCondition: "PROFESSIONAL_VERIFICATION_REQ",
      floodPlainZone: {
        value: pub.floodPlainStatus,
        certainty: sourceCertainty,
        source,
        retrievalTimestamp: now,
      },
      taxDelinquencyStatus: {
        value: pub.taxStatus === "Delinquent" ? "Delinquent" : "Current",
        certainty: sourceCertainty,
        source,
        retrievalTimestamp: now,
      },
    };
  }
}
