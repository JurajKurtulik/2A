import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { canonicalAssignment as frontendCanonical } from '../../src/photo-review/contracts.ts';
import { ApiError, canonicalAssignment, sha256, type Assignment } from '../src/contracts.js';
import { ReviewService, type Ocr } from '../src/service.js';
import type { Store, Versioned } from '../src/store.js';
import { jpeg } from '../src/http.js';
import { AzureOcr } from '../src/model.js';

export class MemoryStore implements Store {
  data = new Map<string, { value: unknown; etag: string; modified: number }>();
  seq = 0;
  async read<T>(name: string): Promise<Versioned<T> | null> {
    const b = this.data.get(name); return b ? { value: structuredClone(b.value) as T, etag: b.etag } : null;
  }
  async write<T>(name: string, value: T, etag: string | null) {
    if ((this.data.get(name)?.etag ?? null) !== etag) return false;
    this.data.set(name, { value: structuredClone(value), etag: String(++this.seq), modified: Date.now() }); return true;
  }
  async putPhoto(name: string, bytes: Buffer) { assert(!this.data.has(name)); await this.write(name, bytes, null); }
  async remove(name: string, etag?: string) { if (!etag || this.data.get(name)?.etag === etag) this.data.delete(name); }
  async *list(prefix: string) { for (const [name, b] of this.data) if (name.startsWith(prefix)) yield { name, modified: b.modified }; }
  async ready() {}
}
const assignment: Assignment = { schemaVersion: 1, id: 'zadani', kind: 'transcription', grade: 2, subject: 'czech',
  items: [{ id: 'sentence-1', expectedText: 'Žluťoučký kůň čte.' }] };
const payload = (a = assignment) => ({ assignment: a, assignmentDigest: sha256(canonicalAssignment(a)) });
const errorStatus = (status: number) => (e: unknown) => e instanceof ApiError && e.status === status;
async function fixture(ocr?: Ocr, store = new MemoryStore()) {
  let time = Date.parse('2026-11-02T12:00:00Z'), calls = 0;
  const keys = { get: async () => ({ key: Buffer.alloc(32, 7), version: 'v1' }) };
  await store.write('quota/model.json', { day: '2026-11-02', month: '2026-11', daily: 0, monthly: 0 }, null);
  const model = ocr ?? { recognize: async () => { calls++; return { items: [{ id: 'sentence-1', recognizedText: 'Kůň.', uncertain: true }] }; } };
  const service = new ReviewService(store, keys, model, { enabled: true, daily: 20, monthly: 100, modelTimeout: 1000 }, () => time);
  return { service, store, model, keys, calls: () => calls, advance: (n: number) => { time += n; } };
}
test('canonical UTF-8 digest matches browser including composed/decomposed Czech', () => {
  for (const word of ['Žluťoučký kůň.', 'kůň'.normalize('NFD')]) {
    const a = { ...assignment, items: [{ id: 'sentence-1', expectedText: word }] };
    assert.equal(canonicalAssignment(a), frontendCanonical(a));
    assert.equal(sha256(canonicalAssignment(a)), sha256(frontendCanonical(a)));
  }
});
test('same create key produces one session and same purpose-separated tokens', async () => {
  const f = await fixture(), id = randomUUID();
  const [a, b] = await Promise.all([f.service.create(payload(), id, 'ip'), f.service.create(payload(), id, 'ip')]);
  assert.deepEqual(a, b); assert.notEqual(a.ownerToken, a.uploadToken);
  assert.equal(a.ownerToken.length, 43); assert.equal(f.calls(), 0);
  const changed = { ...assignment, id: 'different' };
  await assert.rejects(f.service.create(payload(changed), id, 'ip'), errorStatus(409));
});
test('tokens cannot be swapped, missing sessions and invalid digests rejected', async () => {
  const f = await fixture(), s = await f.service.create(payload(), randomUUID(), 'ip');
  await assert.rejects(f.service.status(s.id, s.uploadToken), errorStatus(403));
  await assert.rejects(f.service.upload(s.id, s.ownerToken, s.id, async () => Buffer.alloc(1)), errorStatus(403));
  await assert.rejects(f.service.status('x'.repeat(32), s.ownerToken), errorStatus(403));
  await assert.rejects(f.service.create({ ...payload(), assignmentDigest: 'wrong' }, randomUUID(), 'ip'), errorStatus(400));
});
test('two instances and repeated upload invoke OCR at most once', async () => {
  const f = await fixture();
  const second = new ReviewService(f.store, f.keys, f.model, f.service.settings, f.service.now);
  const s = await f.service.create(payload(), randomUUID(), 'ip');
  const outcomes = await Promise.allSettled([f.service, second].map(service => service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1))));
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal(f.calls(), 1);
  await f.service.upload(s.id, s.uploadToken, s.id, async () => { throw Error('must not decode twice'); });
  assert.equal(f.calls(), 1); assert.equal((await f.service.status(s.id, s.ownerToken)).status, 'completed');
  assert.equal([...f.store.data.keys()].filter(k => k.startsWith('photos/')).length, 0);
});
test('failure consumes one quota and cannot be retried', async () => {
  let calls = 0;
  const f = await fixture({ recognize: async () => { calls++; throw Error('timeout'); } });
  const s = await f.service.create(payload(), randomUUID(), 'ip');
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(503));
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(409));
  assert.equal(calls, 1); assert.equal((await f.service.status(s.id, s.ownerToken)).status, 'failed');
  assert.equal((await f.store.read<any>('quota/model.json'))!.value.daily, 1);
  assert(!f.store.data.has(`photos/${s.id}.jpg`));
});
test('missing quota fails closed without invoking model', async () => {
  const f = await fixture(); await f.store.remove('quota/model.json');
  const s = await f.service.create(payload(), randomUUID(), 'ip');
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(503));
  assert.equal(f.calls(), 0); assert(!f.store.data.has(`photos/${s.id}.jpg`));
});
test('quota concurrency never exceeds global limit', async () => {
  const f = await fixture(); f.service.settings.daily = 2;
  const sessions = await Promise.all(Array.from({ length: 5 }, (_, i) => f.service.create(payload(), randomUUID(), `ip${i}`)));
  await Promise.allSettled(sessions.map(s => f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1))));
  assert.equal(f.calls(), 2); assert.equal((await f.store.read<any>('quota/model.json'))!.value.daily, 2);
});
test('month rollover resets both periods atomically; cleanup preserves quota and runtime', async () => {
  const f = await fixture();
  const q = (await f.store.read('quota/model.json'))!;
  await f.store.write('quota/model.json', { day: '2026-10-31', month: '2026-10', daily: 20, monthly: 100 }, q.etag);
  const s = await f.service.create(payload(), randomUUID(), 'ip');
  await f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1));
  assert.deepEqual((await f.store.read('quota/model.json'))!.value, { day: '2026-11-02', month: '2026-11', daily: 1, monthly: 1 });
  await f.store.write('runtime/host', {}, null);
  f.advance(1800001); await assert.rejects(f.service.status(s.id, s.ownerToken), errorStatus(410));
  await f.service.cleanup();
  assert(f.store.data.has('quota/model.json')); assert(f.store.data.has('runtime/host'));
  assert(![...f.store.data.keys()].some(k => k.startsWith('sessions/') || k.startsWith('creates/')));
});
test('full JPEG decode and max-pixel enforcement', async () => {
  const bytes = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#fff' } }).jpeg().toBuffer();
  assert((await jpeg(bytes)).length > 0);
  const mpo = Buffer.concat([bytes, Buffer.from('MPF\0test-mpf-index')]);
  assert((await jpeg(mpo)).length > 0);
  await assert.rejects(jpeg(Buffer.from('not JPEG')), errorStatus(415));
  await assert.rejects(jpeg(Buffer.from([0xff, 0xd8, 0xff])), errorStatus(415));
  await assert.rejects(jpeg(Buffer.alloc(4 * 1024 * 1024 + 1)), errorStatus(413));
  const bomb = await sharp({ create: { width: 2300, height: 10, channels: 3, background: '#fff' } }).jpeg().toBuffer();
  await assert.rejects(jpeg(bomb), errorStatus(415));
});
test('model requests exclude expected answers and require literal transcription; incomplete and 429 never retry', async () => {
  for (const scenario of ['ok', 'incomplete', 'refusal', '429']) {
    let calls = 0;
    const model = new AzureOcr({ getToken: async () => ({ token: 'test-only', expiresOnTimestamp: Date.now() + 10000 }) },
      'https://example.openai.azure.com/', 'test-deployment', 4096, async (_url, init) => {
        calls++; const body = JSON.parse(String(init?.body));
        assert.equal(body.store, false); assert.equal(body.max_output_tokens, 4096);
        assert(!String(init?.body).includes(assignment.items[0].expectedText));
        assert.match(body.instructions, /literal transcription/i);
        assert.match(body.instructions, /do not proofread, edit, normalize, or correct/i);
        assert.match(body.instructions, /Never infer a grammatically expected word/i);
        if (scenario === '429') return new Response('', { status: 429 });
        return Response.json({ status: scenario === 'incomplete' ? 'incomplete' : 'completed', output: [
          { type: 'message', status: 'completed', content: scenario === 'refusal' ? [{ type: 'refusal', refusal: 'no' }] : [
            { type: 'output_text', text: JSON.stringify({ items: [{ id: 'sentence-1', recognizedText: '', uncertain: true }] }) },
          ] },
        ] });
      });
    const run = model.recognize(Buffer.alloc(1), ['sentence-1'], AbortSignal.timeout(1000));
    if (scenario === 'ok') await run; else await assert.rejects(run);
    assert.equal(calls, 1);
  }
});
test('corrupt cross-period quota fails closed', async () => {
  const f = await fixture(), q = (await f.store.read('quota/model.json'))!;
  await f.store.write('quota/model.json', { day: '2026-11-02', month: '2026-10', daily: 1, monthly: 100 }, q.etag);
  const s = await f.service.create(payload(), randomUUID(), 'ip');
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(503));
  assert.equal(f.calls(), 0);
});
test('restart leaves stale processing failed without resuming OCR', async () => {
  const f = await fixture(), s = await f.service.create(payload(), randomUUID(), 'ip');
  const entry = (await f.store.read<any>(`sessions/${s.id}.json`))!;
  await f.store.write(`sessions/${s.id}.json`, { ...entry.value, state: 'processing', processingDeadline: f.service.now() - 1 }, entry.etag);
  await f.service.cleanup();
  assert.equal((await f.service.status(s.id, s.ownerToken)).status, 'failed');
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(409));
  assert.equal(f.calls(), 0);
});
test('photo deletion failure never publishes completed', async () => {
  const f = await fixture(), s = await f.service.create(payload(), randomUUID(), 'ip');
  const remove = f.store.remove.bind(f.store);
  f.store.remove = async name => { if (name.startsWith('photos/')) throw Error('storage deletion unavailable'); await remove(name); };
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(503));
  assert.equal((await f.service.status(s.id, s.ownerToken)).status, 'failed');
  assert.equal(f.calls(), 1);
  f.store.remove = remove; f.advance(1800001); await f.service.cleanup();
  assert(!f.store.data.has(`photos/${s.id}.jpg`));
});
test('ambiguous quota commit never dispatches model', async () => {
  const f = await fixture(), s = await f.service.create(payload(), randomUUID(), 'ip');
  const write = f.store.write.bind(f.store);
  f.store.write = async (name, value, etag) => {
    const success = await write(name, value, etag);
    if (name === 'quota/model.json') throw Error('response lost after commit');
    return success;
  };
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => Buffer.alloc(1)), errorStatus(503));
  assert.equal(f.calls(), 0);
  assert.equal((await f.store.read<any>('quota/model.json'))!.value.daily, 1);
});
test('expiry during slow preparation prevents model dispatch', async () => {
  const f = await fixture(), s = await f.service.create(payload(), randomUUID(), 'ip');
  await assert.rejects(f.service.upload(s.id, s.uploadToken, s.id, async () => {
    f.advance(1800001); return Buffer.alloc(1);
  }), errorStatus(410));
  assert.equal(f.calls(), 0);
});