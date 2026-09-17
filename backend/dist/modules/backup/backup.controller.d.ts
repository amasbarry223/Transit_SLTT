import { BackupService } from './backup.service';
export declare class BackupController {
    private readonly backupService;
    constructor(backupService: BackupService);
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
