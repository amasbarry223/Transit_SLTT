import { PrismaService } from '../../prisma/prisma.service';
export declare class BackupService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listTables(): Promise<string[]>;
    exportData(): Promise<{
        meta: {
            exportedAt: string;
            tables: string[];
        };
        data: Record<string, unknown[]>;
    }>;
    wipeData(): Promise<Record<string, number>>;
    restoreData(payload: Record<string, unknown[]>): Promise<{
        restored: Record<string, number>;
        missingTables: string[];
    }>;
}
