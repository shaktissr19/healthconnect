"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const apiResponse_1 = require("../utils/apiResponse");
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const data = req[source];
            const parsed = schema.parse(data);
            req[source] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return apiResponse_1.ApiResponse.validationError(res, errors);
            }
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map