import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_PATHS, PUBLIC_PATHS, DEFAULT_REDIRECT } from '../constants/paths';

/**
 * Core Authentication Guard logic for Middleware.
 * Separated from the entry point for testability and clean architecture.
 */
export function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // 1. If no token and trying to access a protected page -> Redirect to Login
  if (!token && !isAuthPage) {
    const loginUrl = new URL(AUTH_PATHS.LOGIN, request.url);
    // Optionally preserve the attempted URL to redirect back after login
    // loginUrl.searchParams.set('from', pathname); 
    return NextResponse.redirect(loginUrl);
  }

  // 2. If token exists and trying to access an Auth page -> Redirect to Dashboard/Home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }

  return NextResponse.next();
}

