import { createServer } from "http";

async function runTests() {
  process.env.NODE_ENV = "production";
  process.env.VERCEL = "1";
  delete process.env.OCGICT_ENABLE_INTERNAL_ENDPOINTS;

  const { createApp } = await import("../index.js");
  const app = createApp();
  const server = createServer(app);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to resolve test server port");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const blockedRequests: Array<[string, RequestInit | undefined]> = [
      ["/api/property/victor-payload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicRecord: {} }) }],
      ["/api/adapters/hunter", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }],
      ["/api/adapters/victor", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }],
      ["/api/adapters/piper", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }],
      ["/api/adapters/piper/outbox", undefined],
      ["/api/operations/work-items", undefined],
      ["/api/telemetry/events", undefined],
    ];

    for (const [route, init] of blockedRequests) {
      const response = await fetch(`${baseUrl}${route}`, init);
      const contentType = response.headers.get("content-type") || "";
      if (response.status !== 404 || !contentType.includes("application/json")) {
        throw new Error(`${route} should fail closed with JSON 404; got ${response.status} ${contentType}`);
      }
    }

    const health = await fetch(`${baseUrl}/api/health`);
    if (health.status !== 200) throw new Error(`Public health route failed: ${health.status}`);

    const unknownApi = await fetch(`${baseUrl}/api/does-not-exist`);
    if (unknownApi.status !== 404) throw new Error(`Unknown API route should return 404, got ${unknownApi.status}`);

    console.log("✓ API security regression passed: internal routes fail closed in production");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

runTests().catch((error) => {
  console.error("API security regression failed:", error);
  process.exit(1);
});
