import { resolveBirthPlace } from '@/lib/geocode';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    if (!body.query?.trim()) {
      return Response.json(
        { error: 'Enter a city to continue.' },
        { status: 400 },
      );
    }
    const place = await resolveBirthPlace(body.query);
    return Response.json({ place });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PLACE_NOT_FOUND') {
      return Response.json(
        {
          error: 'We could not find that city. Add the country and try again.',
        },
        { status: 422 },
      );
    }
    return Response.json(
      { error: 'City lookup is temporarily unavailable.' },
      { status: 503 },
    );
  }
}
