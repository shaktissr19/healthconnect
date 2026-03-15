import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.service';
import { ApiResponse }  from '../utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.register(req.body);
    return ApiResponse.created(res, result, 'Account created successfully');
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.login(req.body);
    return ApiResponse.success(res, result, 'Login successful');
  } catch (e) { next(e); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.logout(req.user!.userId);
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (e) { next(e); }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.refreshToken(req.body.refreshToken);
    return ApiResponse.success(res, result);
  } catch (e) { next(e); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.forgotPassword(req.body.email);
    return ApiResponse.success(res, null, 'Password reset email sent if account exists');
  } catch (e) { next(e); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.password);
    return ApiResponse.success(res, null, 'Password reset successfully');
  } catch (e) { next(e); }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getCurrentUser(req.user!.userId);
    return ApiResponse.success(res, user);
  } catch (e) { next(e); }
};
