import { ComptabiliteService } from './comptabilite.service';
import { CreateOperationDto } from './dto/create-operation.dto';
import { CreateClotureDto } from './dto/create-cloture.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class ComptabiliteController {
    private readonly service;
    constructor(service: ComptabiliteService);
    findAllOperations(user: CurrentUserType, annexeId?: string, clientId?: string): Promise<({
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
    createOperation(user: CurrentUserType, body: CreateOperationDto): Promise<{
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
    findAllClotures(user: CurrentUserType, annexeId?: string): Promise<({
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
    createCloture(user: CurrentUserType, body: CreateClotureDto): Promise<{
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
