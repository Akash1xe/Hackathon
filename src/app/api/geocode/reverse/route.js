import { NextResponse } from 'next/server';
import { apiError, requestIp } from '@/lib/http';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request) {
  let rate;
  try {
    rate = await checkRateLimit(`geocode:${requestIp(request)}`, { limit: 30, windowMs: 60 * 60_000 });
  } catch (error) {
    console.error('Unable to check geocoding rate limit:', error);
    return apiError('Location lookup is temporarily unavailable.', 503);
  }
  if (!rate.allowed) return apiError('Location lookup limit reached.', 429);

  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get('lat'));
  const longitude = Number(searchParams.get('lng'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return apiError('Invalid coordinates.', 400);
  }

  if (!process.env.OPENCAGE_API_KEY) {
    return NextResponse.json({ address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
  }

  try {
    const endpoint = new URL('https://api.opencagedata.com/geocode/v1/json');
    endpoint.searchParams.set('q', `${latitude},${longitude}`);
    endpoint.searchParams.set('key', process.env.OPENCAGE_API_KEY);
    endpoint.searchParams.set('no_annotations', '1');
    endpoint.searchParams.set('language', 'en');
    const response = await fetch(endpoint, { next: { revalidate: 86400 } });
    const result = await response.json();
    return NextResponse.json({ address: result.results?.[0]?.formatted || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return NextResponse.json({ address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
  }
}
