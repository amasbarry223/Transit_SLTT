"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnexeGuard = void 0;
const common_1 = require("@nestjs/common");
let AnnexeGuard = class AnnexeGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.ForbiddenException('Non authentifié');
        if (user.role === 'ADMIN' || user.role === 'Administrateur')
            return true;
        const targetAnnexeId = request.params['annexeId'] ??
            request.body['annexeId'] ??
            request.query['annexeId'];
        if (!targetAnnexeId)
            return true;
        if (!user.annexeIds.includes(targetAnnexeId)) {
            throw new common_1.ForbiddenException('Cette annexe est hors de votre périmètre');
        }
        return true;
    }
};
exports.AnnexeGuard = AnnexeGuard;
exports.AnnexeGuard = AnnexeGuard = __decorate([
    (0, common_1.Injectable)()
], AnnexeGuard);
//# sourceMappingURL=annexe.guard.js.map