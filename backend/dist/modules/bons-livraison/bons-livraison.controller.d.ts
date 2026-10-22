import { BonsLivraisonService } from './bons-livraison.service';
import { CreateBonLivraisonDto } from './dto/create-bon-livraison.dto';
import { UpdateBonLivraisonDto } from './dto/update-bon-livraison.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class BonsLivraisonController {
    private readonly service;
    constructor(service: BonsLivraisonService);
    findAll(user: CurrentUserType, annexeId?: string, clientId?: string): Promise<({
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
        lignes: import("@prisma/client/runtime/library").JsonValue;
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
        lignes: import("@prisma/client/runtime/library").JsonValue;
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
    create(user: CurrentUserType, body: CreateBonLivraisonDto): Promise<{
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
        lignes: import("@prisma/client/runtime/library").JsonValue;
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
    update(id: string, user: CurrentUserType, body: UpdateBonLivraisonDto): Promise<{
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
        lignes: import("@prisma/client/runtime/library").JsonValue;
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
