export declare class CreateAuditLogDto {
    action: string;
    entite?: string;
    module?: string;
    entiteId?: string;
    detail?: string;
    userName?: string;
    donnees?: Record<string, unknown>;
    ip?: string;
    adresseIp?: string;
    userAgent?: string;
}
