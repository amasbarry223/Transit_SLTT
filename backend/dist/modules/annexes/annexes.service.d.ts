import { PrismaService } from '../../prisma/prisma.service';
export declare class AnnexesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            dossiers: number;
            factures: number;
            caisses: number;
        };
    } & {
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }>;
    create(data: {
        code: string;
        nom: string;
        adresse?: string;
        ville?: string;
        pays?: string;
        telephone?: string;
        email?: string;
        rccm?: string;
        nif?: string;
        estSiege?: boolean;
    }): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }>;
}
