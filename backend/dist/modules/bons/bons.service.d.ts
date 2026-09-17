import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class BonsService {
    private prisma;
    constructor(prisma: PrismaService);
    private buildAnnexeFilter;
    private toPositiveMontant;
    private toPositiveQuantite;
    private toNonNegativeMontant;
    findAllBons(user: CurrentUserType, params?: {
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
        stock: {
            id: string;
            marchandise: string;
            quantite: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        marchandise: string;
        montant: number;
        quantite: number;
        date: string;
        motif: string;
        reference: string;
        clientNom: string | null;
        stockId: string | null;
        unite: string;
    })[]>;
    findOneBon(id: string, user: CurrentUserType): Promise<{
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
        stock: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            clientId: string | null;
            marchandise: string;
            quantite: number;
            date: string;
            unite: string;
            seuil: number;
            depositaire: string | null;
            commercial: string | null;
            sommePayee: number;
            resteAPayer: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        marchandise: string;
        montant: number;
        quantite: number;
        date: string;
        motif: string;
        reference: string;
        clientNom: string | null;
        stockId: string | null;
        unite: string;
    }>;
    createBon(user: CurrentUserType, data: any): Promise<{
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
        stock: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            clientId: string | null;
            marchandise: string;
            quantite: number;
            date: string;
            unite: string;
            seuil: number;
            depositaire: string | null;
            commercial: string | null;
            sommePayee: number;
            resteAPayer: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        marchandise: string;
        montant: number;
        quantite: number;
        date: string;
        motif: string;
        reference: string;
        clientNom: string | null;
        stockId: string | null;
        unite: string;
    }>;
    validateBon(id: string, user: CurrentUserType): Promise<any>;
    deleteBon(id: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
    findAllBonsCaisse(user: CurrentUserType, params?: {
        annexeId?: string;
    }): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        lignes: {
            id: string;
            createdAt: Date;
            montant: number;
            date: string;
            motif: string;
            bonSortieCaisseId: string;
            beneficiaire: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        creePar: string | null;
        montantTotal: number;
        date: string;
        reference: string;
    })[]>;
    findOneBonCaisse(id: string, user: CurrentUserType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        creePar: string | null;
        montantTotal: number;
        date: string;
        reference: string;
    }>;
    createBonCaisse(user: CurrentUserType, data: any): Promise<{
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
        lignes: {
            id: string;
            createdAt: Date;
            montant: number;
            date: string;
            motif: string;
            bonSortieCaisseId: string;
            beneficiaire: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        creePar: string | null;
        montantTotal: number;
        date: string;
        reference: string;
    }>;
    updateBonCaisse(id: string, user: CurrentUserType, data: any): Promise<any>;
    deleteBonCaisse(id: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
}
