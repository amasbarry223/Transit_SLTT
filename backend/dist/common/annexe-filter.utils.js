"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAnnexeScopeFilter = buildAnnexeScopeFilter;
exports.assertAnnexeAccess = assertAnnexeAccess;
const common_1 = require("@nestjs/common");
function buildAnnexeScopeFilter(user, options) {
    if (user.role === 'ADMIN')
        return {};
    if (options?.allowUnassigned) {
        return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
    }
    return { annexeId: { in: user.annexeIds } };
}
function assertAnnexeAccess(user, annexeId, resourceName = 'cette annexe') {
    if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
        throw new common_1.ForbiddenException(`Accès non autorisé à ${resourceName}`);
    }
}
//# sourceMappingURL=annexe-filter.utils.js.map