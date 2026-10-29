import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class ContratsService {
    private prisma;
    constructor(prisma: PrismaService);
    private static readonly STATUT_TRANSITIONS;
    private buildAnnexeFilter;
    findAll(user: CurrentUserType, params?: {
        search?: string;
        annexeId?: string;
        clientId?: string;
    }): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        client: {
            id: string;
            nom: string;
        };
        prestations: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            statut: string;
            creePar: string | null;
            montant: number | null;
            description: string | null;
            datePrevue: string | null;
            contratId: string;
            libelle: string;
            dateRealisation: string | null;
            facturee: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        notes: string | null;
        clientId: string;
        statut: string;
        creePar: string | null;
        montant: number;
        reference: string;
        objet: string;
        dateDebut: Date;
        dateFin: Date | null;
    })[]>;
    findOne(id: string, user: CurrentUserType): Promise<{
        annexe: {
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
        };
        client: {
            id: string;
            email: string | null;
            nom: string;
            telephone: string | null;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string | null;
            code: string;
            adresse: string | null;
            ville: string | null;
            pays: string | null;
            rccm: string | null;
            nif: string | null;
            type: import(".prisma/client").$Enums.TypeClient;
            notes: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        notes: string | null;
        clientId: string;
        statut: string;
        creePar: string | null;
        montant: number;
        reference: string;
        objet: string;
        dateDebut: Date;
        dateFin: Date | null;
    }>;
    create(user: CurrentUserType, data: any): Promise<{
        annexe: {
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
        };
        client: {
            id: string;
            email: string | null;
            nom: string;
            telephone: string | null;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string | null;
            code: string;
            adresse: string | null;
            ville: string | null;
            pays: string | null;
            rccm: string | null;
            nif: string | null;
            type: import(".prisma/client").$Enums.TypeClient;
            notes: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        notes: string | null;
        clientId: string;
        statut: string;
        creePar: string | null;
        montant: number;
        reference: string;
        objet: string;
        dateDebut: Date;
        dateFin: Date | null;
    }>;
    update(id: string, user: CurrentUserType, data: any): Promise<{
        annexe: {
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
        };
        client: {
            id: string;
            email: string | null;
            nom: string;
            telephone: string | null;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string | null;
            code: string;
            adresse: string | null;
            ville: string | null;
            pays: string | null;
            rccm: string | null;
            nif: string | null;
            type: import(".prisma/client").$Enums.TypeClient;
            notes: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        notes: string | null;
        clientId: string;
        statut: string;
        creePar: string | null;
        montant: number;
        reference: string;
        objet: string;
        dateDebut: Date;
        dateFin: Date | null;
    }>;
    delete(id: string, user: CurrentUserType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        notes: string | null;
        clientId: string;
        statut: string;
        creePar: string | null;
        montant: number;
        reference: string;
        objet: string;
        dateDebut: Date;
        dateFin: Date | null;
    }>;
    addPrestation(contratId: string, user: CurrentUserType, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        statut: string;
        creePar: string | null;
        montant: number | null;
        description: string | null;
        datePrevue: string | null;
        contratId: string;
        libelle: string;
        dateRealisation: string | null;
        facturee: boolean;
    }>;
    private findPrestation;
    updatePrestation(contratId: string, prestationId: string, user: CurrentUserType, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        statut: string;
        creePar: string | null;
        montant: number | null;
        description: string | null;
        datePrevue: string | null;
        contratId: string;
        libelle: string;
        dateRealisation: string | null;
        facturee: boolean;
    }>;
    removePrestation(contratId: string, prestationId: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
}
