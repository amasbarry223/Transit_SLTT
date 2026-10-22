import type { PrismaClient } from '@prisma/client';
export interface SchemaScriptsResult {
    status: 'ok' | 'error' | 'none';
    applied: string[];
    detail?: string;
}
export declare const schemaScripts: SchemaScriptsResult;
export declare function splitSqlStatements(sql: string): string[];
export declare function applySchemaScripts(prisma: Pick<PrismaClient, '$executeRawUnsafe'>): Promise<SchemaScriptsResult>;
