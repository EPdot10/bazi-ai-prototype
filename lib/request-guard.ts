const rateBuckets = new Map<string, { startedAt: number; count: number }>();

export function requestId() {
  return crypto.randomUUID();
}

export function clientIp(request: Request) {
  return request.headers.get('CF-Connecting-IP') ?? 'local-development';
}

export function withinRateLimit(
  request: Request,
  key: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const bucketKey = `${key}:${clientIp(request)}`;
  const current = rateBuckets.get(bucketKey);
  if (!current || now - current.startedAt >= windowMs) {
    rateBuckets.set(bucketKey, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export async function readJsonBody<T>(request: Request, maxBytes = 16_384) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > maxBytes) throw new Error('REQUEST_TOO_LARGE');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new Error('REQUEST_TOO_LARGE');
  }
  return JSON.parse(raw) as T;
}

export function jsonWithRequestId(
  body: unknown,
  id: string,
  status = 200,
  headers?: HeadersInit,
) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('X-Request-Id', id);
  responseHeaders.set('Cache-Control', 'no-store');
  return Response.json(body, { status, headers: responseHeaders });
}
