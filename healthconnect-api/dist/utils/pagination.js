"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedResponse = exports.getPaginationParams = void 0;
const constants_1 = require("../config/constants");
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(constants_1.CONSTANTS.PAGINATION.MAX_LIMIT, Math.max(1, parseInt(query.limit || String(constants_1.CONSTANTS.PAGINATION.DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
exports.getPaginationParams = getPaginationParams;
const buildPaginatedResponse = (data, total, { page, limit }) => ({
    data,
    pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
    },
});
exports.buildPaginatedResponse = buildPaginatedResponse;
//# sourceMappingURL=pagination.js.map