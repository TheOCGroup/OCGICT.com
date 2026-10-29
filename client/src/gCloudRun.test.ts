import { describe, it, expect, vi } from 'vitest';

// Default-factory test: the Blobs module is stubbed with the same faithful
// in-memory CAS store the handler smoke tests use.
vi.mock('@netlify/blobs', () => {
  const data = new Map<string, string>();
  const etags = new Map<string, number>();
  const store = {
    async get(key: string) { return data.has(key) ? data.get(key)! : null; },
    async getWithMetadata(key: string) {
      if (!data.has(key)) return null;
      return { data: data.get(key)!, etag: String(etags.get(key) ?? 0), metadata: {} };
    },
    async set(key: string, value: string, opts?: { onlyIfMatch?: string; onlyIfNew?: boolean }) {
      if (opts?.onlyIfNew && data.has(key)) {
        const err: any = new Error('Precondition Failed'); err.status = 412; throw err;
      }
      if (opts?.onlyIfMatch && String(etags.get(key) ?? 0) !== opts.onlyIfMatch) {
        const err: any = new Error('Precondition Failed'); err.status = 412; throw err;
      }
      data.set(key, value);
      etags.set(key, (etags.get(key) ?? 0) + 1);
    },
  };
  return { getStore: () => store, setEnvironmentContext: () => {}, connectLambda: () => {} };
});

import { firestoreBudgetStore, encodeCounterDocId } from '../../server/services/gFirestoreStore';
import type { FirestoreCounterDb, FirestoreDocSnap, FirestoreTx } from '../../server/services/gFirestore';
import { consumeBudget } from '../../server/services/gBudget';
import { consumeRateLimit } from '../../server/services/gRateLimit';
import { platformBudgetStore, registerBudgetStoreFactory, hasRegisteredStoreFactory, storeBackend, leadBackend } from '../../server/services/gPlatform';
import { parseFormSubmission, persistLeadToFirestore } from '../../server/services/gLeadStore';
import { trustedClientIp, hasRoute, ROUTE_PATHS, staticFilePath } from '../../server/cloudrunRoutes';

// An optimistic-concurrency Firestore double: transactions snapshot doc
// versions at read time and abort (then retry) when a staged doc changed
// underneath them — the behavior the real SDK + service exhibit under
// contention, which is what makes concurrent exactness a real test.
function makeFirestoreDouble(opts: { failAll?: boolean } = {}) {
  const docs = new Map<string, { value: number; version: number }>();
  let failures = opts.failAll ? Number.POSITIVE_INFINITY : 0;
  const snapFor = (path: string): FirestoreDocSnap => {
    const doc = docs.get(path);
    return { exists: !!doc, data: () => (doc ? { value: doc.value } : undefined) };
  };
  const db: FirestoreCounterDb = {
    doc: (path: string) => path,
    async getDoc(ref: unknown) {
      if (failures > 0) throw new Error('firestore unavailable');
      await new Promise((r) => setTimeout(r, 1));
      return snapFor(ref as string);
    },
    async runTransaction<T>(update: (tx: FirestoreTx) => Promise<T>): Promise<T> {
      for (let attempt = 0; attempt < 25; attempt++) {
        if (failures > 0) throw new Error('firestore unavailable');
        const reads = new Map<string, number>();
        const writes = new Map<string, Record<string, unknown>>();
        const tx: FirestoreTx = {
          async get(ref: unknown) {
            await new Promise((r) => setTimeout(r, 1));
            const p = ref as string;
            if (!reads.has(p)) reads.set(p, docs.get(p)?.version ?? 0);
            return snapFor(p);
          },
          set(ref: unknown, data: Record<string, unknown>) {
            writes.set(ref as string, data);
          },
        };
        const result = await update(tx);
        let conflict = false;
        for (const [p, v] of reads) {
          if ((docs.get(p)?.version ?? 0) !== v && writes.has(p)) { conflict = true; break; }
        }
        if (conflict) continue; // aborted -> retry with fresh reads
        for (const [p, data] of writes) {
          docs.set(p, { value: Number(data.value), version: (docs.get(p)?.version ?? 0) + 1 });
        }
        return result;
      }
      throw new Error('transaction aborted too many times');
    },
  };
  return { db, docs };
}

describe('Firestore BudgetStore (Cloud Run fallback)', () => {
  it('get returns null for a missing counter; set then get round-trips', async () => {
    const { db } = makeFirestoreDouble();
    const store = firestoreBudgetStore(db);
    expect(await store.get('g-budget:tts:2026-10-28')).toBeNull();
    await store.set('g-budget:tts:2026-10-28', 7);
    expect(await store.get('g-budget:tts:2026-10-28')).toBe(7);
    await store.set('g-budget:tts:2026-10-28', 3);
    expect(await store.get('g-budget:tts:2026-10-28')).toBe(3);
  });

  it('doc ids are safe for keys with colons and IPv6 client ids', () => {
    const a = encodeCounterDocId('g-ratelimit:tts:123:2001:db8::1');
    const b = encodeCounterDocId('g-ratelimit:tts:123:2001:db8::2');
    expect(a).not.toContain('/');
    expect(a).not.toBe(b);
  });

  it('atomicIncrement admits exactly the limit under a 30-way concurrent burst', async () => {
    const { db, docs } = makeFirestoreDouble();
    const store = firestoreBudgetStore(db);
    const key = 'g-ratelimit:tts:999:203.0.113.9';
    const results = await Promise.all(Array.from({ length: 30 }, () => store.atomicIncrement!(key, 10)));
    expect(results.filter((r) => r!.allowed)).toHaveLength(10);
    expect(docs.get(`g-counters/${encodeCounterDocId(key)}`)?.value).toBe(10);
  });

  it('a blocked caller consumes nothing', async () => {
    const { db, docs } = makeFirestoreDouble();
    const store = firestoreBudgetStore(db);
    const key = 'g-budget:chat:2026-10-28';
    await store.set(key, 5);
    const blocked = await store.atomicIncrement!(key, 5);
    expect(blocked).toEqual({ used: 5, allowed: false });
    expect(docs.get(`g-counters/${encodeCounterDocId(key)}`)?.value).toBe(5);
  });

  it('drives the certified budget and rate-limit consumers unchanged', async () => {
    const { db } = makeFirestoreDouble();
    const store = firestoreBudgetStore(db);
    const env = { OCG_G_TTS_DAILY_LIMIT: '3', OCG_G_RATELIMIT_TTS: '2' };
    const d1 = await consumeBudget(store, 'tts', env);
    const d2 = await consumeBudget(store, 'tts', env);
    const d3 = await consumeBudget(store, 'tts', env);
    const d4 = await consumeBudget(store, 'tts', env);
    expect([d1.allowed, d2.allowed, d3.allowed, d4.allowed]).toEqual([true, true, true, false]);
    const r1 = await consumeRateLimit(store, 'tts', '198.51.100.4', env);
    const r2 = await consumeRateLimit(store, 'tts', '198.51.100.4', env);
    const r3 = await consumeRateLimit(store, 'tts', '198.51.100.4', env);
    expect([r1.allowed, r2.allowed, r3.allowed]).toEqual([true, true, false]);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('store failure throws so callers fail closed', async () => {
    const { db } = makeFirestoreDouble({ failAll: true });
    const store = firestoreBudgetStore(db);
    await expect(store.atomicIncrement!('k', 3)).rejects.toThrow();
    await expect(store.get('k')).rejects.toThrow();
  });
});

describe('platform selection', () => {
  it('storeBackend / leadBackend read only their env switches', () => {
    expect(storeBackend({})).toBe('blobs');
    expect(storeBackend({ OCG_STORE_BACKEND: 'firestore' })).toBe('firestore');
    expect(storeBackend({ OCG_STORE_BACKEND: 'FIRESTORE ' })).toBe('firestore');
    expect(storeBackend({ OCG_STORE_BACKEND: 'anything' })).toBe('blobs');
    expect(leadBackend({})).toBe('netlify-forms');
    expect(leadBackend({ OCG_LEAD_BACKEND: 'firestore' })).toBe('firestore');
  });

  it('default factory is the Netlify Blobs store', async () => {
    expect(hasRegisteredStoreFactory()).toBe(false);
    const store = await platformBudgetStore();
    const d = await consumeBudget(store, 'voice', {});
    expect(d.allowed).toBe(true);
  });

  it('a registered factory wins over the default', async () => {
    const { db } = makeFirestoreDouble();
    registerBudgetStoreFactory(async () => firestoreBudgetStore(db));
    expect(hasRegisteredStoreFactory()).toBe(true);
    const store = await platformBudgetStore();
    await store.set('probe', 42);
    expect(await store.get('probe')).toBe(42);
  });
});

describe('Cloud Run harness helpers', () => {
  it('trustedClientIp takes the LAST X-Forwarded-For entry', () => {
    expect(trustedClientIp('203.0.113.1')).toBe('203.0.113.1');
    expect(trustedClientIp('10.0.0.1, 203.0.113.7')).toBe('203.0.113.7');
    expect(trustedClientIp(' 198.51.100.2 , 203.0.113.9 ')).toBe('203.0.113.9');
    expect(trustedClientIp(['10.0.0.1', '203.0.113.3'])).toBe('203.0.113.3');
    expect(trustedClientIp(undefined, '192.0.2.5')).toBe('192.0.2.5');
    expect(trustedClientIp(undefined, undefined)).toBe('unknown');
    // A client-forged first entry never wins over the platform-appended last.
    expect(trustedClientIp('1.1.1.1, 203.0.113.44')).toBe('203.0.113.44');
  });

  it('routes cover the full certified API surface', () => {
    for (const p of ['/api/g/chat', '/api/g/lead', '/api/g/tts-gemini', '/api/g/tts', '/api/g/voice/session',
      '/api/seller/action', '/api/seller/property-lookup', '/api/seller/preliminary-offer', '/api/seller/address-suggestions']) {
      expect(hasRoute(p), p).toBe(true);
    }
    expect(ROUTE_PATHS).toHaveLength(9);
    expect(hasRoute('/api/nope')).toBe(false);
  });
});

describe('static file path hardening', () => {
  const root = '/srv/public';
  it('serves ordinary files and the index', () => {
    expect(staticFilePath(root, '/')).toBe('/srv/public/index.html');
    expect(staticFilePath(root, '/assets/app.js')).toBe('/srv/public/assets/app.js');
    expect(staticFilePath(root, '//double//slash.css')).toBe('/srv/public/double/slash.css');
  });
  it('rejects traversal in every encoding', () => {
    expect(staticFilePath(root, '/../../etc/passwd')).toBeNull();
    expect(staticFilePath(root, '/assets/../../secret')).toBeNull();
    expect(staticFilePath(root, '/%2e%2e/%2e%2e/secret')).toBeNull();
    expect(staticFilePath(root, '/assets/%2E%2E/config')).toBeNull();
    expect(staticFilePath(root, '/%E0%A4%A')).toBeNull();
  });
  it('cannot be escaped through a sibling prefix', () => {
    expect(staticFilePath(root, '/../public-evil/evil.js')).toBeNull();
    // A legitimate in-root path that merely resembles the prefix is fine.
    expect(staticFilePath(root, '/public-evil.js')).toBe('/srv/public/public-evil.js');
  });
});

describe('lead intake compatibility', () => {
  it('parseFormSubmission extracts the form name and fields', () => {
    const parsed = parseFormSubmission('form-name=ocg-g-lead&bot-field=&name=Ana&phone=555');
    expect(parsed?.formName).toBe('ocg-g-lead');
    expect(parsed?.fields.name).toBe('Ana');
    expect(parsed?.fields['form-name']).toBeUndefined();
    expect(parseFormSubmission('name=Ana')).toBeNull();
    expect(parseFormSubmission('')).toBeNull();
  });

  it('persistLeadToFirestore writes form + fields', async () => {
    const written: Record<string, unknown>[] = [];
    await persistLeadToFirestore({ addLead: async (r) => { written.push(r); } }, 'ocg-g-lead', { name: 'Ana' });
    expect(written).toEqual([{ form: 'ocg-g-lead', fields: { name: 'Ana' } }]);
  });
});
