import tzlookup from 'tz-lookup';

export interface ResolvedPlace {
  label: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  provider: 'google' | 'openstreetmap';
}

const placeCache = new Map<string, ResolvedPlace>();

async function resolveWithGoogle(query: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('language', 'en');
  url.searchParams.set('key', apiKey);
  const response = await fetch(url);
  if (!response.ok) throw new Error('PLACE_SERVICE_UNAVAILABLE');
  const payload = (await response.json()) as {
    status?: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };
  if (payload.status !== 'OK' || !payload.results?.[0]) return null;
  const match = payload.results[0];
  return {
    label: match.formatted_address,
    latitude: match.geometry.location.lat,
    longitude: match.geometry.location.lng,
    provider: 'google' as const,
  };
}

export async function resolveBirthPlace(query: string): Promise<ResolvedPlace> {
  const normalized = query.trim();
  const cacheKey = normalized.toLocaleLowerCase();
  const cached = placeCache.get(cacheKey);
  if (cached) return cached;

  const googleMatch = await resolveWithGoogle(normalized);
  if (googleMatch) {
    const resolved = {
      ...googleMatch,
      ianaTimeZone: tzlookup(googleMatch.latitude, googleMatch.longitude),
    };
    placeCache.set(cacheKey, resolved);
    return resolved;
  }

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
    provider: 'openstreetmap' as const,
  };

  placeCache.set(cacheKey, resolved);
  return resolved;
}
