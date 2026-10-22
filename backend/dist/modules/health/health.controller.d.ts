import { PrismaService } from '../../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    db(): Promise<{
        durationMs: number;
        schemaScripts: import("../../prisma/apply-schema-scripts").SchemaScriptsResult;
        checks: {
            [k: string]: string;
        };
    }>;
    check(): {
        status: string;
        service: string;
        uptime: number;
        timestamp: string;
        nodeEnv: string;
        prismaModels: number;
        prismaClientSync: {
            status: import("../../bootstrap/ensure-prisma-client").PrismaClientSyncStatus;
            detail?: string;
        };
    };
    root(): {
        status: string;
        service: string;
        version: string;
    };
}
