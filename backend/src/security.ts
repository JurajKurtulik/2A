import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SecretClient } from '@azure/keyvault-secrets';
import type { Session } from './contracts.js';
import { ApiError, sha256 } from './contracts.js';

export interface Keys { get(version?: string): Promise<{ version: string; key: Buffer }> }
export class VaultKeys implements Keys {
  private cache = new Map<string, { until: number; key: Buffer; version: string }>();
  constructor(private readonly vault: SecretClient, private readonly name: string) {}
  async get(version?: string) {
    const cached = this.cache.get(version ?? 'latest');
    if (cached && cached.until > Date.now()) return cached;
    const secret = await this.vault.getSecret(this.name, { ...(version ? { version } : {}), abortSignal: AbortSignal.timeout(5000) });
    const key = Buffer.from(secret.value ?? '', 'base64');
    if (key.length < 32 || !secret.properties.version) throw new ApiError(503, 'signing_unavailable');
    const entry = { key, version: secret.properties.version, until: Date.now() + 60000 };
    // At most latest + a bounded number of overlapping versions per worker.
    if (this.cache.size > 8) this.cache.clear();
    this.cache.set(version ?? 'latest', entry); return entry;
  }
}
export function token(key: Buffer, session: Pick<Session, 'id' | 'expiresAt'>, purpose: 'owner' | 'upload') {
  return createHmac('sha256', key).update(JSON.stringify(['review-v1', purpose, session.id, session.expiresAt])).digest('base64url');
}
export function authenticate(candidate: string | undefined, hash: string) {
  if (!candidate || !/^[A-Za-z0-9_-]{43}$/.test(candidate)) throw new ApiError(403, 'forbidden');
  const expected = Buffer.from(hash, 'hex'), actual = Buffer.from(sha256(candidate), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new ApiError(403, 'forbidden');
}
export const privateIpKey = (key: Buffer, ip: string, day: string) =>
  createHmac('sha256', key).update(`rate-v1:${day}:${ip}`).digest('hex');