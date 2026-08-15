import { Request, Response, CookieOptions } from 'express';
import { config } from '../config';

const durationToMs = (value: string, fallbackMs: number): number => {
  const match = /^\s*(\d+)\s*([smhd])\s*$/i.exec(value);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multiplier[unit];
};

const isProduction = config.env === 'production';

const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  domain: config.auth.cookieDomain,
});

export const accessCookieOptions = (): CookieOptions => ({
  ...baseCookieOptions(),
  path: '/',
  maxAge: durationToMs(config.jwt.expiresIn, 15 * 60 * 1000),
});

export const refreshCookieOptions = (): CookieOptions => ({
  ...baseCookieOptions(),
  path: `/api/${config.apiVersion}/auth`,
  maxAge: durationToMs(config.jwt.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000),
});

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie(config.auth.accessCookieName, accessToken, accessCookieOptions());
  res.cookie(config.auth.refreshCookieName, refreshToken, refreshCookieOptions());
};

export const clearAuthCookies = (res: Response): void => {
  const access = accessCookieOptions();
  const refresh = refreshCookieOptions();

  res.clearCookie(config.auth.accessCookieName, {
    httpOnly: access.httpOnly,
    secure: access.secure,
    sameSite: access.sameSite,
    domain: access.domain,
    path: access.path,
  });

  res.clearCookie(config.auth.refreshCookieName, {
    httpOnly: refresh.httpOnly,
    secure: refresh.secure,
    sameSite: refresh.sameSite,
    domain: refresh.domain,
    path: refresh.path,
  });
};

export const getCookieValue = (req: Request, name: string): string | null => {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;

    const value = part.slice(index + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
};

export const getAccessTokenFromRequest = (req: Request): string | null => {
  const cookieToken = getCookieValue(req, config.auth.accessCookieName);
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim() || null;
  }

  return null;
};

export const getRefreshTokenFromRequest = (req: Request): string | null => {
  return getCookieValue(req, config.auth.refreshCookieName);
};
