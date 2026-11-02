/**
 * Non-mutating G first-token benchmark. No lead submissions or paid voice calls.
 * Usage: node scripts/g-latency-benchmark.mjs [baseUrl]
 */
const base = (process.argv[2] || 'https://ocgict.com').replace(/\/$/, '');
const prompts = [
  'I want to sell my house. How do I start?',
  'I am an investor. What information do you need to evaluate a property?',
  'What happens after I request an offer?',
  'Quiero vender mi casa. ¿Por dónde empiezo?',
];
const samples = [];
for (const [i, message] of prompts.entries()) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(base + '/api/g/chat', {
      method: 'POST', signal: controller.signal,
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ sessionId: 'ocg-g-perf-' + Date.now() + '-' + i, message, stream: true, history: [] }),
    });
    const headersMs = Math.round(performance.now() - start);
    if (!response.ok || !response.body) throw new Error('HTTP ' + response.status);
    let firstTokenMs = null;
    let answer = '';
    let pending = '';
    const decoder = new TextDecoder();
    for await (const bytes of response.body) {
      pending += decoder.decode(bytes, { stream: true });
      let idx;
      while ((idx = pending.indexOf('\n\n')) !== -1) {
        const event = pending.slice(0, idx);
        pending = pending.slice(idx + 2);
        const data = event.split('\n').find(line => line.startsWith('data:'));
        if (!data) continue;
        let parsed;
        try { parsed = JSON.parse(data.slice(5).trim()); } catch { continue; }
        if (typeof parsed.t === 'string' && parsed.t.length) {
          if (firstTokenMs === null) firstTokenMs = Math.round(performance.now() - start);
          answer += parsed.t;
        }
        if (parsed.error) throw new Error('SSE error');
      }
    }
    const result = { scenario: i + 1, status: response.status, headersMs, firstTokenMs, completeMs: Math.round(performance.now() - start), chars: answer.length };
    samples.push(result);
    console.log(JSON.stringify(result));
  } catch (err) {
    samples.push({ scenario: i + 1, error: String(err) });
    console.log(JSON.stringify(samples.at(-1)));
  } finally { clearTimeout(timer); }
}
const times = samples.map(s => s.firstTokenMs).filter(Number.isFinite).sort((a,b)=>a-b);
const percentile = p => times.length ? times[Math.ceil(p * times.length) - 1] : null;
console.log(JSON.stringify({ total: samples.length, success: times.length, medianFirstTokenMs: percentile(0.5), p95FirstTokenMs: percentile(0.95), note: 'Small sample diagnostic only; not an SLA.' }));
if (times.length !== prompts.length) process.exitCode = 1;
