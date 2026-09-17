import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class TransporteursService {
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
        email: string | null;
        nom: string;
        telephone: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        statut: string;
        contact: string | null;
        immatriculation: string;
        vehicule: string;
        trajet: string | null;
        capacite: number;
        dateCreation: string | null;
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
        email: string | null;
        nom: string;
        telephone: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        statut: string;
        contact: string | null;
        immatriculation: string;
        vehicule: string;
        trajet: string | null;
        capacite: number;
        dateCreation: string | null;
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
    } & {
        id: string;
        email: string | null;
        nom: string;
        telephone: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        statut: string;
        contact: string | null;
        immatriculation: string;
        vehicule: string;
        trajet: string | null;
        capacite: number;
        dateCreation: string | null;
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
        email: string | null;
        nom: string;
        telephone: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        statut: string;
        contact: string | null;
        immatriculation: string;
        vehicule: string;
        trajet: string | null;
        capacite: number;
        dateCreation: string | null;
    }>;
    delete(id: string, user: CurrentUserType): Promise<{
        id: string;
        email: string | null;
        nom: string;
        telephone: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        statut: string;
        contact: string | null;
        immatriculation: string;
        vehicule: string;
        trajet: string | null;
        capacite: number;
        dateCreation: string | null;
    }>;
}
