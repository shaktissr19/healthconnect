import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/doctor-dashboard',
  '/hospital-dashboard',
  '/admin-dashboard',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
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
    '/admin-dashboard',
    '/admin-dashboard/:path*',
  ],
};
