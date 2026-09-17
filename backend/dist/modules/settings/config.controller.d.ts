import { SettingsService } from './settings.service';
export declare class ConfigController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getPublicConfig(): Promise<{
        data: Record<string, any>;
    }>;
    getStatuses(type?: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            entityType: string;
            value: string;
            label: string;
            color: string | null;
            icon: string | null;
            orderIndex: number;
            isActive: boolean;
        }[];
    }>;
    getOptions(type?: string): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            entityType: string;
            value: string;
            label: string;
            color: string | null;
            icon: string | null;
            orderIndex: number;
            isActive: boolean;
        }[];
    }>;
    updateConfig(body: {
        key: string;
        value: string;
        description?: string;
        type?: string;
        isPublic?: boolean;
        groupName?: string;
    }): Promise<{
        success: boolean;
    }>;
}
