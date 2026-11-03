import type { ContainerClient } from '@azure/storage-blob';
import { ApiError } from './contracts.js';

export type Versioned<T> = { value: T; etag: string };
export interface Store {
  read<T>(name: string): Promise<Versioned<T> | null>;
  write<T>(name: string, value: T, etag: string | null): Promise<boolean>;
  putPhoto(name: string, bytes: Buffer, expires: number): Promise<void>;
  remove(name: string, etag?: string): Promise<void>;
  list(prefix: string): AsyncIterable<{ name: string; modified: number }>;
  ready(): Promise<void>;
}
function status(e: unknown) { return (e as { statusCode?: number }).statusCode; }
export class BlobStore implements Store {
  constructor(private readonly container: ContainerClient) {}
  async read<T>(name: string): Promise<Versioned<T> | null> {
    try {
      const b = await this.container.getBlobClient(name).download(0, undefined, { abortSignal: AbortSignal.timeout(5000) });
      if (!b.etag || (b.contentLength ?? Infinity) > 256 * 1024) throw new ApiError(503, 'state_unavailable');
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of b.readableStreamBody!) {
        const bytes = Buffer.from(chunk); size += bytes.length;
        if (size > 256 * 1024) throw new ApiError(503, 'state_unavailable');
        chunks.push(bytes);
      }
      return { value: JSON.parse(Buffer.concat(chunks).toString('utf8')) as T, etag: b.etag };
    } catch (e) { if (status(e) === 404) return null; throw e; }
  }
  async write<T>(name: string, value: T, etag: string | null) {
    try {
      const data = Buffer.from(JSON.stringify(value));
      await this.container.getBlockBlobClient(name).upload(data, data.length, {
        abortSignal: AbortSignal.timeout(5000),
        conditions: etag ? { ifMatch: etag } : { ifNoneMatch: '*' },
        blobHTTPHeaders: { blobContentType: 'application/json', blobCacheControl: 'no-store' },
      });
      return true;
    } catch (e) { if (status(e) === 409 || status(e) === 412) return false; throw e; }
  }
  async putPhoto(name: string, bytes: Buffer, expires: number) {
    await this.container.getBlockBlobClient(name).upload(bytes, bytes.length, {
      abortSignal: AbortSignal.timeout(5000),
      conditions: { ifNoneMatch: '*' }, metadata: { expires: String(expires) },
      blobHTTPHeaders: { blobContentType: 'image/jpeg', blobCacheControl: 'no-store' },
    });
  }
  async remove(name: string, etag?: string) {
    try { await this.container.getBlobClient(name).deleteIfExists({ abortSignal: AbortSignal.timeout(5000), conditions: etag ? { ifMatch: etag } : undefined }); }
    catch (e) { if (status(e) !== 412) throw e; }
  }
  async *list(prefix: string) {
    for await (const b of this.container.listBlobsFlat({ prefix, abortSignal: AbortSignal.timeout(30000) }))
      yield { name: b.name, modified: b.properties.lastModified?.getTime() ?? 0 };
  }
  async ready() { await this.container.getProperties({ abortSignal: AbortSignal.timeout(5000) }); }
}

// CAS mutation retries are storage-only. Never put a model call inside this callback.
export async function mutate<T>(store: Store, name: string, change: (previous: T | null) => T): Promise<T> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const current = await store.read<T>(name);
    const next = change(current?.value ?? null);
    if (await store.write(name, next, current?.etag ?? null)) return next;
  }
  throw new ApiError(503, 'state_contention');
}