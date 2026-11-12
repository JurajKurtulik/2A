import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Connection, Request, TYPES } from 'tedious';
import type { TokenCredential } from '@azure/core-auth';
import type { HttpRequest } from '@azure/functions';
import { ApiError } from './contracts.js';
import { boundedBody } from './http.js';
import { mutate, type Store } from './store.js';

const derive = promisify(scrypt);
const idPattern = /^[a-z0-9-]{1,32}$/;
const eventPattern = /^[a-f0-9]{64}$/;
const sessionLength = 30 * 24 * 60 * 60 * 1000;
const pageSize = 100;
type Account = { id: string; username: string; name: string; avatar: string; legacySlot?: number; salt: string; hash: string };
type Config = { signingKey: string; accounts: Account[] };
type Event = { id: string; entry: unknown };

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'invalid_progress');
  return value as Record<string, unknown>;
}
function count(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
const shortText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max;

export function validateEvents(value: unknown): Event[] {
  const events = object(value).events;
  if (!Array.isArray(events) || events.length < 1 || events.length > 20) throw new ApiError(400, 'invalid_progress');
  return events.map(value => {
    const { id, entry } = object(value), e = object(entry);
    if (typeof id !== 'string' || !eventPattern.test(id) ||
      !shortText(e.date, 35) || !Number.isFinite(Date.parse(e.date)) ||
      !shortText(e.label, 200) || !['practice', 'test'].includes(String(e.kind)) ||
      !count(e.grade, 0, 9) || !count(e.total, 1, 120) || !count(e.score, 0, e.total) ||
      (e.correctedScore !== undefined && !count(e.correctedScore, 0, e.total)) ||
      (e.variant !== undefined && !shortText(e.variant, 64)) ||
      !Array.isArray(e.topics) || e.topics.length > 30)
      throw new ApiError(400, 'invalid_progress');
    const topics = e.topics.map(value => {
      const t = object(value);
      if (!shortText(t.id, 80) || !count(t.total, 1, 120) || !count(t.right, 0, t.total))
        throw new ApiError(400, 'invalid_progress');
      return { id: t.id, total: t.total, right: t.right };
    });
    return { id, entry: { date: new Date(e.date).toISOString(), label: e.label, kind: e.kind, grade: e.grade,
      score: e.score, correctedScore: e.correctedScore, total: e.total, variant: e.variant, topics } };
  });
}

export function parseProgressConfig(raw: string): Config {
  const c = JSON.parse(raw) as Config;
  if (!/^[a-f0-9]{64}$/.test(c.signingKey) || !Array.isArray(c.accounts) || !c.accounts.length ||
    c.accounts.some(a => !idPattern.test(a.id) || !idPattern.test(a.username) ||
      !shortText(a.name, 40) || !shortText(a.avatar, 12) || !/^[a-f0-9]{32}$/.test(a.salt) ||
      !/^[a-f0-9]{128}$/.test(a.hash) || (a.legacySlot !== undefined && !count(a.legacySlot, 0, 2))) ||
    new Set(c.accounts.map(a => a.id)).size !== c.accounts.length ||
    new Set(c.accounts.map(a => a.username)).size !== c.accounts.length)
    throw new ApiError(503, 'configuration_unavailable');
  return c;
}

export class ProfileAuth {
  private readonly dummySalt = randomBytes(16);
  constructor(private readonly config: Config, private readonly store: Store, private readonly now = Date.now) {}
  private signature(payload: string, a: Account) {
    return createHmac('sha256', Buffer.from(this.config.signingKey, 'hex')).update(payload).update(a.hash).digest();
  }
  async login(value: unknown) {
    const { username, password } = object(value);
    if (!shortText(username, 64) || !shortText(password, 128)) throw new ApiError(401, 'invalid_login');
    const a = this.config.accounts.find(account => account.username === username.trim().toLowerCase());
    const bucket = a?.id ?? 'unknown';
    const window = Math.floor(this.now() / (10 * 60 * 1000));
    await mutate<{ window: number; count: number }>(this.store, `progress-login/${bucket}.json`, previous => {
      const attempts = previous?.window === window ? previous.count : 0;
      if (attempts >= 15) throw new ApiError(429, 'login_limit');
      return { window, count: attempts + 1 };
    });
    const hash = await derive(password, a ? Buffer.from(a.salt, 'hex') : this.dummySalt, 64) as Buffer;
    if (!a || !timingSafeEqual(hash, Buffer.from(a.hash, 'hex'))) throw new ApiError(401, 'invalid_login');
    const expires = this.now() + sessionLength;
    const payload = `${a.id}.${expires}`;
    return {
      token: `${payload}.${this.signature(payload, a).toString('base64url')}`,
      expires,
      profile: { id: a.id, name: a.name, avatar: a.avatar, legacySlot: a.legacySlot },
    };
  }
  profile(authorization: string | null) {
    const match = /^Bearer ([a-z0-9-]{1,32})\.(\d{13})\.([\w-]{43})$/.exec(authorization ?? '');
    if (!match) throw new ApiError(401, 'authorization_required');
    const [, id, expires, signature] = match;
    const account = this.config.accounts.find(a => a.id === id);
    if (!account || Number(expires) <= this.now() ||
      !timingSafeEqual(Buffer.from(signature, 'base64url'), this.signature(`${id}.${expires}`, account)))
      throw new ApiError(401, 'authorization_required');
    return id;
  }
}

export async function progressJson(request: HttpRequest, limit: number): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new ApiError(415, 'json_required');
  const bytes = await boundedBody(request.body, limit);
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new ApiError(400, 'invalid_json'); }
}

export class ProgressDatabase {
  constructor(private readonly credential: TokenCredential, private readonly server: string, private readonly database: string) {}
  private async execute(query: string, setup: (request: Request) => void): Promise<Event[]> {
    const access = await this.credential.getToken('https://database.windows.net/.default');
    if (!access) throw new ApiError(503, 'progress_unavailable');
    const connection = new Connection({
      server: this.server,
      authentication: { type: 'azure-active-directory-access-token', options: { token: access.token } },
      options: { database: this.database, encrypt: true, trustServerCertificate: false, connectTimeout: 8000, requestTimeout: 10000 },
    });
    const result: Event[] = [];
    try {
      await new Promise<void>((resolve, reject) => connection.connect(error => error ? reject(error) : resolve()));
      await new Promise<void>((resolve, reject) => {
        const request = new Request(query, error => error ? reject(error) : resolve());
        request.on('row', columns => result.push({ id: columns[0].value, entry: JSON.parse(columns[1].value) }));
        setup(request);
        connection.execSql(request);
      });
      return result;
    } catch {
      throw new ApiError(503, 'progress_unavailable');
    } finally {
      connection.close();
    }
  }
  async read(profile: string, after: string) {
    if (after && !eventPattern.test(after)) throw new ApiError(400, 'invalid_cursor');
    const events = await this.execute(`SELECT TOP (${pageSize + 1}) EventId, Payload FROM dbo.ProfileProgress
      WHERE ProfileId = @profile AND EventId > @after ORDER BY EventId`, request => {
      request.addParameter('profile', TYPES.VarChar, profile, { length: 32 });
      request.addParameter('after', TYPES.VarChar, after, { length: 64 });
    });
    const page = events.slice(0, pageSize);
    return { events: page, next: events.length > pageSize ? page.at(-1)!.id : null };
  }
  async append(profile: string, events: Event[]) {
    await this.execute(`INSERT INTO dbo.ProfileProgress (ProfileId, EventId, Payload)
      SELECT @profile, e.EventId, e.Payload FROM OPENJSON(@events)
      WITH (EventId varchar(64) '$.id', Payload nvarchar(max) '$.entry' AS JSON) e`, request => {
      request.addParameter('profile', TYPES.VarChar, profile, { length: 32 });
      request.addParameter('events', TYPES.NVarChar, JSON.stringify(events), { length: Infinity });
    });
  }
}
