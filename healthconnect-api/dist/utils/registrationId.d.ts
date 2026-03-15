import { Role } from '@prisma/client';
export declare const generateRegistrationId: (role: Role) => Promise<string>;
export declare const validateRegistrationId: (id: string) => boolean;
export declare const parseRegistrationId: (id: string) => {
    prefix: string;
    role: string;
    sequence: number;
} | null;
//# sourceMappingURL=registrationId.d.ts.map