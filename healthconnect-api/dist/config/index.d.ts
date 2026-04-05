export declare const config: {
    env: string;
    port: number;
    apiVersion: string;
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    redis: {
        url: string;
    };
    storage: {
        endpoint: string;
        port: number;
        accessKey: string;
        secretKey: string;
        bucket: string;
        useSSL: boolean;
    };
    email: {
        sendgridApiKey: string | undefined;
        fromEmail: string;
        fromName: string;
    };
    sms: {
        authKey: string | undefined;
        senderId: string;
        templateId: string | undefined;
    };
    razorpay: {
        keyId: string;
        keySecret: string;
    };
    frontendUrl: string;
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
//# sourceMappingURL=index.d.ts.map