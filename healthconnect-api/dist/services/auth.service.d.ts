import { Role } from '@prisma/client';
export interface RegisterInput {
    email: string;
    password: string;
    role: Role;
    firstName: string;
    lastName: string;
    phone?: string;
}
export declare const register: (input: RegisterInput) => Promise<{
    token: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        registrationId: string;
        firstName: any;
        lastName: any;
        subscriptionTier: string;
    };
}>;
export declare const login: ({ email, password }: {
    email: string;
    password: string;
}) => Promise<{
    token: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        registrationId: string;
        firstName: any;
        lastName: any;
        subscriptionTier: string;
    };
}>;
export declare const logout: (userId: string) => Promise<void>;
export declare const refreshToken: (token: string) => Promise<{
    token: string;
}>;
export declare const forgotPassword: (email: string) => Promise<void>;
export declare const resetPassword: (token: string, newPassword: string) => Promise<void>;
export declare const getCurrentUser: (userId: string) => Promise<{
    id: string;
    email: string;
    role: import(".prisma/client").$Enums.Role;
    registrationId: string;
    firstName: any;
    lastName: any;
    subscriptionTier: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map