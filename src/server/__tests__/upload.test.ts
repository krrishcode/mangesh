import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../http/auth', async () => {
  const { AppError } = await import('../lib/errors');
  return {
    authenticate: async (request: Request) => {
      const token = request.headers.get('authorization');
      if (!['Bearer admin', 'Bearer customer'].includes(token || '')) {
        throw new AppError(401, 'Unauthorized: missing bearer token');
      }
      return {
        id: 1,
        email: 'admin@example.invalid',
        role: token === 'Bearer admin' ? 'admin' : 'customer',
      };
    },
  };
});

import { storageConfigured, authorizeUpload, validateUploadPath } from '../lib/upload';
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, extensionForType } from '../../lib/upload';

function request(token = '') {
  return new Request('http://localhost/api/account/media/upload', {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
}

async function failure(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (error: any) {
    return { status: error.status, message: error.message };
  }
}

afterEach(() => vi.unstubAllEnvs());

describe('admin image upload authorization', () => {
  it('rejects anonymous and customer uploads', async () => {
    expect(await failure(authorizeUpload(request()))).toMatchObject({ status: 401 });
    expect(await failure(authorizeUpload(request('customer')))).toMatchObject({ status: 403 });
  });

  it('authorizes an admin with the existing image constraints', async () => {
    await expect(authorizeUpload(request('admin'))).resolves.toEqual({
      allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
      maximumSizeInBytes: MAX_UPLOAD_BYTES,
    });
  });

  it('only accepts product image paths', () => {
    expect(() => validateUploadPath('products/3f2c1a7e-1.jpg')).not.toThrow();
    expect(() => validateUploadPath('products/photo_1-final.webp')).not.toThrow();
    expect(() => validateUploadPath('products/photo.png')).not.toThrow();

    for (const path of [
      'products/photo.svg',
      'products/photo.html',
      '../products/photo.jpg',
      '/products/photo.jpg',
      'products/photo.jpg/extra',
      'other/photo.jpg',
      'products/.jpg',
    ]) {
      expect(() => validateUploadPath(path)).toThrow('Invalid upload path.');
    }
  });

  it('derives a safe extension from the validated media type', () => {
    expect(extensionForType('image/jpeg')).toBe('jpg');
    expect(extensionForType('image/png')).toBe('png');
    expect(extensionForType('image/webp')).toBe('webp');
    expect(extensionForType('application/octet-stream')).toBe('jpg');
  });

  it('requires every server-side R2 setting', () => {
    for (const key of ['R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_PUBLIC_URL']) vi.stubEnv(key,'');
    expect(storageConfigured()).toBe(false);
    for (const key of ['R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_PUBLIC_URL']) vi.stubEnv(key,'fixture');
    expect(storageConfigured()).toBe(true);
  });
});
