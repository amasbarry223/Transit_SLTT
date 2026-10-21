import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
type AuditLogWriter = Pick<PrismaService, 'auditLog'> | Prisma.TransactionClient;
export declare class AuditLogsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        entite?: string;
        action?: string;
        limit?: number;
    }): Promise<({
        user: {
            id: string;
            email: string;
            nom: string;
            role: import(".prisma/client").$Enums.RoleUtilisateur;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entite: string;
        entiteId: string | null;
        donnees: Prisma.JsonValue | null;
        adresseIp: string | null;
        userAgent: string | null;
    })[]>;
    log(data: {
        userId?: string;
        action: string;
        entite: string;
        entiteId?: string;
        donnees?: any;
        adresseIp?: string;
        userAgent?: string;
    }, tx?: AuditLogWriter): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entite: string;
        entiteId: string | null;
        donnees: Prisma.JsonValue | null;
        adresseIp: string | null;
        userAgent: string | null;
    }>;
}
export {};
