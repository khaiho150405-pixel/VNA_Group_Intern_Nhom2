import { NextRequest } from 'next/server';
import { authMiddleware } from '@core/middleware/auth.middleware';

/**
 * Next.js Proxy entry point (formerly middleware).
 * Renamed to conform to Next.js 16+ convention.
 */
export function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static (public static assets)
     * - public (public folder)
     * - _next/data (Next.js data fetches)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|static|public|_next/data).*)',
  ],
};
