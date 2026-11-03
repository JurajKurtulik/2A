import { HttpRequest } from '@azure/functions';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handle } from '../src/functions.js';

test('preflight permits exact Pages origin and contract headers without credentials', async () => {
  const request = new HttpRequest({ url: 'https://example.test/api/v1/reviews', method: 'OPTIONS', headers: {
    origin: 'https://jurajkurtulik.github.io', 'access-control-request-method': 'PUT',
    'access-control-request-headers': 'Content-Type, X-Upload-Token, Idempotency-Key',
  } });
  const result = await handle(request, async () => { throw Error('preflight must not access dependencies'); });
  assert.equal(result.status, 204);
  const headers = result.headers as Record<string, string>;
  assert.equal(headers['Access-Control-Allow-Origin'], 'https://jurajkurtulik.github.io');
  assert.equal(headers['Access-Control-Allow-Credentials'], undefined);
  assert.equal(headers['Cache-Control'], 'no-store');
});
test('preflight rejects other origins, headers and methods', async () => {
  for (const extra of [ { origin: 'https://evil.test' }, { 'access-control-request-method': 'DELETE' },
    { 'access-control-request-headers': 'x-function-key' } ]) {
    const request = new HttpRequest({ url: 'https://example.test/api/v1/reviews', method: 'OPTIONS', headers: {
      origin: 'https://jurajkurtulik.github.io', 'access-control-request-method': 'POST', ...extra,
    } });
    const result = await handle(request, async () => ({ status: 200 }));
    assert.equal(result.status, 403);
  }
});
test('dependency failures return sanitized JSON and no-store', async () => {
  const request = new HttpRequest({ url: 'https://example.test/api/health', method: 'GET' });
  const result = await handle(request, async () => { throw Error('secret must not escape'); });
  assert.equal(result.status, 503);
  assert.deepEqual(result.jsonBody, { error: 'dependency_unavailable' });
});