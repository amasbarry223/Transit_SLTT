import { ContratsService } from './contrats.service';
import { CreateContratDto } from './dto/create-contrat.dto';
import { UpdateContratDto } from './dto/update-contrat.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class ContratsController {
    private readonly contratsService;
    constructor(contratsService: ContratsService);
    findAll(user: CurrentUserType, search?: string, annexeId?: string, clientId?: string): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        client: {
            id: string;
            nom: string;
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
    create(user: CurrentUserType, body: CreateContratDto): Promise<{
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
    update(id: string, user: CurrentUserType, body: UpdateContratDto): Promise<{
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
    remove(id: string, user: CurrentUserType): Promise<{
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
}
