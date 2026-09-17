import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class ComptabiliteService {
    private prisma;
    constructor(prisma: PrismaService);
    private buildAnnexeFilter;
    findAllOperations(user: CurrentUserType, params?: {
        annexeId?: string;
        clientId?: string;
    }): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        type: string;
        clientId: string | null;
        creePar: string | null;
        dossierId: string | null;
        montant: number;
        nature: string;
        date: string;
        reference: string;
        clientNom: string | null;
        modePaiement: string;
        source: string;
        importRef: string | null;
    })[]>;
    private nextOperationReference;
    createOperation(user: CurrentUserType, data: any): Promise<{
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        type: string;
        clientId: string | null;
        creePar: string | null;
        dossierId: string | null;
        montant: number;
        nature: string;
        date: string;
        reference: string;
        clientNom: string | null;
        modePaiement: string;
        source: string;
        importRef: string | null;
    }>;
    deleteOperation(id: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
    findAllClotures(user: CurrentUserType, params?: {
        annexeId?: string;
    }): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        annexeId: string | null;
        periodeDebut: string;
        periodeFin: string;
        soldeTheorique: number;
        soldeConstate: number;
        ecart: number;
        note: string | null;
        cloturePar: string | null;
        clotureLe: string;
    })[]>;
    createCloture(user: CurrentUserType, data: any): Promise<{
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
    } & {
        id: string;
        createdAt: Date;
        annexeId: string | null;
        periodeDebut: string;
        periodeFin: string;
        soldeTheorique: number;
        soldeConstate: number;
        ecart: number;
        note: string | null;
        cloturePar: string | null;
        clotureLe: string;
    }>;
}
