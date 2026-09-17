import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getPublic(): Promise<Record<string, any>>;
    getStatuses(type?: string): Promise<{
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
    }[]>;
    getOptions(type?: string): Promise<{
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
    }[]>;
    setStatusOption(body: {
        entityType: string;
        value: string;
        label: string;
        color?: string;
        icon?: string;
        orderIndex?: number;
        isActive?: boolean;
    }): Promise<{
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
    }>;
    getAll(): Promise<{
        list: {
            id: string;
            updatedAt: Date;
            isPublic: boolean;
            type: string;
            description: string | null;
            cle: string;
            valeur: string;
            groupName: string;
        }[];
        map: Record<string, string>;
        parsedMap: Record<string, any>;
        groups: Record<string, any[]>;
    }>;
    getByKey(cle: string): Promise<{
        parsedValue: any;
        id: string;
        updatedAt: Date;
        isPublic: boolean;
        type: string;
        description: string | null;
        cle: string;
        valeur: string;
        groupName: string;
    }>;
    setMany(body: Record<string, string | {
        valeur: string;
        description?: string;
        type?: string;
        isPublic?: boolean;
        groupName?: string;
    }>): Promise<{
        id: string;
        updatedAt: Date;
        isPublic: boolean;
        type: string;
        description: string | null;
        cle: string;
        valeur: string;
        groupName: string;
    }[]>;
    setKey(cle: string, valeur: string, description?: string, type?: string, isPublic?: boolean, groupName?: string): Promise<{
        id: string;
        updatedAt: Date;
        isPublic: boolean;
        type: string;
        description: string | null;
        cle: string;
        valeur: string;
        groupName: string;
    }>;
}
