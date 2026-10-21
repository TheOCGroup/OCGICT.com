import { jsonHeaders } from "./_forms.js";

/**
 * GET /api/seller/address-suggestions — Netlify edition of the Express route.
 * Low-volume, no-key address suggestions from Photon, restricted to Wichita,
 * KS matches with the same precision filtering as the server build.
 */
const cache = new Map<string, { expires: number; results: string[] }>();
let lastRequest = 0;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: jsonHeaders });
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 4 || !/^[a-zA-Z0-9 ,.#'-]+$/.test(q)) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200, headers: jsonHeaders });
  }
  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return new Response(JSON.stringify({ suggestions: cached.results }), { status: 200, headers: jsonHeaders });
  }
  if (Date.now() - lastRequest < 1200) {
    return new Response(JSON.stringify({ suggestions: [], retry: true }), { status: 429, headers: jsonHeaders });
  }
  lastRequest = Date.now();
  try {
    const upstream = new URL("https://photon.komoot.io/api/");
    upstream.searchParams.set("q", /wichita|kansas|\bks\b/i.test(q) ? q : `${q} Wichita Kansas`);
    upstream.searchParams.set("lat", "37.6872");
    upstream.searchParams.set("lon", "-97.3301");
    upstream.searchParams.set("limit", "30");
    const res = await fetch(upstream, {
      signal: AbortSignal.timeout(4500),
      headers: { "User-Agent": "OCGICT-SellerAddress/1.0 (theocgroup.netlify.app)" },
    });
    if (!res.ok) throw new Error("upstream unavailable");
    const body = (await res.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };
    const suggestions = Array.from(
      new Set(
        (body.features || [])
          .map(({ properties: p }) => {
            const house = String(p?.housenumber || "").trim();
            const street = String(p?.street || "").trim();
            const city = String(p?.city || p?.locality || "").trim();
            const state = String(p?.state || "").trim();
            if (!house || !street || city.toLowerCase() !== "wichita" || (state && !["Kansas", "KS"].includes(state))) return "";
            return `${house} ${street}, ${city}, KS`;
          })
          .filter(Boolean),
      ),
    )
      .filter((candidate) => {
        const normalized = (value: string) => value.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
        const typed = normalized(q).replace(/\b(wichita|kansas|ks)\b/g, "").trim();
        const match = typed.match(/^(\d+)\s+(.+)$/);
        const proposed = normalized(candidate);
        if (match) {
          if (!proposed.startsWith(match[1] + " ")) return false;
          const words = match[2]
            .split(" ")
            .filter((word) => !["n", "s", "e", "w", "north", "south", "east", "west", "st", "street", "ave", "avenue", "rd", "road"].includes(word));
          return words.every((word) => proposed.includes(word));
        }
        return typed.split(" ").filter(Boolean).every((word) => proposed.includes(word));
      })
      .slice(0, 6);
    if (cache.size > 150) cache.clear();
    cache.set(key, { results: suggestions, expires: Date.now() + 120000 });
    return new Response(JSON.stringify({ suggestions }), { status: 200, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ suggestions: [], unavailable: true }), { status: 503, headers: jsonHeaders });
  }
}

export const config = {
  path: "/api/seller/address-suggestions",
  method: "GET",
  rateLimit: { action: "rate_limit", aggregateBy: "ip", windowSize: 60, windowLimit: 30 },
};
