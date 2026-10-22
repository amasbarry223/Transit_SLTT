export type PrismaClientSyncStatus = 'ok' | 'regenerated' | 'failed' | 'error';
export declare const prismaClientSync: {
    status: PrismaClientSyncStatus;
    detail?: string;
};
