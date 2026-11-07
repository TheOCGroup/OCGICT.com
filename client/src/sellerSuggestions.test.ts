import { describe, expect, it, vi, afterEach } from "vitest";
import handler from "../../netlify/functions/seller-suggestions.mts";

afterEach(() => vi.unstubAllGlobals());

describe("Sedgwick address suggestions", () => {
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
