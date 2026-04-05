// src/middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIXED:
//   1. admin-middleware.ts merged here — /admin-dashboard is now protected
//      (previously Next.js only loaded middleware.ts; admin panel was open to anyone)
//   2. Token existence check kept — full JWT verification requires edge-compatible
//      'jose' package (add later for extra hardening)
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/doctor-dashboard',
  '/hospital-dashboard',
  '/admin-dashboard',   // ← FIX: was missing — admin panel had zero server-side protection
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('hc_token')?.value;

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
    '/admin-dashboard',           // ← FIX: added
    '/admin-dashboard/:path*',    // ← FIX: added
  ],
};
