import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
import type { CreateBonLivraisonDto } from './dto/create-bon-livraison.dto';
import type { UpdateBonLivraisonDto } from './dto/update-bon-livraison.dto';
export interface LigneLivraison {
    marchandise: string;
    quantite: number;
    unite: string;
}
export declare class BonsLivraisonService {
    private prisma;
    constructor(prisma: PrismaService);
    private buildAnnexeFilter;
    private assertAnnexeAccess;
    private normalizeLignes;
    private nextReference;
    private resolveTransporteur;
    findAll(user: CurrentUserType, params?: {
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
            telephone: string;
            adresse: string;
            ville: string;
        };
        bonSortie: {
            id: string;
            reference: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        creePar: string | null;
        lignes: Prisma.JsonValue;
        date: string;
        reference: string;
        clientNom: string;
        immatriculation: string | null;
        bonSortieId: string;
        transporteurId: string | null;
        transporteurNom: string | null;
        chauffeurNom: string | null;
        chauffeurTelephone: string | null;
        adresseLivraison: string | null;
        observations: string | null;
    })[]>;
    findOne(id: string, user: CurrentUserType): Promise<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        client: {
            id: string;
            nom: string;
            telephone: string;
            adresse: string;
            ville: string;
        };
        bonSortie: {
            id: string;
            reference: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        creePar: string | null;
        lignes: Prisma.JsonValue;
        date: string;
        reference: string;
        clientNom: string;
        immatriculation: string | null;
        bonSortieId: string;
        transporteurId: string | null;
        transporteurNom: string | null;
        chauffeurNom: string | null;
        chauffeurTelephone: string | null;
        adresseLivraison: string | null;
        observations: string | null;
    }>;
    create(user: CurrentUserType, data: CreateBonLivraisonDto): Promise<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        client: {
            id: string;
            nom: string;
            telephone: string;
            adresse: string;
            ville: string;
        };
        bonSortie: {
            id: string;
            reference: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        creePar: string | null;
        lignes: Prisma.JsonValue;
        date: string;
        reference: string;
        clientNom: string;
        immatriculation: string | null;
        bonSortieId: string;
        transporteurId: string | null;
        transporteurNom: string | null;
        chauffeurNom: string | null;
        chauffeurTelephone: string | null;
        adresseLivraison: string | null;
        observations: string | null;
    }>;
    update(id: string, user: CurrentUserType, data: UpdateBonLivraisonDto): Promise<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        client: {
            id: string;
            nom: string;
            telephone: string;
            adresse: string;
            ville: string;
        };
        bonSortie: {
            id: string;
            reference: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string;
        statut: string;
        creePar: string | null;
        lignes: Prisma.JsonValue;
        date: string;
        reference: string;
        clientNom: string;
        immatriculation: string | null;
        bonSortieId: string;
        transporteurId: string | null;
        transporteurNom: string | null;
        chauffeurNom: string | null;
        chauffeurTelephone: string | null;
        adresseLivraison: string | null;
        observations: string | null;
    }>;
    remove(id: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
}
