import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from '../../lib/upload';
import { authenticate } from '../http/auth';
import { AppError } from './errors';

const UPLOAD_PATH = /^products\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function validateUploadPath(pathname: string): void {
  if (!UPLOAD_PATH.test(pathname)) throw new AppError(400, 'Invalid upload path.');
}

export async function authorizeUpload(request: Request) {
  const user = await authenticate(request);
  if (user.role !== 'admin') throw new AppError(403, 'Forbidden: admin access required');
  return {
    allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
    maximumSizeInBytes: MAX_UPLOAD_BYTES,
    addRandomSuffix: true,
  };
}
