import tzlookup from 'tz-lookup';

export interface ResolvedPlace {
  label: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
}

const placeCache = new Map<string, ResolvedPlace>();

export async function resolveBirthPlace(query: string): Promise<ResolvedPlace> {
  const normalized = query.trim();
  const cacheKey = normalized.toLocaleLowerCase();
  const cached = placeCache.get(cacheKey);
  if (cached) return cached;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');
  url.searchParams.set('q', normalized);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Ming-BaZi-Prototype/0.1 (birth-place-resolution)',
    },
  });

  if (!response.ok) {
    throw new Error('PLACE_SERVICE_UNAVAILABLE');
  }

  const matches = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  const match = matches[0];
  if (!match) throw new Error('PLACE_NOT_FOUND');

  const latitude = Number(match.lat);
  const longitude = Number(match.lon);
  const resolved = {
    label: match.display_name,
    latitude,
    longitude,
    ianaTimeZone: tzlookup(latitude, longitude),
  };

  placeCache.set(cacheKey, resolved);
  return resolved;
}
