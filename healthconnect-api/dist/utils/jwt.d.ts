export interface JwtPayload {
    userId: string;
    role: string;
    registrationId: string;
    iat?: number;
    exp?: number;
}
export declare const generateToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JwtPayload;
export declare const verifyRefreshToken: (token: string) => JwtPayload;
export declare const decodeToken: (token: string) => JwtPayload | null;
export declare const extractBearerToken: (authHeader?: string) => string | null;
//# sourceMappingURL=jwt.d.ts.map