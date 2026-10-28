import { AwsClient } from 'aws4fetch';

export function objectUrl(key: string): string {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.split('/').some(part => part === '.' || part === '..')) throw new Error('Invalid object key');
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`;
}
export function publicObjectUrl(key: string): string {
  objectUrl(key);
  return `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${key}`;
}
export function managedObjectKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    const origin = new URL(process.env.R2_PUBLIC_URL || 'https://cdn.mangeshmahadev.com');
    if (parsed.origin !== origin.origin || parsed.search || parsed.hash) return null;
    const key = parsed.pathname.slice(1);
    if (!key.startsWith('products/') || !/^[a-zA-Z0-9/_.-]+$/.test(key) || key.split('/').some(part => part === '.' || part === '..')) return null;
    return key;
  } catch { return null; }
}
export function storageClient() {
  return new AwsClient({ accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, service: 's3', region: 'auto', retries: 2 });
}
export async function signedImageUpload(key: string, type: string, size: number): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set('X-Amz-Expires', '300');
  const signed = await storageClient().sign(url, {
    method: 'PUT', headers: { 'Content-Type': type, 'Content-Length': String(size), 'Cache-Control': 'public, max-age=86400' },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}
export function imageSignatureMatches(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n);
  if (type === 'image/webp') return new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
  return false;
}
