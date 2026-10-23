import type { AuthUser } from './auth';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuthMode = 'public' | 'required' | 'admin';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAge?: number;
}

export interface ApiContext {
  request: Request;
  url: URL;
  params: Record<string, string>;
  body: unknown;
  authUser?: AuthUser;
  responseCookies: string[];
  getCookie(name: string): string | undefined;
  setCookie(name: string, value: string, options?: CookieOptions): void;
  deleteCookie(name: string, options?: { path?: string }): void;
}

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  auth?: AuthMode;
  browserSession?: boolean;
  rateLimit?: { limit: number; windowMs?: number };
  handler: (c: ApiContext) => Promise<Response> | Response;
}

function parseCookieHeader(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const raw = part.slice(separator + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(raw);
    } catch {
      cookies[name] = raw;
    }
  }
  return cookies;
}

function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const segments = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || '/'}`];
  if (options.maxAge !== undefined) segments.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) segments.push('HttpOnly');
  if (options.secure) segments.push('Secure');
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  return segments.join('; ');
}

export function createContext(
  request: Request,
  params: Record<string, string>,
  body: unknown
): ApiContext {
  const requestCookies = parseCookieHeader(request.headers.get('cookie'));
  const responseCookies: string[] = [];
  return {
    request,
    url: new URL(request.url),
    params,
    body,
    responseCookies,
    getCookie: (name) => requestCookies[name],
    setCookie(name, value, options = {}) {
      responseCookies.push(serializeCookie(name, value, options));
    },
    deleteCookie(name, options = {}) {
      responseCookies.push(serializeCookie(name, '', { path: options.path, maxAge: 0 }));
    },
  };
}

export function baseHeaders(extra?: Record<string, string>): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (extra) for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return headers;
}

export function json(c: ApiContext, data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  const headers = baseHeaders(extraHeaders);
  for (const cookie of c.responseCookies) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

export function jsonWithoutContext(data: unknown, status = 200, extraHeaders?: Record<string, string>, cookies: string[] = []): Response {
  const headers = baseHeaders(extraHeaders);
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers });
}
