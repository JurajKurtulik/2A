import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { BlobServiceClient } from '@azure/storage-blob';
import { ApiError, canonicalAssignment, sha256, type Assignment, type Session } from '../src/contracts.js';
import { ReviewService, type Ocr } from '../src/service.js';
import { BlobStore } from '../src/store.js';

// Never use AzureWebJobsStorage, production settings, identity or a default endpoint.
function localConnection(value: string) {
  if (value === 'UseDevelopmentStorage=true') return value;
  const fields = new Map<string, string>();
  const allowed = new Set(['DefaultEndpointsProtocol', 'AccountName', 'AccountKey', 'BlobEndpoint', 'QueueEndpoint', 'TableEndpoint']);
  for (const part of value.split(';')) {
    if (!part) continue;
    const equals = part.indexOf('=');
    const name = part.slice(0, equals), entry = part.slice(equals + 1);
    assert(equals > 0 && entry && allowed.has(name) && !fields.has(name), 'Invalid local Azurite connection fields');
    fields.set(name, entry);
  }
  assert(fields.has('AccountName') && fields.has('AccountKey') && fields.has('BlobEndpoint'),
    'Explicit local BlobEndpoint, AccountName and AccountKey required');
  assert(!fields.has('DefaultEndpointsProtocol') || ['http', 'https'].includes(fields.get('DefaultEndpointsProtocol')!),
    'Invalid local endpoint protocol');
  for (const [name, entry] of fields) if (name.endsWith('Endpoint')) assertLoopback(entry);
  return value;
}
function assertLoopback(value: string) {
  const url = new URL(value);
  assert(['http:', 'https:'].includes(url.protocol) && ['127.0.0.1', '[::1]'].includes(url.hostname)
    && !url.username && !url.password && !url.search && !url.hash,
  'Azurite endpoint must use a literal loopback address, without credentials or query');
}
type Quota = { day: string; month: string; daily: number; monthly: number };
const connection = process.env.AZURITE_CONNECTION_STRING;
test('real BlobStore multi-client CAS and service quota (Azurite only)', {
  skip: connection === undefined ? 'Set AZURITE_CONNECTION_STRING explicitly to a local Azurite test instance' : false,
}, async t => {
  const safe = localConnection(connection!);
  const clients = Array.from({ length: 4 }, () => BlobServiceClient.fromConnectionString(safe, {
    retryOptions: { maxTries: 1 },
    version: '2025-01-05', // Emulator compatibility only; production SDK version is unchanged.
  }));
  clients.forEach(client => assertLoopback(client.url));
  const name = `review-integration-${randomUUID()}`;
  const container = clients[0].getContainerClient(name);
  // Never delete an existing container, even in the astronomically unlikely collision.
  await container.create();
  try {
    const stores = clients.map(client => new BlobStore(client.getContainerClient(name)));
    await Promise.all(stores.map(store => store.ready()));
    const now = Date.parse('2026-11-02T12:00:00.000Z'); // Injected clock, no live service involved.
    const initial: Quota = { day: '2026-11-02', month: '2026-11', daily: 0, monthly: 0 };
    const creations = await Promise.all(stores.map(store => store.write('quota/model.json', initial, null)));
    assert.equal(creations.filter(Boolean).length, 1, 'If-None-Match has exactly one winner');
    const snapshots = await Promise.all(stores.map(store => store.read<Quota>('quota/model.json')));
    snapshots.forEach(snapshot => assert.deepEqual(snapshot?.value, initial));
    const races = await Promise.all(stores.map((store, i) => store.write('quota/model.json', {
      ...initial, daily: i + 1, monthly: i + 1,
    }, snapshots[i]!.etag)));
    assert.equal(races.filter(Boolean).length, 1, 'If-Match has exactly one winner');
    assert.equal(await stores[0].write('quota/model.json', initial, snapshots[0]!.etag), false, 'Stale ETag rejected');
    // Reset only this disposable test record, by its current ETag, before service accounting.
    const raced = (await stores[0].read<Quota>('quota/model.json'))!;
    assert(await stores[1].write('quota/model.json', initial, raced.etag));
    let calls = 0;
    const called = new Set<string>();
    const ocr: Ocr = { recognize: async (_photo, ids) => {
      calls++;
      assert(!called.has(ids[0]), 'No second OCR call for a session');
      called.add(ids[0]);
      return { items: ids.map(id => ({ id, recognizedText: 'Kůň čte.', uncertain: true })) };
    } };
    const key = randomBytes(32);
    const keys = { get: async () => ({ version: 'local-test-only', key }) };
    const services = stores.map(store => new ReviewService(store, keys, ocr,
      { enabled: true, daily: 20, monthly: 100, modelTimeout: 1000 }, () => now));
    const sessions = [];
    // Sequential creation isolates quota contention from the separate global create limiter.
    for (let i = 0; i < 24; i++) {
      const assignment: Assignment = { schemaVersion: 1, id: `assignment-${i}`, kind: 'transcription', grade: 2,
        subject: 'czech', items: [{ id: `sentence-${i}`, expectedText: 'Žluťoučký kůň.' }] };
      sessions.push(await services[i % services.length].create({ assignment,
        assignmentDigest: sha256(canonicalAssignment(assignment)) }, randomUUID(), `local-test-${i}`));
    }
    const outcomes: PromiseSettledResult<void>[] = [];
    // Four concurrent clients per wave stay within the bounded 12-attempt CAS budget.
    for (let offset = 0; offset < sessions.length; offset += services.length) {
      outcomes.push(...await Promise.allSettled(sessions.slice(offset, offset + services.length).map((s, i) =>
        services[i].upload(s.id, s.uploadToken, s.id, async () => Buffer.from('local-ocr-fixture')))));
    }
    assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 20);
    const rejected = outcomes.filter(result => result.status === 'rejected');
    assert.equal(rejected.length, 4);
    for (const result of rejected) {
      assert(result.reason instanceof ApiError);
      assert.equal(result.reason.status, 429);
      assert.equal(result.reason.code, 'quota_exhausted');
    }
    assert.equal(calls, 20);
    const expected = { ...initial, daily: 20, monthly: 20 };
    for (const store of stores) assert.deepEqual((await store.read<Quota>('quota/model.json'))?.value, expected);
    for (const [i, s] of sessions.entries()) {
      const state = await stores[(i + 1) % stores.length].read<Session>(`sessions/${s.id}.json`);
      assert.equal(state?.value.state, i < 20 ? 'completed' : 'failed');
      assert.equal(await stores[0].read(`photos/${s.id}.jpg`), null);
    }
    await services[1].upload(sessions[0].id, sessions[0].uploadToken, sessions[0].id,
      async () => { throw new Error('Completed session must not prepare another image'); });
    assert.equal(calls, 20);
    t.diagnostic('Quota daily=20 monthly=20; 20 test OCR calls; 4 quota rejections; no remaining photos.');
  } finally {
    await container.delete(); // Only the randomly named container created by this invocation.
  }
});