import { TransporteursService } from './transporteurs.service';
import { CreateTransporteurDto } from './dto/create-transporteur.dto';
import { UpdateTransporteurDto } from './dto/update-transporteur.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class TransporteursController {
    private readonly transporteursService;
    constructor(transporteursService: TransporteursService);
    findAll(user: CurrentUserType, search?: string, annexeId?: string): Promise<({
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
    create(user: CurrentUserType, body: CreateTransporteurDto): Promise<{
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
    update(id: string, user: CurrentUserType, body: UpdateTransporteurDto): Promise<{
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
    remove(id: string, user: CurrentUserType): Promise<{
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
