/**
 * Single-address Sedgwick County parcel lookup through the City of Wichita
 * GIS public Property_and_Location layer.
 *
 * Scope controls:
 * - Query only the address supplied by the seller; never bulk enumerate.
 * - Never request or return owner names or mailing addresses.
 * - Never query the County's restricted real-property sales information.
 * - Parcel/appraisal attributes are not condition evidence or comparable sales.
 * - Production activation is separately gated by OCGICT_SEDGWICK_GIS_ENABLED.
 */
export const SEDGWICK_PARCEL_SOURCE =
  "City of Wichita GIS / Property_and_Location Parcels (Sedgwick County property attributes)";
export const SEDGWICK_PARCEL_QUERY_URL =
  "https://gismaps.wichita.gov/ageweb/rest/services/COWGIS/Property_and_Location/MapServer/4/query";

export interface SedgwickParcelCandidate {
  parcelId: string;
  situsAddress: string;
  city: string;
  state: "KS";
  zip: string;
  unit?: string;
}

export interface SedgwickParcelRecord extends SedgwickParcelCandidate {
  taxDistrict?: string;
  appraisedLandValue?: number;
  appraisedBuildingValue?: number;
  totalAppraisedValue?: number;
  yearBuilt?: number;
  livingAreaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  legalDescription?: string;
  propertyUseDescription?: string;
  provenance: {
    source: string;
    retrievalTimestamp: string;
    certainty: "KNOWN";
  };
}

export type SedgwickParcelResolution =
  | { status: "matched"; source: string; retrievedAt: string; record: SedgwickParcelRecord }
  | { status: "not_found"; source: string; retrievedAt: string }
  | { status: "ambiguous"; source: string; retrievedAt: string; candidates: SedgwickParcelCandidate[] }
  | { status: "invalid_address"; source: string; retrievedAt: string; reason: string }
  | { status: "unsupported_location"; source: string; retrievedAt: string; reason: string }
  | { status: "provider_unavailable"; source: string; retrievedAt: string; reason: string; retryable: boolean };

interface ParsedAddress {
  street: string;
  city?: string;
  zip?: string;
  unit?: string;
}

interface ArcGisFeature {
  attributes?: Record<string, unknown>;
}

interface ArcGisResponse {
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  error?: { message?: string };
}

const cache = new Map<string, { expiresAt: number; result: SedgwickParcelResolution }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 300;

function normalizeStreet(value: string): string {
  const suffixes: Record<string, string> = {
    STREET: "ST", AVENUE: "AVE", ROAD: "RD", DRIVE: "DR", LANE: "LN",
    COURT: "CT", CIRCLE: "CIR", BOULEVARD: "BLVD", PLACE: "PL",
    TERRACE: "TER", PARKWAY: "PKWY", HIGHWAY: "HWY", TRAIL: "TRL",
    NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W",
  };
  return value.toUpperCase().replace(/\./g, "").replace(/,/g, " ")
    .trim().split(/\s+/).filter(Boolean).map((part) => suffixes[part] || part).join(" ");
}

function parseAddress(input: string): ParsedAddress | { error: "invalid" | "unsupported"; reason: string } {
  const parts = input.split(",").map((part) => part.trim()).filter(Boolean);
  let streetInput = parts[0] || "";
  const unitMatch = streetInput.match(/\b(?:APT|APARTMENT|UNIT|STE|SUITE|#)\s*([A-Z0-9-]+)\s*$/i);
  const unit = unitMatch?.[1]?.toUpperCase();
  if (unitMatch) streetInput = streetInput.slice(0, unitMatch.index).trim();

  const street = normalizeStreet(streetInput);
  if (!/^\d+[A-Z]?\s+/.test(street)) {
    return { error: "invalid", reason: "Enter a street number and street name." };
  }

  const remainder = parts.slice(1).join(" ").toUpperCase();
  const stateMatch = remainder.match(/\b([A-Z]{2}|KANSAS)\b/);
  if (stateMatch && !["KS", "KANSAS"].includes(stateMatch[1])) {
    return { error: "unsupported", reason: "The Sedgwick County provider only covers Kansas properties." };
  }
  const zip = remainder.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1];
  const city = parts.length > 1
    ? parts[1].replace(/\b(?:KS|KANSAS)\b/gi, "").replace(/\b\d{5}(?:-\d{4})?\b/g, "").trim()
    : undefined;

  return { street, city: city ? normalizeStreet(city) : undefined, zip, unit };
}

function sqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return value;
}

function candidateFrom(attributes: Record<string, unknown>): SedgwickParcelCandidate | null {
  const parcelId = text(attributes.PIN);
  const address = text(attributes.Prop_Addr);
  const city = text(attributes.Prop_City);
  if (!parcelId || !address || !city) return null;
  return {
    parcelId,
    situsAddress: address,
    city,
    state: "KS",
    zip: text(attributes.Prop_zip) || "",
    unit: text(attributes.Prop_AddrUnit),
  };
}

function cacheResult(key: string, result: SedgwickParcelResolution): SedgwickParcelResolution {
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function lookupSedgwickParcel(
  input: string,
  fetcher: typeof fetch = fetch,
): Promise<SedgwickParcelResolution> {
  const retrievedAt = new Date().toISOString();
  const parsed = parseAddress(input);
  if ("error" in parsed) {
    return parsed.error === "unsupported"
      ? { status: "unsupported_location", source: SEDGWICK_PARCEL_SOURCE, retrievedAt, reason: parsed.reason }
      : { status: "invalid_address", source: SEDGWICK_PARCEL_SOURCE, retrievedAt, reason: parsed.reason };
  }

  const cacheKey = [parsed.street, parsed.city || "", parsed.zip || "", parsed.unit || ""].join("|").toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const clauses = ["UPPER(Prop_Addr) = '" + sqlLiteral(parsed.street) + "'"];
  if (parsed.city) clauses.push("UPPER(Prop_City) = '" + sqlLiteral(parsed.city) + "'");
  if (parsed.zip) clauses.push("Prop_zip = '" + sqlLiteral(parsed.zip) + "'");

  const url = new URL(SEDGWICK_PARCEL_QUERY_URL);
  url.searchParams.set("where", clauses.join(" AND "));
  url.searchParams.set("outFields", [
    "PIN", "Prop_Addr", "Prop_City", "Prop_zip", "Prop_AddrUnit", "TaxUnit",
    "LandVal", "ImprVal", "TotVal", "YrBuilt", "SFLA", "BedRooms",
    "FullBath", "HalfBath", "Legal", "FunctionDs",
  ].join(","));
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", "10");
  url.searchParams.set("f", "json");

  try {
    const response = await fetcher(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) {
      return {
        status: "provider_unavailable", source: SEDGWICK_PARCEL_SOURCE, retrievedAt,
        reason: response.status === 429 ? "rate_limited" : "upstream_http_error",
        retryable: response.status === 429 || response.status >= 500,
      };
    }
    const body = await response.json() as ArcGisResponse;
    if (body.error || !Array.isArray(body.features)) {
      return {
        status: "provider_unavailable", source: SEDGWICK_PARCEL_SOURCE, retrievedAt,
        reason: body.error?.message ? "provider_error" : "invalid_provider_response",
        retryable: true,
      };
    }

    const matched = body.features.map((feature) => {
      if (!feature.attributes) return null;
      const candidate = candidateFrom(feature.attributes);
      return candidate ? { candidate, attributes: feature.attributes } : null;
    }).filter((item): item is { candidate: SedgwickParcelCandidate; attributes: Record<string, unknown> } => !!item)
      .filter((item) => !parsed.unit || item.candidate.unit?.toUpperCase() === parsed.unit);

    if (body.exceededTransferLimit || matched.length > 1) {
      return cacheResult(cacheKey, {
        status: "ambiguous", source: SEDGWICK_PARCEL_SOURCE, retrievedAt,
        candidates: matched.slice(0, 10).map((item) => item.candidate),
      });
    }
    if (matched.length === 0) {
      return cacheResult(cacheKey, { status: "not_found", source: SEDGWICK_PARCEL_SOURCE, retrievedAt });
    }

    const { candidate, attributes } = matched[0];
    const fullBath = number(attributes.FullBath);
    const halfBath = number(attributes.HalfBath);
    const bathrooms = fullBath === undefined && halfBath === undefined
      ? undefined
      : (fullBath || 0) + (halfBath || 0) * 0.5;

    const record: SedgwickParcelRecord = {
      ...candidate,
      taxDistrict: text(attributes.TaxUnit),
      appraisedLandValue: number(attributes.LandVal),
      appraisedBuildingValue: number(attributes.ImprVal),
      totalAppraisedValue: number(attributes.TotVal),
      yearBuilt: number(attributes.YrBuilt),
      livingAreaSqft: number(attributes.SFLA),
      bedrooms: number(attributes.BedRooms),
      bathrooms,
      legalDescription: text(attributes.Legal),
      propertyUseDescription: text(attributes.FunctionDs),
      provenance: { source: SEDGWICK_PARCEL_SOURCE, retrievalTimestamp: retrievedAt, certainty: "KNOWN" },
    };
    return cacheResult(cacheKey, { status: "matched", source: SEDGWICK_PARCEL_SOURCE, retrievedAt, record });
  } catch (error) {
    return {
      status: "provider_unavailable", source: SEDGWICK_PARCEL_SOURCE, retrievedAt,
      reason: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network_error",
      retryable: true,
    };
  }
}
