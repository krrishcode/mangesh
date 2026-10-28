import { env } from '../env';
import { AppError } from '../lib/errors';
import { authenticate } from './auth';
import {
  createContext,
  jsonWithoutContext,
  type ApiContext,
  type HttpMethod,
  type RouteDefinition,
} from './context';
import { checkRateLimit, clientIp } from './rate-limit';
import { routes } from './routes';

const BODY_LIMIT = 1024 * 1024;

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function matchPath(pattern: string, segments: string[]): Record<string, string> | null {
  const patternSegments = splitPath(pattern);
  if (patternSegments.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < patternSegments.length; index++) {
    const expected = patternSegments[index];
    const actual = segments[index];
    if (expected.startsWith(':')) {
      if (!actual) return null;
      try {
        params[expected.slice(1)] = decodeURIComponent(actual);
      } catch {
        return null;
      }
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

function originAllowed(request: Request, origin: string): boolean {
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    /* A malformed request URL is rejected below. */
  }
  try {
    allowed.add(new URL(env.appOrigin).origin);
  } catch {
    /* Ignore a malformed APP_ORIGIN; request origin still applies. */
  }
  return allowed.has(origin);
}

function assertRequestOrigin(request: Request, route: RouteDefinition): void {
  const crossSite = request.headers.get('sec-fetch-site') === 'cross-site';
  if (request.method === 'GET' || request.method === 'HEAD') {
    if (route.browserSession && crossSite) throw new AppError(403, 'Invalid request origin');
    return;
  }

  if (crossSite) throw new AppError(403, 'Invalid request origin');
  const origin = request.headers.get('origin');
  if (origin && !originAllowed(request, origin)) throw new AppError(403, 'Invalid request origin');

  if (route.browserSession) {
    const contentType = request.headers.get('content-type')?.toLowerCase() || '';
    if (!contentType.startsWith('application/json')) {
      throw new AppError(400, 'Use a JSON request.');
    }
  }
}

async function readBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'HEAD') return null;
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > BODY_LIMIT) throw new AppError(413, 'Request is too large');

  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > BODY_LIMIT) throw new AppError(413, 'Request is too large');
  if (!buffer.byteLength) return null;

  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    return null;
  }
}

export async function handleApi(request: Request, segments: string[]): Promise<Response> {
  const candidates = routes
    .map((route) => ({ route, params: matchPath(route.path, segments) }))
    .filter((entry): entry is { route: RouteDefinition; params: Record<string, string> } => entry.params !== null);

  if (!candidates.length) return jsonWithoutContext({ error: 'Not found' }, 404);

  const method = request.method.toUpperCase() as HttpMethod;
  const match = candidates.find((entry) => entry.route.method === method);
  if (!match) return jsonWithoutContext({ error: 'Method not allowed' }, 405);

  let context: ApiContext | null = null;
  try {
    assertRequestOrigin(request, match.route);
    const body = await readBody(request);

    if (match.route.rateLimit) {
      const retryAfter = await checkRateLimit(
        `${new URL(request.url).pathname}:${clientIp(request)}`,
        match.route.rateLimit.limit,
        match.route.rateLimit.windowMs
      );
      if (retryAfter !== null) {
        throw new AppError(429, 'Too many attempts. Please try again later.', { 'Retry-After': String(retryAfter) });
      }
    }

    context = createContext(request, match.params, body);

    if (match.route.auth && match.route.auth !== 'public') {
      context.authUser = await authenticate(request);
      if (match.route.auth === 'admin' && context.authUser.role !== 'admin') {
        throw new AppError(403, 'Forbidden: admin access required');
      }
    }

    return await match.route.handler(context);
  } catch (error) {
    const headers = error instanceof AppError ? error.headers : undefined;
    if (!(error instanceof AppError)) console.error('Unhandled API error:', error);
    return jsonWithoutContext(
      {
        success: false,
        error: error instanceof AppError ? error.message : 'The service is temporarily unavailable. Please try again.',
      },
      error instanceof AppError ? error.status : 500,
      headers,
      context?.responseCookies || []
    );
  }
}
