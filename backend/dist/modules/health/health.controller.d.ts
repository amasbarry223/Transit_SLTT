export declare class HealthController {
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
