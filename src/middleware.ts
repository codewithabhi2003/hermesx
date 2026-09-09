import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Applies baseline security headers to every /api/* response.
 *
 * Authentication and authorization are deliberately NOT handled here —
 * each Route Handler calls `requireAuth()`/`requireRole()` itself (see
 * lib/auth/permissions.ts), which re-verifies against the database rather
 * than trusting a middleware-level check on a possibly-stale session
 * token. This middleware's job is limited to headers that apply uniformly
 * regardless of the route's auth requirements.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
