export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (plainText: string, hash: string) => Promise<boolean>;
export declare const validatePasswordStrength: (password: string) => void;
export declare const generateRandomPassword: () => string;
//# sourceMappingURL=password.d.ts.map