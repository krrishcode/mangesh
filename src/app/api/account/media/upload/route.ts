import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { AppError } from '@/server/lib/errors';
import { authorizeUpload, blobConfigured, validateUploadPath } from '@/server/lib/upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function originAllowed(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    /* Fall through to APP_ORIGIN. */
  }
  if (process.env.APP_ORIGIN) {
    try {
      allowed.add(new URL(process.env.APP_ORIGIN).origin);
    } catch {
      /* Ignore a malformed APP_ORIGIN. */
    }
  }
  return allowed.has(origin);
}

export async function POST(request: Request) {
  if (!originAllowed(request)) {
    return json({ success: false, error: 'Invalid request origin' }, 403);
  }
  if (!blobConfigured()) {
    return json(
      {
        success: false,
        error: 'Image uploads are not configured yet. Connect a Vercel Blob store and set BLOB_READ_WRITE_TOKEN.',
      },
      503
    );
  }

  let body: HandleUploadBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid upload request.' }, 400);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        validateUploadPath(pathname);
        return authorizeUpload(request);
      },
    });
    return json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return json({ success: false, error: error.message }, error.status);
    }
    console.error('Blob upload error:', error);
    return json({ success: false, error: 'Image upload failed. Please try again.' }, 500);
  }
}
