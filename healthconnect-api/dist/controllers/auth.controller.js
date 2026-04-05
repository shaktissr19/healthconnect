"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const AuthService = __importStar(require("../services/auth.service"));
const apiResponse_1 = require("../utils/apiResponse");
const register = async (req, res, next) => {
    try {
        const result = await AuthService.register(req.body);
        return apiResponse_1.ApiResponse.created(res, result, 'Account created successfully');
    }
    catch (e) {
        next(e);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const result = await AuthService.login(req.body);
        return apiResponse_1.ApiResponse.success(res, result, 'Login successful');
    }
    catch (e) {
        next(e);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        await AuthService.logout(req.user.userId);
        return apiResponse_1.ApiResponse.success(res, null, 'Logged out successfully');
    }
    catch (e) {
        next(e);
    }
};
exports.logout = logout;
const refreshToken = async (req, res, next) => {
    try {
        const result = await AuthService.refreshToken(req.body.refreshToken);
        return apiResponse_1.ApiResponse.success(res, result);
    }
    catch (e) {
        next(e);
    }
};
exports.refreshToken = refreshToken;
const forgotPassword = async (req, res, next) => {
    try {
        await AuthService.forgotPassword(req.body.email);
        return apiResponse_1.ApiResponse.success(res, null, 'Password reset email sent if account exists');
    }
    catch (e) {
        next(e);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        await AuthService.resetPassword(req.body.token, req.body.password);
        return apiResponse_1.ApiResponse.success(res, null, 'Password reset successfully');
    }
    catch (e) {
        next(e);
    }
};
exports.resetPassword = resetPassword;
const getCurrentUser = async (req, res, next) => {
    try {
        const user = await AuthService.getCurrentUser(req.user.userId);
        return apiResponse_1.ApiResponse.success(res, user);
    }
    catch (e) {
        next(e);
    }
};
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.controller.js.map