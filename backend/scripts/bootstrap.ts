#!/usr/bin/env -S npx tsx
import { randomBytes } from 'node:crypto';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient, type KeyVaultSecret } from '@azure/keyvault-secrets';
import { BlobServiceClient } from '@azure/storage-blob';
import { BlobStore } from '../src/store.js';

type Quota = { day: string; month: string; daily: number; monthly: number };
const quotaPath = 'quota/model.json';
class OperatorError extends Error {}
function stop(message: string): never { throw new OperatorError(message); }
function required(name: string) {
  return process.env[name]?.trim() || stop(`Missing ${name}.`);
}
function endpoint(name: string) {
  const url = new URL(required(name));
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
    || url.pathname !== '/' || url.port && url.port !== '443') stop(`Invalid ${name}; HTTPS service root required.`);
  return url.href;
}
function validateQuota(value: unknown): asserts value is Quota {
  if (!value || typeof value !== 'object' || Array.isArray(value)) stop('Quota schema invalid; stop and investigate.');
  const q = value as Record<string, unknown>;
  const today = new Date().toISOString().slice(0, 10);
  if (Object.keys(q).sort().join(',') !== 'daily,day,month,monthly'
    || typeof q.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(q.day)
    || !Number.isFinite(Date.parse(`${q.day}T00:00:00.000Z`))
    || new Date(`${q.day}T00:00:00.000Z`).toISOString().slice(0, 10) !== q.day
    || typeof q.month !== 'string' || q.month !== q.day.slice(0, 7)
    || q.day > today || q.month > today.slice(0, 7)
    || !Number.isSafeInteger(q.daily) || !Number.isSafeInteger(q.monthly)
    || Number(q.daily) < 0 || Number(q.monthly) < Number(q.daily))
    stop('Quota schema invalid or future-dated; stop and investigate, never reset it.');
}
function validateSecret(secret: KeyVaultSecret) {
  const value = secret.value ?? '', bytes = Buffer.from(value, 'base64');
  const now = Date.now();
  if (!secret.properties.version || bytes.length < 32 || bytes.toString('base64') !== value
    || secret.properties.enabled === false || (secret.properties.expiresOn?.getTime() ?? Infinity) <= now
    || (secret.properties.notBefore?.getTime() ?? -Infinity) > now)
    stop('Existing signing secret is unusable; investigate without replacing it.');
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') && args.length === 1) {
    console.log('tsx scripts/bootstrap.ts [--initialize-quota] [--initialize-secret]');
    console.log('Without flags: read-only validation. Initialization requires a single exclusive operator.');
    return;
  }
  if (new Set(args).size !== args.length || args.some(a => !['--initialize-quota', '--initialize-secret'].includes(a)))
    stop('Unknown or repeated flag. Use --help.');
  const storageUrl = endpoint('PHOTO_STORAGE_ACCOUNT_URL'), vaultUrl = endpoint('PHOTO_KEY_VAULT_URL');
  const containerName = required('PHOTO_STORAGE_CONTAINER'), secretName = required('PHOTO_SIGNING_SECRET_NAME');
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61})[a-z0-9]$/.test(containerName) || containerName.includes('--'))
    stop('Invalid PHOTO_STORAGE_CONTAINER.');
  if (!/^[A-Za-z0-9-]{1,127}$/.test(secretName)) stop('Invalid PHOTO_SIGNING_SECRET_NAME.');
  const credential = new DefaultAzureCredential();
  const store = new BlobStore(new BlobServiceClient(storageUrl, credential, {
    retryOptions: { maxTries: 1 },
  }).getContainerClient(containerName));
  // No automatic setSecret retries: a lost response must not create another version.
  const vault = new SecretClient(vaultUrl, credential, { retryOptions: { maxRetries: 0 } });
  await store.ready(); // A missing container is not evidence that the quota is absent.
  const quota = await store.read<unknown>(quotaPath);
  if (quota) validateQuota(quota.value);
  let secret: KeyVaultSecret | undefined;
  try { secret = await vault.getSecret(secretName); }
  catch (error) {
    const e = error as { statusCode?: number; code?: string };
    // Authorization, vault-not-found, network and all ambiguous failures are fatal.
    if (e.statusCode !== 404 || e.code !== 'SecretNotFound') throw error;
  }
  if (secret) validateSecret(secret);
  // Complete read validation before any mutation; missing flags cannot partially initialize.
  if (!quota && !args.includes('--initialize-quota')) stop('Quota absent; explicit --initialize-quota required.');
  if (!secret && !args.includes('--initialize-secret')) stop('Signing secret absent; explicit --initialize-secret required.');
  if (!quota) {
    // Take UTC at the write, never a build-time/example date. No overwrite or reset path.
    const iso = new Date().toISOString();
    const initial: Quota = { day: iso.slice(0, 10), month: iso.slice(0, 7), daily: 0, monthly: 0 };
    if (!await store.write(quotaPath, initial, null)) stop('Quota creation lost a race; stopped without overwriting. Reconcile read-only.');
    const persisted = await store.read<unknown>(quotaPath);
    if (!persisted) stop('Quota write cannot be confirmed; stop and reconcile read-only.');
    validateQuota(persisted.value);
  }
  if (!secret) {
    // Key Vault has no conditional create. This second check narrows, but cannot close,
    // the race: the operator must exclude every other bootstrap/secret writer.
    try { await vault.getSecret(secretName); stop('Signing secret appeared during bootstrap; stopped without writing.'); }
    catch (error) {
      const e = error as { statusCode?: number; code?: string };
      if (e.statusCode !== 404 || e.code !== 'SecretNotFound') throw error;
    }
    const key = randomBytes(32);
    try { validateSecret(await vault.setSecret(secretName, key.toString('base64'), { contentType: 'application/octet-stream' })); }
    finally { key.fill(0); }
  }
  console.log('Quota and signing secret validated; existing state was not intentionally replaced. Feature flags unchanged.');
}
void main().catch(error => {
  // Never emit SDK messages, URLs, response bodies, credentials or secret values.
  console.error(error instanceof OperatorError ? error.message
    : 'Bootstrap failed or outcome is ambiguous. Stop; reconcile quota and secret read-only before any further initialization.');
  process.exitCode = 1;
});