import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["PATIENT", "DOCTOR", "HOSPITAL"]>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "PATIENT" | "DOCTOR" | "HOSPITAL";
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}, {
    role: "PATIENT" | "DOCTOR" | "HOSPITAL";
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
//# sourceMappingURL=auth.validator.d.ts.map