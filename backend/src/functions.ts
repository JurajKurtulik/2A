import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { ApiError } from './contracts.js';
import { boundedBody, jpeg } from './http.js';
import { AzureOcr } from './model.js';
import { VaultKeys } from './security.js';
import { ReviewService } from './service.js';
import { BlobStore } from './store.js';
import { ProfileAuth, ProgressDatabase, parseProgressConfig, progressJson, validateEvents } from './progress.js';
import { connectVoice } from './voice.js';

app.setup({ enableHttpStream: true });
const origin = process.env.PHOTO_ALLOWED_ORIGIN ?? 'https://jurajkurtulik.github.io';
const methods = ['POST', 'PUT', 'GET', 'OPTIONS'];
const allowedHeaders = ['content-type', 'authorization', 'x-upload-token', 'idempotency-key'];
function required(name: string) {
  const value = process.env[name]; if (!value) throw new ApiError(503, 'configuration_unavailable'); return value;
}
function positive(name: string, fallback: number, max: number) {
  const n = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(n) || n <= 0 || n > max) throw new ApiError(503, 'configuration_unavailable');
  return n;
}
const credential = process.env.WEBSITE_INSTANCE_ID ? new ManagedIdentityCredential() : new DefaultAzureCredential();
let singleton: ReviewService | undefined;
function service() {
  if (singleton) return singleton;
  const account = new URL(required('PHOTO_STORAGE_ACCOUNT_URL'));
  const vault = new URL(required('PHOTO_KEY_VAULT_URL'));
  const endpoint = new URL(required('AZURE_OPENAI_ENDPOINT'));
  if ([account, vault, endpoint].some(u => u.protocol !== 'https:' || u.username || u.password || u.search || u.hash))
    throw new ApiError(503, 'configuration_unavailable');
  const store = new BlobStore(new BlobServiceClient(account.href, credential, {
    retryOptions: { maxTries: 1 }, // Ambiguous writes fail closed rather than silently replaying reservations.
  }).getContainerClient(required('PHOTO_STORAGE_CONTAINER')));
  singleton = new ReviewService(store,
    new VaultKeys(new SecretClient(vault.href, credential), required('PHOTO_SIGNING_SECRET_NAME')),
    new AzureOcr(credential, endpoint.href, required('AZURE_OPENAI_DEPLOYMENT'),
      positive('PHOTO_MODEL_MAX_OUTPUT_TOKENS', 4096, 8192)),
    { enabled: process.env.PHOTO_REVIEW_ENABLED === 'true', daily: positive('PHOTO_REVIEW_DAILY_LIMIT', 20, 1000),
      monthly: positive('PHOTO_REVIEW_MONTHLY_LIMIT', 100, 10000),
      modelTimeout: positive('PHOTO_MODEL_TIMEOUT_MS', 120000, 120000) });
  return singleton;
}
export function cors(request: HttpRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' };
  if (request.headers.get('origin') === origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}
export async function handle(request: HttpRequest, action: () => Promise<HttpResponseInit>): Promise<HttpResponseInit> {
  const headers = cors(request);
  try {
    const sentOrigin = request.headers.get('origin');
    if (sentOrigin && sentOrigin !== origin) throw new ApiError(403, 'origin_not_allowed');
    if (request.method === 'OPTIONS') {
      if (sentOrigin !== origin || !methods.includes(request.headers.get('access-control-request-method') ?? '')
        || (request.headers.get('access-control-request-headers') ?? '').split(',').map(s => s.trim().toLowerCase())
          .filter(Boolean).some(h => !allowedHeaders.includes(h))) throw new ApiError(403, 'preflight_not_allowed');
      return { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': methods.join(', '),
        'Access-Control-Allow-Headers': allowedHeaders.join(', '), 'Access-Control-Max-Age': '300' } };
    }
    const result = await action(); return { ...result, headers: { ...headers, ...result.headers } };
  } catch (e) {
    const error = e instanceof ApiError ? e : new ApiError(503, 'dependency_unavailable');
    // Deliberately do not log the exception: SDK errors may include bodies/credentials.
    return { status: error.status, headers, jsonBody: { error: error.code } };
  }
}
app.http('createReview', { route: 'v1/reviews', methods: ['POST', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => {
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
      throw new ApiError(415, 'json_required');
    const bytes = await boundedBody(request.body, 16 * 1024);
    let input: unknown;
    try { input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { throw new ApiError(400, 'invalid_json'); }
    // No unverified forwarding header is accepted as client identity. A conservative shared
    // bucket applies the per-IP limits globally until platform IP provenance is verified.
    const result = await service().create(input, request.headers.get('idempotency-key') ?? '', 'unverified-shared');
    return { status: 201, jsonBody: result };
  }) });
app.http('uploadReview', { route: 'v1/reviews/{id}/photo', methods: ['PUT', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => {
    await service().upload(request.params.id, request.headers.get('x-upload-token') ?? undefined,
      request.headers.get('idempotency-key') ?? '', async () => {
        if (request.headers.get('content-type') !== 'image/jpeg') throw new ApiError(415, 'jpeg_required');
        return jpeg(await boundedBody(request.body, 4 * 1024 * 1024));
      });
    return { status: 204 };
  }) });
app.http('reviewStatus', { route: 'v1/reviews/{id}', methods: ['GET', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Review ')) throw new ApiError(401, 'authorization_required');
    return { status: 200, jsonBody: await service().status(request.params.id, auth.slice(7)) };
  }) });
app.http('health', { route: 'health', methods: ['GET', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => {
    const s = service(); await s.store.ready(); await s.keys.get();
    if (!await s.store.read('quota/model.json')) throw new ApiError(503, 'not_ready');
    return { status: 200, jsonBody: { status: 'ready', contractVersion: 1 } };
  }) });
let progressAuth: ProfileAuth | undefined;
function profileAuth() {
  return progressAuth ??= new ProfileAuth(parseProgressConfig(required('PROGRESS_CONFIG')), service().store);
}
let progressDb: ProgressDatabase | undefined;
function profileProgress() {
  const server = required('PROGRESS_SQL_SERVER');
  if (!/^[a-z0-9-]+\.database\.windows\.net$/.test(server)) throw new ApiError(503, 'configuration_unavailable');
  return progressDb ??= new ProgressDatabase(credential, server, required('PROGRESS_SQL_DATABASE'));
}
app.http('profileLogin', { route: 'v1/profile/login', methods: ['POST', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => ({
    status: 200, jsonBody: await profileAuth().login(await progressJson(request, 2048)),
  })) });
app.http('voicePilot', { route: 'v1/profile/voice', methods: ['POST', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => {
    if (process.env.VOICE_PILOT_ENABLED !== 'true') throw new ApiError(503, 'voice_unavailable');
    const auth = profileAuth();
    const profile = auth.profile(request.headers.get('authorization'));
    const answer = await connectVoice(await progressJson(request, 32 * 1024), auth.profileName(profile), credential, {
      endpoint: required('VOICE_FOUNDRY_ENDPOINT'),
      deployment: required('VOICE_FOUNDRY_DEPLOYMENT'),
      liveDeployment: process.env.VOICE_LIVE_DEPLOYMENT,
    });
    return typeof answer === 'string'
      ? { status: 200, headers: { 'Content-Type': 'application/sdp' }, body: answer }
      : { status: 200, jsonBody: answer };
  }) });
app.http('profileHistory', { route: 'v1/profile/progress', methods: ['GET', 'POST', 'OPTIONS'], authLevel: 'anonymous',
  handler: request => handle(request, async () => {
    const profile = profileAuth().profile(request.headers.get('authorization'));
    if (request.method === 'GET') return {
      status: 200, jsonBody: await profileProgress().read(profile, request.query.get('after') ?? ''),
    };
    await profileProgress().append(profile, validateEvents(await progressJson(request, 64 * 1024)));
    return { status: 204 };
  }) });
app.timer('cleanupReviews', { schedule: '0 */5 * * * *', runOnStartup: false, useMonitor: true,
  handler: async (_timer, context) => {
    try { await service().cleanup(); } catch {
      context.error('Photo review cleanup incomplete; operator action required.');
      throw new Error('Photo review cleanup incomplete');
    }
  } });
