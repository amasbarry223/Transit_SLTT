"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
exports.canonicalPermission = canonicalPermission;
exports.userSatisfiesPermission = userSatisfiesPermission;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const decorators_1 = require("../../shared/decorators");
const VERB_TO_ACTION = {
    read: 'read',
    lire: 'read',
    consulter: 'read',
    voir: 'read',
    list: 'read',
    creer: 'write',
    modifier: 'write',
    supprimer: 'write',
    valider: 'write',
    encaisser: 'write',
    decaisser: 'write',
    gerer: 'write',
    upload: 'write',
    transition: 'write',
    write: 'write',
    'write-caisse': 'write-caisse',
};
const MODULE_ALIAS = {
    caisse: 'comptabilite',
    depenses: 'comptabilite',
    annexes: 'parametres',
    settings: 'parametres',
    cotations: 'devis',
    tracking: 'dossiers',
    archives: 'documents',
};
function canonicalPermission(perm) {
    const sep = perm.includes(':') ? ':' : '.';
    const [rawModule, rawVerb = 'read'] = perm.split(sep);
    const mod = MODULE_ALIAS[rawModule] ?? rawModule;
    const action = VERB_TO_ACTION[rawVerb] ?? (rawVerb.includes('write') ? 'write' : 'read');
    return `${mod}:${action}`;
}
function userSatisfiesPermission(userPerms, required) {
    const held = new Set(userPerms);
    if (held.has(required))
        return true;
    const heldCanon = new Set(userPerms.map(canonicalPermission));
    const need = canonicalPermission(required);
    if (heldCanon.has(need))
        return true;
    if (need.endsWith(':read')) {
        const mod = need.slice(0, -':read'.length);
        if (heldCanon.has(`${mod}:write`) || heldCanon.has(`${mod}:write-caisse`))
            return true;
    }
    if (held.has(need.split(':')[0]))
        return true;
    return false;
}
let PermissionsGuard = class PermissionsGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const required = this.reflector.getAllAndOverride(decorators_1.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user)
            throw new common_1.ForbiddenException('Non authentifié');
        if (user.role === 'ADMIN' || user.role === 'Administrateur' || user.permissions?.includes('*')) {
            return true;
        }
        const perms = user.permissions ?? [];
        const hasAll = required.every((perm) => userSatisfiesPermission(perms, perm));
        if (!hasAll) {
            throw new common_1.ForbiddenException(`Permission requise : ${required.join(', ')}`);
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map