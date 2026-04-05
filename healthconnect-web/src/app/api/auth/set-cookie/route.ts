// src/app/api/auth/set-cookie/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js App Router API route — POST /api/auth/set-cookie
//
// PURPOSE:
//   Sets the hc_token as an HttpOnly cookie from the server side.
//   Client-side JS (document.cookie) cannot set HttpOnly cookies —
//   only server responses can. This route bridges that gap.
//
// SECURITY:
//   HttpOnly   → JS on the page cannot read the token (prevents XSS theft)
//   Secure     → Cookie only sent over HTTPS (set in production)
//   SameSite=Lax → Prevents CSRF while allowing normal navigation
//   Path=/     → Cookie sent with all requests to this domain
//   Max-Age    → 7 days (604800 seconds), matches previous behaviour
//
// FLOW:
//   AuthModal.tsx calls POST /api/auth/set-cookie with { token }
//   This route validates the input and sets the HttpOnly cookie
//   AuthModal then updates Zustand store (user profile, isAuthenticated)
//   Axios interceptor reads the HttpOnly cookie automatically — no change needed
//
// CLEAR COOKIE:
//   POST /api/auth/set-cookie with { token: null } clears the cookie
//   (used by clearAuth if you want server-side logout too)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME    = 'hc_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token: string | null };

    const isProd = process.env.NODE_ENV === 'production';

    if (!token) {
      // Clear the cookie (logout path)
      const res = NextResponse.json({ success: true, message: 'Cookie cleared' });
      res.cookies.set(COOKIE_NAME, '', {
        httpOnly:  true,
        secure:    isProd,
        sameSite:  'lax',
        path:      '/',
        maxAge:    0,  // Expire immediately
      });
      return res;
    }

    // Basic validation — token should be a non-empty string
    if (typeof token !== 'string' || token.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 400 }
      );
    }

    // Set HttpOnly cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly:  true,        // Cannot be read by JavaScript — prevents XSS
      secure:    isProd,      // HTTPS only in production
      sameSite:  'lax',       // Protects against CSRF, allows normal navigation
      path:      '/',         // Available on all routes
      maxAge:    COOKIE_MAX_AGE,
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}

// Disallow GET — this route is POST only
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}
