"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSchema = exports.dateRangeSchema = exports.idParamSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid ID format'),
});
exports.dateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.searchSchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=common.validator.js.map