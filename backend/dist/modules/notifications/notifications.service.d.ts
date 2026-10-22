import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
type NotificationWriter = Pick<PrismaService, 'notification'> | Prisma.TransactionClient;
export interface NotificationContent {
    titre: string;
    message: string;
    lien?: string;
}
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recipientsForAnnexe(annexeId: string, excludeUserId?: string): Promise<string[]>;
    notifyUsers(userIds: string[], content: NotificationContent, tx?: NotificationWriter): Promise<Prisma.BatchPayload>;
    listForUser(userId: string, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            titre: string;
            message: string;
            lue: boolean;
            lien: string | null;
        }[];
        unreadCount: number;
    }>;
    markRead(id: string, userId: string): Promise<{
        id: string;
        lue: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        count: number;
    }>;
}
export {};
