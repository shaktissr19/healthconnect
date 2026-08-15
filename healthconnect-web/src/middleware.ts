// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/doctor-dashboard',
  '/hospital-dashboard',
  '/admin-dashboard',
];

const ACCESS_COOKIE_NAME = 'hc_access';
const SESSION_COOKIE_NAME = 'hc_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  // hc_access is the short-lived credential. hc_session is only a non-secret
  // hint that a refreshable session may still exist. Backend authorization is
  // always authoritative for protected data.
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const sessionHint = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if ((!accessToken || accessToken.trim() === '') && sessionHint !== '1') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/doctor-dashboard',
    '/doctor-dashboard/:path*',
    '/hospital-dashboard',
    '/hospital-dashboard/:path*',
    '/admin-dashboard',
    '/admin-dashboard/:path*',
  ],
};
