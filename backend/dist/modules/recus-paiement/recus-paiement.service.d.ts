import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class RecusPaiementService {
    private prisma;
    constructor(prisma: PrismaService);
    private buildAnnexeFilter;
    findAll(user: CurrentUserType, params?: {
        search?: string;
        annexeId?: string;
    }): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
    } & {
        id: string;
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        statut: string;
        montantPaye: number;
        creePar: string | null;
        motif: string;
        reference: string;
        prenom: string;
        somme: number;
        reste: number;
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
    } & {
        id: string;
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        statut: string;
        montantPaye: number;
        creePar: string | null;
        motif: string;
        reference: string;
        prenom: string;
        somme: number;
        reste: number;
    }>;
    private nextRecuReference;
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
    } & {
        id: string;
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        statut: string;
        montantPaye: number;
        creePar: string | null;
        motif: string;
        reference: string;
        prenom: string;
        somme: number;
        reste: number;
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
    } & {
        id: string;
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        statut: string;
        montantPaye: number;
        creePar: string | null;
        motif: string;
        reference: string;
        prenom: string;
        somme: number;
        reste: number;
    }>;
    delete(id: string, user: CurrentUserType): Promise<{
        id: string;
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        statut: string;
        montantPaye: number;
        creePar: string | null;
        motif: string;
        reference: string;
        prenom: string;
        somme: number;
        reste: number;
    }>;
}
