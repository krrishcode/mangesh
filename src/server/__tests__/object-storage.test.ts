import { afterEach, describe, expect, it, vi } from 'vitest';
import { imageSignatureMatches, managedObjectKey, objectUrl, signedImageUpload } from '../lib/object-storage';
afterEach(()=>vi.unstubAllEnvs());
describe('R2 storage boundaries',()=>{
  it('only deletes product objects on the configured CDN',()=>{
    vi.stubEnv('R2_PUBLIC_URL','https://cdn.mangeshmahadev.com');
    expect(managedObjectKey('https://cdn.mangeshmahadev.com/products/photo.webp')).toBe('products/photo.webp');
    for(const url of ['https://evil.example/products/photo.webp','https://cdn.mangeshmahadev.com/images/hero.webp','https://cdn.mangeshmahadev.com/products/photo.webp?x=1','https://cdn.mangeshmahadev.com.evil.example/products/photo.webp','/products/photo.webp'])expect(managedObjectKey(url)).toBeNull();
  });
  it('rejects object-key traversal and unsupported characters',()=>{
    for(const key of ['../photo.png','products/../photo.png','products/a?x=1','products/a#x','products/a b.jpg'])expect(()=>objectUrl(key)).toThrow();
  });
  it('verifies JPEG, PNG and WebP signatures rather than trusting extensions',()=>{
    expect(imageSignatureMatches(new Uint8Array([255,216,255,1]),'image/jpeg')).toBe(true);
    expect(imageSignatureMatches(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png')).toBe(true);
    expect(imageSignatureMatches(new TextEncoder().encode('RIFF0000WEBP'),'image/webp')).toBe(true);
    expect(imageSignatureMatches(new TextEncoder().encode('<svg>hello</svg>'),'image/png')).toBe(false);
    expect(imageSignatureMatches(new Uint8Array(),'image/jpeg')).toBe(false);
  });
  it('expires upload URLs and signs the file size and media type',async()=>{
    vi.stubEnv('R2_ACCOUNT_ID','fixture');vi.stubEnv('R2_BUCKET','fixture');
    vi.stubEnv('R2_ACCESS_KEY_ID','fixture');vi.stubEnv('R2_SECRET_ACCESS_KEY','fixture');
    const url=new URL(await signedImageUpload('products/photo.png','image/png',128));
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-length');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toContain('content-type');
  });
});
