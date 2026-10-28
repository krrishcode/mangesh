import { randomUUID } from 'node:crypto';
import { connectionPool } from '@/server/db';
import { AppError } from '@/server/lib/errors';
import { authorizeUpload, storageConfigured, validateUploadPath } from '@/server/lib/upload';
import { imageSignatureMatches, objectUrl, publicObjectUrl, signedImageUpload, storageClient } from '@/server/lib/object-storage';
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, extensionForType } from '@/lib/upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
function originAllowed(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  return !origin || [new URL(request.url).origin, process.env.APP_ORIGIN].includes(origin);
}
export async function POST(request: Request) {
  if (!originAllowed(request)) return json({ success: false, error: 'Invalid request origin' }, 403);
  try {
    await authorizeUpload(request);
    if (!storageConfigured()) throw new AppError(503, 'Image storage is not configured.');
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') throw new AppError(400, 'Invalid upload request.');
    if (body.action === 'prepare') {
      if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(body.contentType) || !Number.isSafeInteger(body.size) || body.size < 12 || body.size > MAX_UPLOAD_BYTES) throw new AppError(400, 'Choose a JPG, PNG or WebP image up to 8 MB.');
      const key = `products/${randomUUID()}.${extensionForType(body.contentType)}`;
      const url = publicObjectUrl(key);
      await connectionPool.query('INSERT INTO media_assets(object_key,url,content_type,byte_size) VALUES($1,$2,$3,$4)', [key,url,body.contentType,body.size]);
      return json({ success: true, key, url, uploadUrl: await signedImageUpload(key,body.contentType,body.size) });
    }
    if (body.action !== 'complete' || typeof body.key !== 'string') throw new AppError(400, 'Invalid upload action.');
    validateUploadPath(body.key);
    const { rows: [asset] } = await connectionPool.query('SELECT * FROM media_assets WHERE object_key=$1 AND state<>$2', [body.key,'deleted']);
    if (!asset) throw new AppError(404, 'Upload not found.');
    const client = storageClient();
    const head = await client.fetch(objectUrl(body.key), { method: 'HEAD' });
    if (!head.ok || Number(head.headers.get('content-length')) !== Number(asset.byte_size) || head.headers.get('content-type') !== asset.content_type) throw new AppError(400, 'Upload is incomplete or does not match the selected image.');
    const check = await client.fetch(objectUrl(body.key), { headers: { Range: 'bytes=0-15' } });
    if (!check.ok || !imageSignatureMatches(new Uint8Array(await check.arrayBuffer()), asset.content_type)) throw new AppError(400, 'The uploaded file is not a supported image.');
    await connectionPool.query("UPDATE media_assets SET state='ready' WHERE object_key=$1 AND state<>'deleted'", [body.key]);
    return json({ success: true, url: asset.url });
  } catch (error) {
    if (error instanceof AppError) return json({ success: false, error: error.message }, error.status);
    console.error('Image upload failed');
    return json({ success: false, error: 'Image upload failed. Please try again.' }, 500);
  }
}
