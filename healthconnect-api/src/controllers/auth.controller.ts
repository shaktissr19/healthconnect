import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from '../utils/authCookies';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.register(req.body);
    setAuthCookies(res, result.token, result.refreshToken);

    // Tokens remain in the response temporarily for backward compatibility.
    // The frontend migration will stop consuming them before they are removed.
    return ApiResponse.created(res, result, 'Account created successfully');
  } catch (e) {
    next(e);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.login(req.body);
    setAuthCookies(res, result.token, result.refreshToken);

    // Backward-compatible response during the staged frontend migration.
    return ApiResponse.success(res, result, 'Login successful');
  } catch (e) {
    next(e);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.logout(req.user!.userId);
    clearAuthCookies(res);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (e) {
    next(e);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Prefer the HttpOnly refresh cookie. Keep request-body support only while
    // existing clients are being migrated.
    const refreshToken =
      getRefreshTokenFromRequest(req) ||
      (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null);

    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token required');
    }

    const result = await AuthService.refreshToken(refreshToken);
    setAuthCookies(res, result.token, result.refreshToken);

    return ApiResponse.success(res, { token: result.token });
  } catch (e) {
    clearAuthCookies(res);
    next(e);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.forgotPassword(req.body.email);
    return ApiResponse.success(res, null, 'Password reset email sent if account exists');
  } catch (e) {
    next(e);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.password);
    clearAuthCookies(res);
    return ApiResponse.success(res, null, 'Password reset successfully');
  } catch (e) {
    next(e);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getCurrentUser(req.user!.userId);
    return ApiResponse.success(res, user);
  } catch (e) {
    next(e);
  }
};
