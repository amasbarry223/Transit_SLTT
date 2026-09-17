import { PrismaService } from '../../prisma/prisma.service';
export declare class PortsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
    create(data: {
        code: string;
        nom: string;
        ville?: string;
        pays?: string;
    }): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
}
