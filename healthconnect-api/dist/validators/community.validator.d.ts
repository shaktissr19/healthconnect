import { z } from 'zod';
export declare const communitySearchSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodEnum<["PUBLIC", "PRIVATE", "RESTRICTED"]>>;
    language: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    language?: string | undefined;
    category?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    visibility?: "RESTRICTED" | "PUBLIC" | "PRIVATE" | undefined;
    featured?: string | undefined;
}, {
    search?: string | undefined;
    language?: string | undefined;
    category?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
    visibility?: "RESTRICTED" | "PUBLIC" | "PRIVATE" | undefined;
    featured?: string | undefined;
}>;
export declare const createPostSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isAnonymous: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    body: string;
    title?: string | undefined;
    tags?: string[] | undefined;
    isAnonymous?: boolean | undefined;
}, {
    body: string;
    title?: string | undefined;
    tags?: string[] | undefined;
    isAnonymous?: boolean | undefined;
}>;
export declare const createCommentSchema: z.ZodObject<{
    body: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    isAnonymous: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    body: string;
    isAnonymous?: boolean | undefined;
    parentId?: string | undefined;
}, {
    body: string;
    isAnonymous?: boolean | undefined;
    parentId?: string | undefined;
}>;
export declare const reactionSchema: z.ZodObject<{
    reactionType: z.ZodEnum<["LIKE", "SUPPORT", "HELPFUL"]>;
}, "strip", z.ZodTypeAny, {
    reactionType: "LIKE" | "SUPPORT" | "HELPFUL";
}, {
    reactionType: "LIKE" | "SUPPORT" | "HELPFUL";
}>;
//# sourceMappingURL=community.validator.d.ts.map