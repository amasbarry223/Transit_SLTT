import { RecusPaiementService } from './recus-paiement.service';
import { CreateRecuPaiementDto } from './dto/create-recu-paiement.dto';
import { UpdateRecuPaiementDto } from './dto/update-recu-paiement.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class RecusPaiementController {
    private readonly service;
    constructor(service: RecusPaiementService);
    findAll(user: CurrentUserType, search?: string, annexeId?: string): Promise<({
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
    create(user: CurrentUserType, body: CreateRecuPaiementDto): Promise<{
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
    update(id: string, user: CurrentUserType, body: UpdateRecuPaiementDto): Promise<{
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
    remove(id: string, user: CurrentUserType): Promise<{
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
