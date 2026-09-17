"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const password_utils_1 = require("../../common/password.utils");
function mapToPrismaRole(role) {
    switch (role) {
        case 'Administrateur':
        case 'ADMIN':
        case 'Direction':
        case 'DIRECTEUR':
            return client_1.RoleUtilisateur.ADMIN;
        case 'Comptable':
        case 'COMPTABLE':
            return client_1.RoleUtilisateur.COMPTABLE;
        case 'Agent de transit':
        case 'TRANSITAIRE':
        default:
            return client_1.RoleUtilisateur.TRANSITAIRE;
    }
}
function mapToAppRole(role) {
    switch (role) {
        case client_1.RoleUtilisateur.ADMIN:
        case 'ADMIN':
        case 'Direction':
        case 'DIRECTEUR':
            return 'Administrateur';
        case client_1.RoleUtilisateur.COMPTABLE:
        case 'COMPTABLE':
            return 'Comptable';
        case client_1.RoleUtilisateur.TRANSITAIRE:
        case 'TRANSITAIRE':
        default:
            return 'Agent de transit';
    }
}
function isActorAdmin(actor) {
    return String(actor.role || '').toUpperCase() === 'ADMIN';
}
let UsersService = class UsersService {
    prisma;
    auditLogsService;
    constructor(prisma, auditLogsService) {
        this.prisma = prisma;
        this.auditLogsService = auditLogsService;
    }
    async assertNotLastActiveAdmin(id, wouldLoseAdminAccess) {
        if (!wouldLoseAdminAccess)
            return;
        const target = await this.prisma.profile.findUnique({ where: { id } });
        if (!target || target.role !== client_1.RoleUtilisateur.ADMIN || !target.actif)
            return;
        const otherActiveAdmins = await this.prisma.profile.count({
            where: { role: client_1.RoleUtilisateur.ADMIN, actif: true, id: { not: id } },
        });
        if (otherActiveAdmins === 0) {
            throw new common_1.BadRequestException("Impossible : c'est le dernier administrateur actif du système.");
        }
    }
    assertPermissionCeiling(actor, requestedPermissions) {
        if (isActorAdmin(actor))
            return;
        const allowed = new Set(actor.permissions ?? []);
        if (allowed.has('*'))
            return;
        const overflow = requestedPermissions.filter((p) => !allowed.has(p));
        if (overflow.length > 0) {
            throw new common_1.ForbiddenException(`Permissions hors périmètre délégué : ${overflow.join(', ')}.`);
        }
    }
    assertAnnexeCeiling(actor, requestedAnnexeIds) {
        if (isActorAdmin(actor))
            return;
        const allowed = new Set(actor.annexeIds ?? []);
        const overflow = requestedAnnexeIds.filter((id) => !allowed.has(id));
        if (overflow.length > 0) {
            throw new common_1.ForbiddenException('Annexes hors périmètre délégué : vous ne pouvez assigner que des annexes auxquelles vous avez vous-même accès.');
        }
    }
    assertNotSelfDeactivation(actorId, targetId, actif) {
        if (targetId === actorId && actif === false) {
            throw new common_1.BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
        }
    }
    assertNotSelfDelete(actorId, targetId) {
        if (targetId === actorId) {
            throw new common_1.BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
        }
    }
    assertRoleEscalationAllowed(actor, requestedRole) {
        if (!requestedRole)
            return;
        if (mapToPrismaRole(requestedRole) === client_1.RoleUtilisateur.ADMIN && !isActorAdmin(actor)) {
            throw new common_1.ForbiddenException('Seul un administrateur peut créer ou promouvoir un compte en Administrateur.');
        }
    }
    assertCanTouchAdminTarget(actor, target) {
        if (!isActorAdmin(actor) && target.role === 'Administrateur') {
            throw new common_1.ForbiddenException('Seul un administrateur peut modifier un compte Administrateur.');
        }
    }
    async findAll(actor) {
        const profiles = await this.prisma.profile.findMany({
            where: isActorAdmin(actor)
                ? undefined
                : { userAnnexes: { some: { annexeId: { in: actor.annexeIds ?? [] } } } },
            select: {
                id: true,
                email: true,
                nom: true,
                telephone: true,
                role: true,
                permissions: true,
                actif: true,
                avatarUrl: true,
                derniereConnexion: true,
                createdAt: true,
                userAnnexes: {
                    select: {
                        annexe: { select: { id: true, nom: true, code: true } },
                    },
                },
            },
            orderBy: { nom: 'asc' },
        });
        return profiles.map((p) => ({
            ...p,
            role: mapToAppRole(p.role),
        }));
    }
    async findOne(id, actor) {
        const user = await this.prisma.profile.findUnique({
            where: { id },
            include: {
                userAnnexes: {
                    include: { annexe: true },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException(`Utilisateur ${id} non trouvé`);
        if (!isActorAdmin(actor)) {
            const targetAnnexeIds = user.userAnnexes.map((ua) => ua.annexeId);
            const allowed = new Set(actor.annexeIds ?? []);
            if (!targetAnnexeIds.some((aid) => allowed.has(aid))) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
        }
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return {
            ...safeUser,
            role: mapToAppRole(safeUser.role),
        };
    }
    async create(data, actor) {
        const email = data.email.toLowerCase().trim();
        const existing = await this.prisma.profile.findUnique({
            where: { email },
        });
        if (existing)
            throw new common_1.ConflictException(`L'email ${data.email} est déjà utilisé`);
        const rawPassword = data.password ?? data.motDePasse;
        (0, password_utils_1.assertStrongPassword)(rawPassword);
        this.assertRoleEscalationAllowed(actor, data.role);
        this.assertPermissionCeiling(actor, data.permissions ?? []);
        this.assertAnnexeCeiling(actor, data.annexeIds ?? []);
        const passwordHash = await bcrypt.hash(rawPassword, 12);
        const prismaRole = mapToPrismaRole(data.role || 'Magasinier');
        const created = await this.prisma.$transaction(async (tx) => {
            const profile = await tx.profile.create({
                data: {
                    email,
                    passwordHash,
                    nom: data.nom,
                    telephone: data.telephone,
                    role: prismaRole,
                    permissions: data.permissions || [],
                    userAnnexes: data.annexeIds?.length
                        ? {
                            create: data.annexeIds.map((annexeId) => ({ annexeId })),
                        }
                        : undefined,
                },
                select: {
                    id: true,
                    email: true,
                    nom: true,
                    role: true,
                    permissions: true,
                    actif: true,
                },
            });
            await this.auditLogsService.log({
                userId: actor.id,
                action: 'Création',
                entite: 'Utilisateurs',
                entiteId: profile.id,
                donnees: { detail: `Utilisateur ${profile.nom} créé`, userName: actor.nom },
            }, tx);
            return profile;
        });
        return {
            ...created,
            role: mapToAppRole(created.role),
        };
    }
    async update(id, data, actor) {
        const target = await this.findOne(id, actor);
        this.assertNotSelfDeactivation(actor.id, id, data.actif);
        this.assertRoleEscalationAllowed(actor, data.role);
        this.assertCanTouchAdminTarget(actor, target);
        if (data.permissions)
            this.assertPermissionCeiling(actor, data.permissions);
        if (data.annexeIds)
            this.assertAnnexeCeiling(actor, data.annexeIds);
        const wouldLoseAdminAccess = data.actif === false || (!!data.role && mapToPrismaRole(data.role) !== client_1.RoleUtilisateur.ADMIN);
        await this.assertNotLastActiveAdmin(id, wouldLoseAdminAccess);
        const updateData = {};
        if (data.nom)
            updateData.nom = data.nom;
        if (data.telephone !== undefined)
            updateData.telephone = data.telephone;
        if (data.role)
            updateData.role = mapToPrismaRole(data.role);
        if (data.permissions)
            updateData.permissions = data.permissions;
        if (data.actif !== undefined)
            updateData.actif = data.actif;
        const rawPassword = data.password ?? data.motDePasse;
        if (rawPassword !== undefined) {
            (0, password_utils_1.assertStrongPassword)(rawPassword);
            updateData.passwordHash = await bcrypt.hash(rawPassword, 12);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            if (data.annexeIds) {
                await tx.userAnnexe.deleteMany({ where: { userId: id } });
                await tx.userAnnexe.createMany({
                    data: data.annexeIds.map((annexeId) => ({ userId: id, annexeId })),
                });
            }
            const profile = await tx.profile.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    nom: true,
                    role: true,
                    permissions: true,
                    actif: true,
                },
            });
            if (rawPassword !== undefined) {
                await tx.refreshToken.deleteMany({ where: { userId: id } });
            }
            await this.auditLogsService.log({
                userId: actor.id,
                action: 'Modification',
                entite: 'Utilisateurs',
                entiteId: profile.id,
                donnees: { detail: `Utilisateur ${profile.nom} mis à jour`, userName: actor.nom },
            }, tx);
            return profile;
        });
        return {
            ...updated,
            role: mapToAppRole(updated.role),
        };
    }
    async resetPassword(id, newPassword, actor) {
        const target = await this.findOne(id, actor);
        this.assertCanTouchAdminTarget(actor, target);
        (0, password_utils_1.assertStrongPassword)(newPassword);
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.$transaction(async (tx) => {
            await tx.profile.update({ where: { id }, data: { passwordHash } });
            await tx.refreshToken.deleteMany({ where: { userId: id } });
            await this.auditLogsService.log({
                userId: actor.id,
                action: 'Modification',
                entite: 'Utilisateurs',
                entiteId: id,
                donnees: { detail: `Mot de passe réinitialisé pour ${target.nom}`, userName: actor.nom },
            }, tx);
        });
        return { success: true };
    }
    async delete(id, actor) {
        const target = await this.findOne(id, actor);
        this.assertNotSelfDelete(actor.id, id);
        this.assertCanTouchAdminTarget(actor, target);
        await this.assertNotLastActiveAdmin(id, true);
        await this.prisma.$transaction(async (tx) => {
            await tx.profile.delete({ where: { id } });
            await this.auditLogsService.log({
                userId: actor.id,
                action: 'Suppression',
                entite: 'Utilisateurs',
                entiteId: id,
                donnees: { detail: `Utilisateur ${target.nom} supprimé`, userName: actor.nom },
            }, tx);
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_logs_service_1.AuditLogsService])
], UsersService);
//# sourceMappingURL=users.service.js.map