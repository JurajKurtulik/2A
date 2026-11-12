import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { test } from 'node:test';
import { ProfileAuth, parseProgressConfig, validateEvents } from '../src/progress.js';
import type { Store, Versioned } from '../src/store.js';

test('Profile authentication binds tokens to one account and rejects wrong or expired credentials', async () => {
  let now = Date.parse('2026-11-12T08:00:00Z');
  const accounts = ['terezka', 'oliver'].map(id => {
    const salt = Buffer.alloc(16, 1);
    return { id, username: id, name: id, avatar: '🦡', salt: salt.toString('hex'),
      hash: scryptSync('test-password', salt, 64).toString('hex') };
  });
  const records = new Map<string, Versioned<unknown>>();
  const store = {
    async read<T>(key: string) { return (records.get(key) ?? null) as Versioned<T> | null; },
    async write<T>(key: string, value: T, etag: string | null) {
      records.set(key, { value, etag: String(Number(etag ?? 0) + 1) });
      return true;
    },
  } as Store;
  const auth = new ProfileAuth(parseProgressConfig(JSON.stringify({ signingKey: 'ab'.repeat(32), accounts })), store, () => now);
  await assert.rejects(auth.login({ username: 'Oliver', password: 'wrong' }), { status: 401 });
  const login = await auth.login({ username: 'Oliver', password: 'test-password' });
  assert.equal(auth.profile(`Bearer ${login.token}`), 'oliver');
  assert.throws(() => auth.profile(`Bearer ${login.token.replace('oliver.', 'terezka.')}`), { status: 401 });
  now = login.expires;
  assert.throws(() => auth.profile(`Bearer ${login.token}`), { status: 401 });
});

test('Progress validation keeps only score metadata and rejects malformed counts', () => {
  const entry = { date: '2026-11-12T08:00:00Z', label: 'Počítání', kind: 'practice',
    grade: 2, score: 1, total: 2, topics: [{ id: 'arithmetic', total: 2, right: 1 }], answer: 'discard' };
  const id = 'a'.repeat(64);
  const clean = validateEvents({ events: [{ id, entry }] })[0].entry;
  assert.equal(Object.hasOwn(clean as object, 'answer'), false);
  assert.throws(() => validateEvents({ events: [{ id, entry: { ...entry, score: 3 } }] }), { status: 400 });
});
