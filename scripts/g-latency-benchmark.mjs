/**
 * Non-mutating G guarded-response benchmark. Sends four chat requests; no lead submissions or paid voice calls. Text-model billing may apply if the live paid endpoint is enabled.
 * Usage: node scripts/g-latency-benchmark.mjs [baseUrl]
 */
const base = (process.argv[2] || "https://ocgict.com").replace(/\/$/, "");
const prompts = [
  "I want to sell my house. How do I start?",
  "I am an investor. What information do you need to evaluate a property?",
  "What happens after I request an offer?",
  "Quiero vender mi casa. ¿Por dónde empiezo?",
];
const samples = [];
for (const [i, message] of prompts.entries()) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(base + "/api/g/chat", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        sessionId: "ocg-g-perf-" + Date.now() + "-" + i,
        message,
        stream: true,
        history: [],
      }),
    });
    const headersMs = Math.round(performance.now() - start);
    if (!response.ok || !response.body)
      throw new Error("HTTP " + response.status);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const data = await response.json();
      const completeMs = Math.round(performance.now() - start);
      const result = {
        scenario: i + 1,
        status: response.status,
        mode: "json-fallback",
        headersMs,
        firstGuardedTextMs: null,
        completeMs,
        chars: typeof data.replyText === "string" ? data.replyText.length : 0,
      };
      samples.push(result);
      console.log(JSON.stringify(result));
      continue;
    }
    // The server buffers Gemini output until the seller-policy guard passes.
    // This is first client-visible GUARDED text, not the model's first token.
    let firstGuardedTextMs = null;
    let answer = "";
    let completed = false;
    let pending = "";
    const decoder = new TextDecoder();
    for await (const bytes of response.body) {
      pending += decoder.decode(bytes, { stream: true });
      let idx;
      while ((idx = pending.indexOf("\n\n")) !== -1) {
        const event = pending.slice(0, idx);
        pending = pending.slice(idx + 2);
        const data = event.split("\n").find(line => line.startsWith("data:"));
        if (!data) continue;
        let parsed;
        try {
          parsed = JSON.parse(data.slice(5).trim());
        } catch {
          continue;
        }
        if (typeof parsed.t === "string" && parsed.t.length) {
          if (firstGuardedTextMs === null)
            firstGuardedTextMs = Math.round(performance.now() - start);
          answer += parsed.t;
        }
        if (parsed.error) throw new Error("SSE error: " + String(parsed.error));
        if (parsed.done === true) {
          completed = true;
          if (
            typeof parsed.replyText === "string" &&
            parsed.replyText !== answer
          )
            throw new Error("SSE final answer mismatch");
        }
      }
    }
    if (!completed) throw new Error("SSE stream ended without done event");
    const result = {
      scenario: i + 1,
      status: response.status,
      mode: "sse",
      headersMs,
      firstGuardedTextMs,
      completeMs: Math.round(performance.now() - start),
      chars: answer.length,
    };
    samples.push(result);
    console.log(JSON.stringify(result));
  } catch (err) {
    samples.push({ scenario: i + 1, error: String(err) });
    console.log(JSON.stringify(samples.at(-1)));
  } finally {
    clearTimeout(timer);
  }
}
const times = samples
  .map(s => s.firstGuardedTextMs)
  .filter(Number.isFinite)
  .sort((a, b) => a - b);
const percentile = p =>
  times.length ? times[Math.ceil(p * times.length) - 1] : null;
const httpSuccess = samples.filter(s => s.status === 200).length;
const jsonFallbacks = samples.filter(s => s.mode === "json-fallback").length;
console.log(
  JSON.stringify({
    total: samples.length,
    httpSuccess,
    sseSamples: times.length,
    jsonFallbacks,
    medianFirstGuardedTextMs: percentile(0.5),
    p95FirstGuardedTextMs: percentile(0.95),
    note: "Guarded-text metrics measure when policy-approved text first reaches the client, not Gemini first-token latency. JSON fallback is full-response latency. Small sample; not an SLA.",
  })
);
if (
  httpSuccess !== prompts.length ||
  samples.some(s => s.error) ||
  times.length + jsonFallbacks !== prompts.length
)
  process.exitCode = 1;
