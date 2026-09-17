import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class UsersService {
    private readonly prisma;
    private readonly auditLogsService;
    constructor(prisma: PrismaService, auditLogsService: AuditLogsService);
    private assertNotLastActiveAdmin;
    private assertPermissionCeiling;
    private assertAnnexeCeiling;
    private assertNotSelfDeactivation;
    private assertNotSelfDelete;
    private assertRoleEscalationAllowed;
    private assertCanTouchAdminTarget;
    findAll(actor: CurrentUserType): Promise<{
        role: string;
        id: string;
        email: string;
        nom: string;
        telephone: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
        avatarUrl: string;
        derniereConnexion: Date;
        createdAt: Date;
        userAnnexes: {
            annexe: {
                id: string;
                nom: string;
                code: string;
            };
        }[];
    }[]>;
    findOne(id: string, actor: CurrentUserType): Promise<{
        role: string;
        userAnnexes: ({
            annexe: {
                id: string;
                email: string | null;
                nom: string;
                telephone: string | null;
                actif: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                adresse: string | null;
                ville: string | null;
                pays: string;
                rccm: string | null;
                nif: string | null;
                estSiege: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            annexeId: string;
        })[];
        id: string;
        email: string;
        nom: string;
        telephone: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        actif: boolean;
        avatarUrl: string | null;
        derniereConnexion: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: CreateUserDto, actor: CurrentUserType): Promise<{
        role: string;
        id: string;
        email: string;
        nom: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
    }>;
    update(id: string, data: UpdateUserDto, actor: CurrentUserType): Promise<{
        role: string;
        id: string;
        email: string;
        nom: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
    }>;
    resetPassword(id: string, newPassword: string | undefined, actor: CurrentUserType): Promise<{
        success: boolean;
    }>;
    delete(id: string, actor: CurrentUserType): Promise<void>;
}
