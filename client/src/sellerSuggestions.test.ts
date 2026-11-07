import { describe, expect, it, vi, afterEach } from "vitest";
import handler from "../../netlify/functions/seller-suggestions.mts";

afterEach(() => vi.unstubAllGlobals());

describe("Sedgwick address suggestions", () => {
  it("falls back to a single verified parcel only for a complete typed address", async () => {
    const previous = process.env.OCGICT_SEDGWICK_GIS_ENABLED;
    process.env.OCGICT_SEDGWICK_GIS_ENABLED = "true";
    const fetcher = vi.fn(async (url: URL | string) => {
      if (String(url).includes("photon.komoot.io")) return new Response(JSON.stringify({ features: [] }), { status: 200 });
      return new Response(JSON.stringify({ features: [{ attributes: {
        PIN: "00155777", Prop_Addr: "248 S RUTAN AVE", Prop_City: "WICHITA", Prop_zip: "67218",
      } }] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetcher);
    try {
      const response = await handler(new Request("https://ocgict.com/api/seller/address-suggestions?q=248%20S%20Rutan%20Ave"));
      expect(response.status).toBe(200);
      expect((await response.json() as { suggestions: string[] }).suggestions).toEqual(["248 S RUTAN AVE, WICHITA, KS 67218"]);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(String(fetcher.mock.calls[1][0])).toContain("Property_and_Location");
    } finally {
      if (previous === undefined) delete process.env.OCGICT_SEDGWICK_GIS_ENABLED;
      else process.env.OCGICT_SEDGWICK_GIS_ENABLED = previous;
    }
  });
  it("uses the typed query and filters by returned Sedgwick County metadata", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      features: [
        { properties: { housenumber: "123", street: "Main Street", city: "Derby", state: "KS", county: "Sedgwick", country: "United States", postcode: "67037" } },
        { properties: { housenumber: "123", street: "Main Street", city: "Andover", state: "KS", county: "Butler", country: "United States", postcode: "67002" } },
        { properties: { housenumber: "123", street: "Main Street", city: "Wichita", state: "KS", county: "Sedgwick", country: "United States", postcode: "67202" } },
      ],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);

    const response = await handler(new Request("https://ocgict.com/api/seller/address-suggestions?q=123%20Main"));
    expect(response.status).toBe(200);
    const body = await response.json() as { suggestions: string[] };
    expect(body.suggestions).toContain("123 Main Street, Derby, KS 67037");
    expect(body.suggestions).toContain("123 Main Street, Wichita, KS 67202");
    expect(body.suggestions.some((item) => item.includes("Andover"))).toBe(false);
    const requested = new URL(String(fetcher.mock.calls[0][0]));
    expect(requested.searchParams.get("q")).toBe("123 Main");
  });
});
