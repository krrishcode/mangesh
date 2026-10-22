import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';
const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const rules: Array<[RegExp, string[]]> = [
  [/^auth\/(login|register|forgot-password|reset-password|logout|google)$/, ['POST']], [/^auth\/(me|security|google\/config)$/, ['GET']],
  [/^users\/me$/, ['GET','PUT']], [/^users\/me\/change-password$/, ['POST']], [/^users\/me\/measurements$/, ['GET','PUT']],
  [/^users\/me\/addresses$/, ['GET','POST']], [/^users\/me\/addresses\/\d+$/, ['PUT','DELETE']],
  [/^orders(?:\/\d+)?$/, ['GET']], [/^orders\/\d+\/cancel$/, ['PATCH']],
  [/^appointments$/, ['GET','POST']], [/^appointments\/\d+$/, ['PUT']], [/^appointments\/\d+\/(cancel|reschedule)$/, ['PATCH']],
  [/^wishlist$/, ['GET','POST']], [/^wishlist\/\d+$/, ['DELETE']],
  [/^checkout(?:\/quote|\/session|\/guest)?$/, ['POST']], [/^checkout\/guest\/orders(?:\/\d+)?$/, ['GET']], [/^checkout\/guest\/orders\/\d+\/claim$/, ['POST']], [/^shipping(?:\/track\/[A-Za-z0-9_-]+)?$/, ['GET']],
  [/^payments\/order\/\d+$/, ['GET']], [/^admin(?:\/[A-Za-z0-9_-]+)*$/, ['GET','POST','PUT','PATCH','DELETE']],
  [/^media\/upload$/, ['POST']],
  [/^checkout\/guest\/orders\/\d+\/cancel$/, ['PATCH']],
];
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const endpoint = path.join('/');
  const allowed = rules.find(([pattern]) => pattern.test(endpoint));
  if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!allowed[1].includes(request.method)) return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  if (request.headers.get('sec-fetch-site') === 'cross-site' && endpoint === 'auth/google/config') return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!['GET','HEAD'].includes(request.method)) {
    if (request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  const limit = endpoint === 'media/upload' ? 32 * 1024 * 1024 : 1024 * 1024;
  if (Number(request.headers.get('content-length')) > limit) return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
  try {
    let body: ArrayBuffer | undefined;
    if (!['GET','HEAD'].includes(request.method)) {
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = []; let length = 0;
      if (reader) while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > limit) { await reader.cancel(); return NextResponse.json({ error: 'Request is too large' }, { status: 413 }); }
        chunks.push(chunk.value);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      body = bytes.buffer;
    }
    const clientIp = process.env.TRUST_PROXY === 'true' ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined;
    const response = await fetch(`${API_BASE}/${endpoint}${request.nextUrl.search}`, {
      method: request.method, headers: { 'Content-Type': request.headers.get('content-type') || 'application/json', Authorization: request.headers.get('authorization') || '', Origin: request.headers.get('origin') || '', ...(clientIp && isIP(clientIp) ? { 'X-Forwarded-For': clientIp } : {}), Cookie: request.cookies.getAll().filter(cookie => ['mm_guest', 'mm_google_nonce'].includes(cookie.name)).map(cookie => `${cookie.name}=${cookie.value}`).join('; ') },
      body, cache: 'no-store', signal: AbortSignal.timeout(endpoint === 'media/upload' ? 30000 : 20000),
    });
    const result = new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    for (const cookie of response.headers.getSetCookie()) result.headers.append('Set-Cookie', cookie);
    return result;
  } catch { return NextResponse.json({ error: 'The service is temporarily unavailable. Please try again.' }, { status: 503 }); }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
