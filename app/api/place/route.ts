import { resolveBirthPlace } from '@/lib/geocode';
import {
  jsonWithRequestId,
  readJsonBody,
  requestId,
  rateLimitsEnabled,
  withinRateLimit,
} from '@/lib/request-guard';

export async function POST(request: Request) {
  const id = requestId();
  try {
    if (rateLimitsEnabled() && !withinRateLimit(request, 'place', 20, 60_000)) {
      return jsonWithRequestId(
        { error: 'Too many city lookups. Please wait a minute and try again.' },
        id,
        429,
        { 'Retry-After': '60' },
      );
    }
    const body = await readJsonBody<{ query?: string }>(request);
    const query = body.query?.trim() ?? '';
    if (!query) {
      return jsonWithRequestId({ error: 'Enter a city to continue.' }, id, 400);
    }
    if (query.length > 100) {
      return jsonWithRequestId(
        { error: 'Please keep the city name under 100 characters.' },
        id,
        400,
      );
    }
    const place = await resolveBirthPlace(query);
    return jsonWithRequestId({ place }, id);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'REQUEST_TOO_LARGE') {
      return jsonWithRequestId({ error: 'Request is too large.' }, id, 413);
    }
    if (message.includes('JSON')) {
      return jsonWithRequestId({ error: 'Invalid request body.' }, id, 400);
    }
    if (message === 'PLACE_NOT_FOUND') {
      return jsonWithRequestId(
        {
          error: 'We could not find that city. Add the country and try again.',
        },
        id,
        422,
      );
    }
    return jsonWithRequestId(
      { error: 'City lookup is temporarily unavailable.', requestId: id },
      id,
      503,
    );
  }
}
