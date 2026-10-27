import type { PrismaClient } from '@prisma/client';
export interface SchemaScriptsResult {
    status: 'ok' | 'error' | 'none';
    applied: string[];
    skipped: string[];
    detail?: string;
}
export declare const schemaScripts: SchemaScriptsResult;
export declare function requiredColumns(sql: string): Array<{
    table: string;
    column: string;
}>;
export declare function splitSqlStatements(sql: string): string[];
export declare function applySchemaScripts(prisma: Pick<PrismaClient, '$executeRawUnsafe' | '$queryRawUnsafe'>): Promise<SchemaScriptsResult>;
