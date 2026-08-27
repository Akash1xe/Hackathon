import { NextResponse } from 'next/server';

export function apiError(message, status = 400, details) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function parsePagination(searchParams, defaults = {}) {
  const defaultLimit = defaults.limit || 12;
  const maxLimit = defaults.maxLimit || 50;
  const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = Number.parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
  const limit = Number.isFinite(rawLimit) ? Math.min(maxLimit, Math.max(1, rawLimit)) : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

export function requestIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
