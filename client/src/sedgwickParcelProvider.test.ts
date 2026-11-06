import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupSedgwickParcel } from "../../server/services/sedgwickParcelProvider.js";

function feature(overrides: Record<string, unknown> = {}) {
  return {
    attributes: {
      PIN: "00582408",
      Prop_Addr: "455 N MAIN ST",
      Prop_City: "WICHITA",
      Prop_zip: "67202",
      Prop_AddrUnit: "",
      TaxUnit: "WICHITA",
      LandVal: 100000,
      ImprVal: 200000,
      TotVal: 300000,
      YrBuilt: 1976,
      SFLA: 1200,
      BedRooms: 3,
      FullBath: 1,
      HalfBath: 1,
      Legal: "LOT 1 BLOCK 1",
      FunctionDs: "Single Family Residential",
      ...overrides,
    },
  };
}

function mockFetch(body: unknown, status = 200) {
  const fetcher = vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  return fetcher;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Sedgwick parcel provider", () => {
  it("returns only the exact parcel attributes requested for a seller-submitted address", async () => {
    const fetcher = mockFetch({ features: [feature()] });
    const result = await lookupSedgwickParcel("455 North Main Street, Wichita, KS 67202", fetcher);

    expect(result.status).toBe("matched");
    if (result.status !== "matched") return;
    expect(result.record).toMatchObject({
      parcelId: "00582408",
      situsAddress: "455 N MAIN ST",
      city: "WICHITA",
      state: "KS",
      zip: "67202",
      yearBuilt: 1976,
      livingAreaSqft: 1200,
      bedrooms: 3,
      bathrooms: 1.5,
      totalAppraisedValue: 300000,
      provenance: { certainty: "KNOWN" },
    });

    const requested = new URL(String(fetcher.mock.calls[0][0]));
    expect(requested.searchParams.get("where")).toContain("UPPER(Prop_Addr) = '455 N MAIN ST'");
    expect(requested.searchParams.get("where")).toContain("UPPER(Prop_City) = 'WICHITA'");
    expect(requested.searchParams.get("where")).toContain("Prop_zip = '67202'");
    const fields = requested.searchParams.get("outFields") || "";
    expect(fields).toContain("PIN");
    expect(fields).toContain("SFLA");
    expect(fields).not.toContain("Owner");
    expect(fields).not.toContain("Owner_madd");
    expect(fields).not.toContain("Mail");
  });

  it("returns ambiguous instead of selecting one of multiple parcel rows", async () => {
    const fetcher = mockFetch({ features: [feature({ Prop_Addr: "456 N MAIN ST" }), feature({ PIN: "00582409", Prop_Addr: "456 N MAIN ST", Prop_AddrUnit: "2" })] });
    const result = await lookupSedgwickParcel("456 N Main St, Wichita, KS 67202", fetcher);
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") expect(result.candidates).toHaveLength(2);
  });

  it("returns not_found for an exact address with no parcel result", async () => {
    const result = await lookupSedgwickParcel("99999 Test Street, Wichita, KS 67202", mockFetch({ features: [] }));
    expect(result.status).toBe("not_found");
  });

  it("rejects malformed addresses before calling the provider", async () => {
    const fetcher = mockFetch({ features: [] });
    const result = await lookupSedgwickParcel("Wichita, KS", fetcher);
    expect(result.status).toBe("invalid_address");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects non-Kansas locations before calling the Sedgwick provider", async () => {
    const fetcher = mockFetch({ features: [] });
    const result = await lookupSedgwickParcel("10 Main Street, Denver, CO 80202", fetcher);
    expect(result.status).toBe("unsupported_location");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports provider failures honestly and does not fabricate a match", async () => {
    const result = await lookupSedgwickParcel("100 Test Street, Wichita, KS", mockFetch({}, 503));
    expect(result.status).toBe("provider_unavailable");
    if (result.status === "provider_unavailable") expect(result.retryable).toBe(true);
  });
});
