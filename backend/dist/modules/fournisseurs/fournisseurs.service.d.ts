import { PrismaService } from '../../prisma/prisma.service';
export interface CreateFournisseurInput {
    code?: string;
    nom: string;
    type?: string;
    contact?: string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
    rccm?: string | null;
    nif?: string | null;
    actif?: boolean;
}
export interface UpdateFournisseurInput {
    nom?: string;
    type?: string;
    contact?: string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
    rccm?: string | null;
    nif?: string | null;
    actif?: boolean;
}
export declare class FournisseursService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(search?: string): Promise<({
        _count: {
            depenses: number;
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
        rccm: string | null;
        nif: string | null;
        type: string | null;
        contact: string | null;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            depenses: number;
        };
        depenses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            numero: string;
            creeParId: string | null;
            statut: import("@prisma/client").$Enums.StatutDepense;
            dossierId: string | null;
            devise: string;
            description: string | null;
            montant: number;
            fournisseurId: string | null;
            approuveParId: string | null;
            categorie: import("@prisma/client").$Enums.CategorieDepense;
            justificatif: string | null;
            dateDepense: Date;
        }[];
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
        rccm: string | null;
        nif: string | null;
        type: string | null;
        contact: string | null;
    }>;
    create(data: CreateFournisseurInput): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        rccm: string | null;
        nif: string | null;
        type: string | null;
        contact: string | null;
    }>;
    update(id: string, data: UpdateFournisseurInput): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string | null;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        adresse: string | null;
        rccm: string | null;
        nif: string | null;
        type: string | null;
        contact: string | null;
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
        rccm: string | null;
        nif: string | null;
        type: string | null;
        contact: string | null;
    }>;
}
