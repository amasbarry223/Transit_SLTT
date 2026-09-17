import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(entite?: string, action?: string, limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            nom: string;
            role: import("@prisma/client").$Enums.RoleUtilisateur;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entite: string;
        entiteId: string | null;
        donnees: import("@prisma/client/runtime/library").JsonValue | null;
        adresseIp: string | null;
        userAgent: string | null;
    })[]>;
    create(user: CurrentUserType, body: CreateAuditLogDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entite: string;
        entiteId: string | null;
        donnees: import("@prisma/client/runtime/library").JsonValue | null;
        adresseIp: string | null;
        userAgent: string | null;
    }>;
}
