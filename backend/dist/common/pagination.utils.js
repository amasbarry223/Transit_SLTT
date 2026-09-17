"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildPaginatedResponse = buildPaginatedResponse;
function parsePagination(query = {}, defaultLimit = 20) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function buildPaginatedResponse(data, total, params) {
    return {
        data,
        meta: {
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit) || 1,
        },
    };
}
//# sourceMappingURL=pagination.utils.js.map