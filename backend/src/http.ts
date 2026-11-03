import sharp from 'sharp';
import { ApiError } from './contracts.js';

type BodyStream = { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }>; cancel(): Promise<void>; releaseLock(): void } };
export async function boundedBody(body: BodyStream | null, max: number): Promise<Buffer> {
  if (!body) throw new ApiError(400, 'empty_body');
  const reader = body.getReader(), chunks: Buffer[] = []; let size = 0;
  const deadline = Date.now() + 15000;
  try {
    for (;;) {
      let timeout: ReturnType<typeof setTimeout>;
      const part = await Promise.race([reader.read(), new Promise<never>((_, reject) => {
        timeout = setTimeout(() => { void reader.cancel(); reject(new ApiError(400, 'body_timeout')); }, Math.max(1, deadline - Date.now()));
      })]).finally(() => clearTimeout(timeout));
      if (part.done) break;
      if (!part.value) throw new ApiError(400, 'invalid_body');
      size += part.value.length;
      if (size > max) { await reader.cancel(); throw new ApiError(413, 'body_too_large'); }
      chunks.push(Buffer.from(part.value));
    }
  } finally { reader.releaseLock(); }
  if (!size) throw new ApiError(400, 'empty_body');
  return Buffer.concat(chunks);
}
export async function jpeg(bytes: Buffer): Promise<Buffer> {
  if (bytes.length > 4 * 1024 * 1024) throw new ApiError(413, 'photo_too_large');
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new ApiError(415, 'invalid_jpeg');
  try {
    // Decode and re-encode so even forged clients cannot forward EXIF to the model.
    const image = sharp(bytes, { page: 0, pages: 1, limitInputPixels: 2200 * 2200, failOn: 'warning' });
    const info = await image.metadata();
    if (info.format !== 'jpeg' || !info.width || !info.height || info.width > 2200 || info.height > 2200
      || (info.pages ?? 1) !== 1) throw new Error('dimensions');
    const cleaned = await image.timeout({ seconds: 5 }).rotate().jpeg({ quality: 95 }).toBuffer();
    if (cleaned.length > 4 * 1024 * 1024) throw new ApiError(413, 'photo_too_large');
    return cleaned;
  } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError(415, 'invalid_jpeg'); }
}