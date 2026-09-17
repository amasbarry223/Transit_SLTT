import { PrismaService } from '../../prisma/prisma.service';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicSettings(): Promise<Record<string, any>>;
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
    setMany(settings: Record<string, string | {
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
    getStatusOptions(entityType?: string): Promise<{
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
    setStatusOption(data: {
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
}
