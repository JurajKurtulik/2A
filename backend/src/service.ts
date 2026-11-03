import { randomBytes } from 'node:crypto';
import { ApiError, parseCreate, parseResult, sha256, type Session, type Result } from './contracts.js';
import { authenticate, privateIpKey, token, type Keys } from './security.js';
import { mutate, type Store } from './store.js';

export interface Ocr { recognize(photo: Buffer, ids: string[], signal: AbortSignal): Promise<Result> }
export type Settings = { enabled: boolean; daily: number; monthly: number; modelTimeout: number };
type CreateMap = { session: Session };
type Quota = { day: string; month: string; daily: number; monthly: number };
type Rate = { expires: number; windows: Record<string, { count: number; until: number }> };
const sessionPath = (id: string) => `sessions/${id}.json`;
const photoPath = (id: string) => `photos/${id}.jpg`;

export class ReviewService {
  constructor(readonly store: Store, readonly keys: Keys, readonly ocr: Ocr,
    readonly settings: Settings, readonly now: () => number = Date.now) {}
  private enabled() { if (!this.settings.enabled) throw new ApiError(503, 'disabled'); }
  private async rate(name: string, rules: { key: string; max: number; duration: number }[]) {
    const now = this.now();
    await mutate<Rate>(this.store, name, previous => {
      const windows = { ...(previous?.windows ?? {}) };
      for (const [key, value] of Object.entries(windows)) if (value.until <= now) delete windows[key];
      for (const rule of rules) {
        const bucket = windows[rule.key] ?? { count: 0, until: now + rule.duration };
        if (!Number.isSafeInteger(bucket.count) || bucket.count < 0) throw new ApiError(503, 'rate_state');
        if (bucket.count >= rule.max) throw new ApiError(429, 'rate_limit');
        windows[rule.key] = { ...bucket, count: bucket.count + 1 };
      }
      if (Object.keys(windows).length > 1600) throw new ApiError(429, 'rate_limit');
      return { expires: Math.max(...Object.values(windows).map(w => w.until)), windows };
    });
  }
  async create(input: unknown, requestId: string, ip: string) {
    this.enabled();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))
      throw new ApiError(400, 'invalid_idempotency_key');
    const { assignment, digest } = parseCreate(input);
    const key = await this.keys.get();
    const ipHash = privateIpKey(key.key, ip, new Date(this.now()).toISOString().slice(0, 10));
    await this.rate('rates/create.json', [
      { key: 'global-day', max: 500, duration: 86400000 },
      { key: `day:${ipHash}`, max: 100, duration: 86400000 },
      { key: `minute:${ipHash}`, max: 5, duration: 60000 },
    ]);
    const mapping = `creates/${sha256(requestId)}.json`;
    const now = this.now();
    const candidate: Session = {
      id: randomBytes(24).toString('base64url'), assignment, assignmentDigest: digest,
      createdAt: now, expiresAt: new Date(now + 1800000).toISOString(), keyVersion: key.version,
      ownerHash: '', uploadHash: '', state: 'waiting',
    };
    candidate.ownerHash = sha256(token(key.key, candidate, 'owner'));
    candidate.uploadHash = sha256(token(key.key, candidate, 'upload'));
    const mapped = await mutate<CreateMap>(this.store, mapping, old => {
      if (old) {
        if (old.session.assignmentDigest !== digest) throw new ApiError(409, 'idempotency_conflict');
        if (Date.parse(old.session.expiresAt) <= this.now()) throw new ApiError(410, 'expired');
        return old;
      }
      return { session: candidate };
    });
    // The mapping is published first, making crash recovery deterministic. Never overwrite live state.
    const s = mapped.session;
    if (!await this.store.read<Session>(sessionPath(s.id))) {
      await this.store.write(sessionPath(s.id), s, null);
    }
    const signing = await this.keys.get(s.keyVersion);
    return { id: s.id, assignmentId: s.assignment.id, assignmentDigest: s.assignmentDigest,
      expiresAt: s.expiresAt, ownerToken: token(signing.key, s, 'owner'), uploadToken: token(signing.key, s, 'upload') };
  }
  private async session(id: string, candidate: string | undefined, purpose: 'owner' | 'upload') {
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(id)) throw new ApiError(403, 'forbidden');
    const current = await this.store.read<Session>(sessionPath(id));
    if (!current) throw new ApiError(403, 'forbidden');
    authenticate(candidate, purpose === 'owner' ? current.value.ownerHash : current.value.uploadHash);
    if (Date.parse(current.value.expiresAt) <= this.now()) throw new ApiError(410, 'expired');
    return current;
  }
  async status(id: string, owner: string | undefined) {
    let current = await this.session(id, owner, 'owner');
    await this.rate(`rates/status-${id}.json`, [{ key: 'poll', max: 30, duration: 60000 }]);
    if (current.value.state === 'processing' && (current.value.processingDeadline ?? 0) <= this.now()) {
      const next = { ...current.value, state: 'failed' as const };
      await this.store.write(sessionPath(id), next, current.etag);
      current = (await this.store.read<Session>(sessionPath(id)))!;
    }
    const s = current.value;
    return { id: s.id, assignmentId: s.assignment.id, assignmentDigest: s.assignmentDigest,
      expiresAt: s.expiresAt, status: s.state, ...(s.state === 'completed' ? { result: s.result } : {}) };
  }
  private async reserveQuota() {
    const iso = new Date(this.now()).toISOString(), day = iso.slice(0, 10), month = iso.slice(0, 7);
    await mutate<Quota>(this.store, 'quota/model.json', old => {
      // Missing/corrupt quota is an incident, not permission to reset accounting.
      if (!old || !/^\d{4}-\d{2}-\d{2}$/.test(old.day) || !/^\d{4}-\d{2}$/.test(old.month)
        || !Number.isSafeInteger(old.daily) || !Number.isSafeInteger(old.monthly)
        || old.daily < 0 || old.monthly < old.daily || old.day.slice(0, 7) !== old.month
        || new Date(old.day + 'T00:00:00Z').toISOString().slice(0, 10) !== old.day
        || old.day > day || old.month > month)
        throw new ApiError(503, 'quota_unavailable');
      const daily = old.day === day ? old.daily : 0;
      const monthly = old.month === month ? old.monthly : 0;
      if (daily >= this.settings.daily || monthly >= this.settings.monthly) throw new ApiError(429, 'quota_exhausted');
      return { day, month, daily: daily + 1, monthly: monthly + 1 };
    });
  }
  async upload(id: string, uploadToken: string | undefined, requestId: string, prepare: () => Promise<Buffer>) {
    const started = this.now();
    this.enabled();
    if (requestId !== id) throw new ApiError(400, 'invalid_idempotency_key');
    const current = await this.session(id, uploadToken, 'upload');
    if (current.value.state === 'completed') return;
    if (current.value.state !== 'waiting') throw new ApiError(409, 'already_attempted');
    await this.rate(`rates/upload-${id}.json`, [{ key: 'upload', max: 5, duration: 60000 }]);
    // Validate before consuming the single attempt. The subsequent CAS excludes all competing workers.
    const bytes = await prepare();
    if (Date.parse(current.value.expiresAt) <= this.now()) throw new ApiError(410, 'expired');
    const processing: Session = { ...current.value, state: 'processing', processingDeadline: started + 165000 };
    if (!await this.store.write(sessionPath(id), processing, current.etag)) throw new ApiError(409, 'already_processing');
    const claimed = await this.store.read<Session>(sessionPath(id));
    if (!claimed || claimed.value.state !== 'processing') throw new ApiError(503, 'state_unavailable');
    const deadline = AbortSignal.timeout(this.settings.modelTimeout);
    let result: Result | undefined, failure: unknown;
    try {
      await this.store.putPhoto(photoPath(id), bytes, Date.parse(processing.expiresAt));
      await this.reserveQuota();
      const dispatch = await this.store.read<Session>(sessionPath(id));
      if (!dispatch || dispatch.etag !== claimed.etag || dispatch.value.state !== 'processing'
        || this.now() + this.settings.modelTimeout + 15000 >= processing.processingDeadline!
        || Date.parse(processing.expiresAt) <= this.now()) throw new ApiError(503, 'processing_deadline');
      // No CAS retry or transport retry can ever reach this call twice for the same session.
      result = parseResult(await this.ocr.recognize(bytes, processing.assignment.items.map(i => i.id), deadline),
        processing.assignment.items.map(i => i.id));
    } catch (e) { failure = e; }
    try { await this.store.remove(photoPath(id)); } catch (e) { failure = e; }
    const finished: Session = { ...processing, state: failure ? 'failed' : 'completed', ...(failure ? {} : { result }) };
    // Fencing: stale worker cannot overwrite Timer/status terminal state.
    if (!await this.store.write(sessionPath(id), finished, claimed.etag)) throw new ApiError(503, 'result_not_committed');
    if (failure) throw failure instanceof ApiError ? failure : new ApiError(503, 'review_failed');
  }
  async cleanup() {
    const now = this.now(); let failures = 0;
    for (const prefix of ['sessions/', 'creates/', 'photos/', 'rates/']) {
      for await (const blob of this.store.list(prefix)) {
        try {
          if (prefix === 'photos/') {
            // A photo exists only after a processing claim. Delete orphaned/stale photos promptly.
            if (blob.modified + 180000 < now) await this.store.remove(blob.name);
            continue;
          }
          const entry = await this.store.read<Session | CreateMap | Rate>(blob.name);
          if (!entry) continue;
          if (prefix === 'rates/') {
            if ((entry.value as Rate).expires <= now) await this.store.remove(blob.name, entry.etag);
            continue;
          }
          const s = prefix === 'creates/' ? (entry.value as CreateMap).session : entry.value as Session;
          if (Date.parse(s.expiresAt) <= now) {
            if (prefix === 'sessions/') await this.store.remove(photoPath(s.id));
            await this.store.remove(blob.name, entry.etag);
          } else if (prefix === 'sessions/' && s.state === 'processing' && (s.processingDeadline ?? 0) <= now) {
            await this.store.write(blob.name, { ...s, state: 'failed' }, entry.etag);
            await this.store.remove(photoPath(s.id));
          }
        } catch { failures++; }
      }
    }
    if (failures) throw new ApiError(503, 'cleanup_incomplete');
  }
}