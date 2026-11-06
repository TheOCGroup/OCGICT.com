import type { IDataFieldProvenance, IPropertyIntelligenceRecord, DataCertaintyLevel } from "../../shared/contracts.js";
import { OcgObservability } from "./observability.js";
import { lookupSedgwickParcel, type SedgwickParcelResolution } from "./sedgwickParcelProvider.js";

export interface PropertyLookupQuery {
  address: string;
  parcelPin?: string;
  zipCode?: string;
}

export interface WichitaPublicPropertyRecord {
  parcelId: string;
  situsAddress: string;
  city: string;
  state: string;
  zip: string;
  taxDistrict?: string;
  appraisedLandValue?: number;
  appraisedBuildingValue?: number;
  totalAppraisedValue?: number;
  priorYearTaxes?: number;
  taxStatus?: "Current" | "Delinquent" | "Exempt";
  zoningCode?: string;
  zoningDescription?: string;
  floodPlainStatus?: "Zone X (Low Risk)" | "Zone AE (100-Year Floodway / High Risk)";
  legalDescription?: string;
  propertyUseDescription?: string;
  yearBuilt?: number;
  livingAreaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  provenance: {
    source: string;
    retrievalTimestamp: string;
    certainty: DataCertaintyLevel;
  };
}

export type PropertyResolution =
  | { status: "matched"; source: string; retrievedAt: string; record: WichitaPublicPropertyRecord }
  | { status: "not_found"; source: string; retrievedAt: string }
  | { status: "ambiguous"; source: string; retrievedAt: string; candidates: Array<{ parcelId: string; situsAddress: string; city: string; zip: string }> }
  | { status: "invalid_address"; source: string; retrievedAt: string; reason: string }
  | { status: "unsupported_location"; source: string; retrievedAt: string; reason: string }
  | { status: "provider_unavailable"; source: string; retrievedAt: string; reason: string; retryable: boolean };

function getDataMode(): "production" | "development" | "demo" {
  const configured = (process.env.OCGICT_DATA_MODE || "").toLowerCase();
  if (configured === "demo") return "demo";
  if (configured === "development") return "development";
  return "production";
}

function toWichitaRecord(record: NonNullable<Extract<SedgwickParcelResolution, { status: "matched" }>["record"]>): WichitaPublicPropertyRecord {
  return {
    parcelId: record.parcelId,
    situsAddress: record.situsAddress,
    city: record.city,
    state: record.state,
    zip: record.zip,
    taxDistrict: record.taxDistrict,
    appraisedLandValue: record.appraisedLandValue,
    appraisedBuildingValue: record.appraisedBuildingValue,
    totalAppraisedValue: record.totalAppraisedValue,
    yearBuilt: record.yearBuilt,
    livingAreaSqft: record.livingAreaSqft,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    legalDescription: record.legalDescription,
    propertyUseDescription: record.propertyUseDescription,
    provenance: record.provenance,
  };
}

function demoRecord(address: string): WichitaPublicPropertyRecord | null {
  const clean = address.trim().toUpperCase();
  const demoDb: Record<string, Omit<WichitaPublicPropertyRecord, "provenance">> = {
    "248 S RUTAN": {
      parcelId: "DEMO-00142857", situsAddress: "248 S RUTAN AVE", city: "Wichita", state: "KS", zip: "67218",
      taxDistrict: "DEMO WICHITA", appraisedLandValue: 28500, appraisedBuildingValue: 124200,
      totalAppraisedValue: 152700, yearBuilt: 1932, livingAreaSqft: 1640, bedrooms: 3, bathrooms: 2,
      propertyUseDescription: "Single-family residential (demo)",
      legalDescription: "DEMO RECORD — NOT FOR PRODUCTION UNDERWRITING",
      zoningDescription: "Single-Family Residential (Demo)", floodPlainStatus: "Zone X (Low Risk)",
      taxStatus: "Current",
    },
    "1421 N GLENDALE": {
      parcelId: "DEMO-00198421", situsAddress: "1421 N GLENDALE AVE", city: "Wichita", state: "KS", zip: "67208",
      taxDistrict: "DEMO WICHITA", appraisedLandValue: 34000, appraisedBuildingValue: 148500,
      totalAppraisedValue: 182500, yearBuilt: 1965, livingAreaSqft: 1820, bedrooms: 3, bathrooms: 2,
      propertyUseDescription: "Single-family residential (demo)",
      legalDescription: "DEMO RECORD — NOT FOR PRODUCTION UNDERWRITING",
      zoningDescription: "Single-Family Residential (Demo)", floodPlainStatus: "Zone X (Low Risk)",
      taxStatus: "Current",
    },
    "814 N DELANO": {
      parcelId: "DEMO-00244109", situsAddress: "814 N DELANO ST", city: "Wichita", state: "KS", zip: "67203",
      taxDistrict: "DEMO WICHITA", appraisedLandValue: 16500, appraisedBuildingValue: 74200,
      totalAppraisedValue: 90700, yearBuilt: 1922, livingAreaSqft: 1280, bedrooms: 2, bathrooms: 1,
      propertyUseDescription: "Two-family residential (demo)",
      legalDescription: "DEMO RECORD — NOT FOR PRODUCTION UNDERWRITING",
      zoningDescription: "Two-Family Residential / Multi-Option (Demo)", floodPlainStatus: "Zone X (Low Risk)",
      taxStatus: "Current",
    },
  };
  const entry = Object.entries(demoDb).find(([key]) => clean.includes(key));
  if (!entry) return null;
  return {
    ...entry[1],
    provenance: {
      source: "OCGICT DEMO DATASET — NOT LIVE SEDGWICK COUNTY DATA",
      retrievalTimestamp: new Date().toISOString(),
      certainty: "PROVISIONAL",
    },
  };
}

/**
 * Production provider is opt-in and fail-closed. It performs one exact,
 * seller-submitted address lookup against the public parcel/appraisal layer.
 * No owner/mailing fields or sales/comparable-sale data are requested.
 */
export class WichitaPropertyService {
  public static async resolvePublicRecord(query: PropertyLookupQuery): Promise<PropertyResolution> {
    const address = query.address.trim();
    const mode = getDataMode();
    const retrievedAt = new Date().toISOString();

    if (!address) {
      return { status: "invalid_address", source: "OCGICT", retrievedAt, reason: "An address is required." };
    }

    if (mode === "production") {
      if (process.env.OCGICT_SEDGWICK_GIS_ENABLED !== "true") {
        OcgObservability.log("PROPERTY_PROVIDER_DISABLED", { mode, status: "provider_unavailable" });
        return {
          status: "provider_unavailable",
          source: "Sedgwick County GIS provider (not activated)",
          retrievedAt,
          reason: "provider_not_enabled",
          retryable: false,
        };
      }
      const result = await lookupSedgwickParcel(address);
      if (result.status !== "matched") {
        OcgObservability.log("PROPERTY_LOOKUP_RESULT", { mode, status: result.status, source: result.source });
        return result as PropertyResolution;
      }
      OcgObservability.log("PROPERTY_LOOKUP_RESULT", { mode, status: "matched", source: result.source });
      return {
        status: "matched",
        source: result.source,
        retrievedAt: result.retrievedAt,
        record: toWichitaRecord(result.record),
      };
    }

    const demo = demoRecord(address);
    if (!demo) {
      OcgObservability.log("PROPERTY_LOOKUP_RESULT", { mode, status: "not_found", source: "OCGICT demo dataset" });
      return { status: "not_found", source: "OCGICT demo dataset", retrievedAt };
    }
    OcgObservability.log("PROPERTY_LOOKUP_RESULT", { mode, status: "matched", source: demo.provenance.source });
    return { status: "matched", source: demo.provenance.source, retrievedAt: demo.provenance.retrievalTimestamp, record: demo };
  }

  /** Compatibility wrapper for existing underwriting callers. */
  public static async lookupPublicRecord(query: PropertyLookupQuery): Promise<WichitaPublicPropertyRecord | null> {
    const result = await this.resolvePublicRecord(query);
    return result.status === "matched" ? result.record : null;
  }

  /**
   * Convert only sourced facts into VICTOR's property record. No estimated
   * bedrooms/bathrooms, ARV, rent, rehab or MAO are synthesized here.
   */
  public static toPropertyIntelligenceRecord(pub: WichitaPublicPropertyRecord): IPropertyIntelligenceRecord {
    const now = pub.provenance.retrievalTimestamp;
    const certainty = pub.provenance.certainty;
    const source = pub.provenance.source;
    const field = <T>(value: T): IDataFieldProvenance<T> => ({
      value, certainty, source, retrievalTimestamp: now,
    });

    return {
      id: "prop_" + pub.parcelId,
      address: pub.situsAddress,
      city: pub.city,
      state: pub.state,
      zip: pub.zip,
      ...(pub.parcelId ? { sedgwickCountyParcelId: field(pub.parcelId) } : {}),
      ...(pub.legalDescription ? { legalDescription: field(pub.legalDescription) } : {}),
      ...(pub.propertyUseDescription ? { propertyType: field(pub.propertyUseDescription) } : {}),
      ...(pub.livingAreaSqft !== undefined ? { sqft: field(pub.livingAreaSqft) } : {}),
      ...(pub.yearBuilt !== undefined ? { yearBuilt: field(pub.yearBuilt) } : {}),
      ...(pub.bedrooms !== undefined ? { bedrooms: field(pub.bedrooms) } : {}),
      ...(pub.bathrooms !== undefined ? { bathrooms: field(pub.bathrooms) } : {}),
      foundationInspectionStatus: "PROFESSIONAL_VERIFICATION_REQ",
      roofAgeAndCondition: "PROFESSIONAL_VERIFICATION_REQ",
      mepSystemsCondition: "PROFESSIONAL_VERIFICATION_REQ",
      ...(pub.floodPlainStatus ? { floodPlainZone: field(pub.floodPlainStatus) } : {}),
      ...(pub.taxStatus ? { taxDelinquencyStatus: field(pub.taxStatus) } : {}),
    };
  }
}
