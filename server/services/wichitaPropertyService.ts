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
  };
}

function getDataMode(): "production" | "development" | "demo" {
  const configured = (process.env.OCGICT_DATA_MODE || "").toLowerCase();
  if (configured === "demo") return "demo";
  if (configured === "development") return "development";
  return "production";
}

/**
 * Wichita & Sedgwick County Property Data Service.
 *
 * Production rule: this service MUST NOT silently substitute demo parcel records
 * for an unavailable live provider. Until the real Sedgwick County provider is
 * connected, production lookups return null and the seller workflow must route
 * to manual review.
 */
export class WichitaPropertyService {
  public static async lookupPublicRecord(query: PropertyLookupQuery): Promise<WichitaPublicPropertyRecord | null> {
    const cleanAddr = query.address.trim().toUpperCase();
    const mode = getDataMode();

    if (!cleanAddr) return null;

    OcgObservability.log("RETRIEVAL_SOURCE_ACCESSED", {
      source: mode === "production" ? "Sedgwick County live provider" : "OCGICT demo property dataset",
      query: cleanAddr,
      mode,
    });

    // HARD PRODUCTION GATE.
    // A live Sedgwick County adapter will replace this return when connected.
    if (mode === "production") {
      OcgObservability.log("PROPERTY_PROVIDER_NOT_CONNECTED", {
        query: cleanAddr,
        behavior: "MANUAL_REVIEW_REQUIRED",
      });
      return null;
    }

    // Development/demo-only representative data. Never exposed as verified live data.
    const demoDb: Record<string, Partial<WichitaPublicPropertyRecord>> = {
      "248 S RUTAN": {
        parcelId: "DEMO-00142857",
        situsAddress: "248 S RUTAN AVE, WICHITA, KS 67218",
        taxDistrict: "DEMO WICHITA",
        appraisedLandValue: 28500,
        appraisedBuildingValue: 124200,
        totalAppraisedValue: 152700,
        priorYearTaxes: 2184.50,
        taxStatus: "Current",
        zoningCode: "SF-5",
        zoningDescription: "Single-Family Residential (Demo)",
        floodPlainStatus: "Zone X (Low Risk)",
        legalDescription: "DEMO RECORD — NOT FOR PRODUCTION UNDERWRITING",
        yearBuilt: 1932,
        livingAreaSqft: 1640,
      },
      "1421 N GLENDALE": {
        parcelId: "DEMO-00198421",
        situsAddress: "1421 N GLENDALE AVE, WICHITA, KS 67208",
        taxDistrict: "DEMO WICHITA",
        appraisedLandValue: 34000,
        appraisedBuildingValue: 148500,
        totalAppraisedValue: 182500,
        priorYearTaxes: 2610.20,
        taxStatus: "Current",
        zoningCode: "SF-5",
        zoningDescription: "Single-Family Residential (Demo)",
        floodPlainStatus: "Zone X (Low Risk)",
        legalDescription: "DEMO RECORD — NOT FOR PRODUCTION UNDERWRITING",
        yearBuilt: 1965,
        livingAreaSqft: 1820,
      },
      "814 N DELANO": {
        parcelId: "DEMO-00244109",
        situsAddress: "814 N DELANO ST, WICHITA, KS 67203",
        taxDistrict: "DEMO WICHITA",
        appraisedLandValue: 16500,
        appraisedBuildingValue: 74200,
        totalAppraisedValue: 90700,
        priorYearTaxes: 1298.40,
        taxStatus: "Current",
        zoningCode: "TF-3",
        zoningDescription: "Two-Family Residential / Multi-Option (Demo)",
        floodPlainStatus: "Zone X (Low Risk)",
        legalDescription: "DEMO RECORD — NOT FOR PRODUCTION UNDERWRITING",
        yearBuilt: 1922,
        livingAreaSqft: 1280,
      },
    };

    const matchedEntry = Object.entries(demoDb).find(([key]) => cleanAddr.includes(key));
    if (!matchedEntry) {
      OcgObservability.log("RETRIEVAL_UNMATCHED_HONEST_FAILURE", { query: cleanAddr, mode });
      return null;
    }

    const record = matchedEntry[1];
    const now = new Date().toISOString();
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
        source: "OCGICT DEMO DATASET — NOT LIVE SEDGWICK COUNTY DATA",
        retrievalTimestamp: now,
        certainty: "PROVISIONAL",
      },
    };
  }

  public static toPropertyIntelligenceRecord(pub: WichitaPublicPropertyRecord): IPropertyIntelligenceRecord {
    const now = pub.provenance.retrievalTimestamp;
    const estArv = Math.round(pub.livingAreaSqft * 145);
    const estRehab = Math.round(pub.livingAreaSqft * 32);
    const mao = Math.max(Math.round(estArv * 0.70) - estRehab, 0);

    return {
      id: `prop_${pub.parcelId}`,
      address: pub.situsAddress,
      city: "Wichita",
      state: "KS",
      zip: pub.situsAddress.match(/\b\d{5}\b/)?.[0] || "67208",
      sedgwickCountyParcelId: { value: pub.parcelId, certainty: pub.provenance.certainty, source: pub.provenance.source, retrievalTimestamp: now },
      legalDescription: { value: pub.legalDescription, certainty: pub.provenance.certainty, source: pub.provenance.source, retrievalTimestamp: now },
      propertyType: { value: pub.yearBuilt < 1945 ? "Single Family Craftsman" : "Mid-Century Ranch", certainty: "ESTIMATED", source: "Year Built Classification Heuristic", retrievalTimestamp: now },
      sqft: { value: pub.livingAreaSqft, certainty: pub.provenance.certainty, source: pub.provenance.source, retrievalTimestamp: now },
      yearBuilt: { value: pub.yearBuilt, certainty: pub.provenance.certainty, source: pub.provenance.source, retrievalTimestamp: now },
      bedrooms: { value: pub.livingAreaSqft > 1600 ? 3 : 2, certainty: "PROVISIONAL", source: "Architectural Archetype Modeling", retrievalTimestamp: now },
      bathrooms: { value: pub.livingAreaSqft > 1500 ? 2 : 1, certainty: "PROVISIONAL", source: "Architectural Archetype Modeling", retrievalTimestamp: now },
      arvRetailEstimate: { value: estArv, certainty: "ESTIMATED", source: "DEMO/HEURISTIC — HUMAN VERIFICATION REQUIRED", retrievalTimestamp: now, confidenceScore: 0.5 },
      rehabScopeEstimate: { value: estRehab, certainty: "ESTIMATED", source: "Wichita Unit Rate Heuristic", retrievalTimestamp: now },
      maximumAllowableOffer: { value: mao, certainty: "ESTIMATED", source: "70% Rule Heuristic — NOT SELLER-FACING IN PRODUCTION", retrievalTimestamp: now },
      projectedMonthlyRent: { value: Math.round(estArv * 0.008), certainty: "ESTIMATED", source: "Wichita Rent Heuristic", retrievalTimestamp: now },
      foundationInspectionStatus: "PROFESSIONAL_VERIFICATION_REQ",
      roofAgeAndCondition: "PROFESSIONAL_VERIFICATION_REQ",
      mepSystemsCondition: "PROFESSIONAL_VERIFICATION_REQ",
      floodPlainZone: { value: pub.floodPlainStatus, certainty: pub.provenance.certainty, source: pub.provenance.source, retrievalTimestamp: now },
      taxDelinquencyStatus: { value: pub.taxStatus === "Delinquent" ? "Delinquent" : "Current", certainty: pub.provenance.certainty, source: pub.provenance.source, retrievalTimestamp: now },
    };
  }
}
