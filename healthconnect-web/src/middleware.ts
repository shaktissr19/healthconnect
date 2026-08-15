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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  // The cookie is HttpOnly: browser JavaScript cannot read it, but Next.js
  // middleware can read it server-side. Full role validation remains enforced
  // by the API; dashboard layouts also redirect mismatched roles.
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!token || token.trim() === '') {
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
