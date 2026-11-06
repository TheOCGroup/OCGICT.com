import { afterEach, describe, expect, it, vi } from "vitest";
import { WichitaPropertyService, type WichitaPublicPropertyRecord } from "../../server/services/wichitaPropertyService.js";

const priorMode = process.env.OCGICT_DATA_MODE;
const priorProvider = process.env.OCGICT_SEDGWICK_GIS_ENABLED;

afterEach(() => {
  if (priorMode === undefined) delete process.env.OCGICT_DATA_MODE;
  else process.env.OCGICT_DATA_MODE = priorMode;
  if (priorProvider === undefined) delete process.env.OCGICT_SEDGWICK_GIS_ENABLED;
  else process.env.OCGICT_SEDGWICK_GIS_ENABLED = priorProvider;
  vi.unstubAllGlobals();
});

describe("WichitaPropertyService production provider boundary", () => {
  it("keeps the live provider disabled unless the explicit flag is set", async () => {
    process.env.OCGICT_DATA_MODE = "production";
    delete process.env.OCGICT_SEDGWICK_GIS_ENABLED;
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    const result = await WichitaPropertyService.resolvePublicRecord({ address: "777 Test Street, Wichita, KS 67202" });
    expect(result.status).toBe("provider_unavailable");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns a provenance-backed record only when the provider flag is enabled", async () => {
    process.env.OCGICT_DATA_MODE = "production";
    process.env.OCGICT_SEDGWICK_GIS_ENABLED = "true";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      features: [{
        attributes: {
          PIN: "TEST0001", Prop_Addr: "777 TEST ST", Prop_City: "WICHITA", Prop_zip: "67202",
          TaxUnit: "WICHITA", LandVal: 20000, ImprVal: 80000, TotVal: 100000,
          YrBuilt: 1950, SFLA: 1100, BedRooms: 2, FullBath: 1, HalfBath: 0,
          Legal: "TEST LEGAL", FunctionDs: "Single Family Residential",
        },
      }],
    }), { status: 200 })));

    const result = await WichitaPropertyService.resolvePublicRecord({ address: "777 Test Street, Wichita, KS 67202" });
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.record).toMatchObject({
        parcelId: "TEST0001",
        city: "WICHITA",
        state: "KS",
        zip: "67202",
        livingAreaSqft: 1100,
        provenance: { certainty: "KNOWN" },
      });
    }
  });

  it("does not synthesize ARV, rehab, MAO, rent, condition, flood, or tax status", () => {
    const record: WichitaPublicPropertyRecord = {
      parcelId: "TEST0002",
      situsAddress: "100 TEST ST",
      city: "Wichita",
      state: "KS",
      zip: "67202",
      provenance: {
        source: "test source",
        retrievalTimestamp: new Date().toISOString(),
        certainty: "KNOWN",
      },
    };
    const victor = WichitaPropertyService.toPropertyIntelligenceRecord(record);
    expect(victor.arvRetailEstimate).toBeUndefined();
    expect(victor.rehabScopeEstimate).toBeUndefined();
    expect(victor.maximumAllowableOffer).toBeUndefined();
    expect(victor.projectedMonthlyRent).toBeUndefined();
    expect(victor.bedrooms).toBeUndefined();
    expect(victor.bathrooms).toBeUndefined();
    expect(victor.floodPlainZone).toBeUndefined();
    expect(victor.taxDelinquencyStatus).toBeUndefined();
    expect(victor.foundationInspectionStatus).toBe("PROFESSIONAL_VERIFICATION_REQ");
    expect(victor.roofAgeAndCondition).toBe("PROFESSIONAL_VERIFICATION_REQ");
    expect(victor.mepSystemsCondition).toBe("PROFESSIONAL_VERIFICATION_REQ");
  });
});
