import { DevisService } from './devis.service';
import { CreateDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class DevisController {
    private readonly devisService;
    constructor(devisService: DevisService);
    findAll(user: CurrentUserType, clientId?: string): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        client: {
            id: string;
            nom: string;
            code: string;
        };
        port: {
            id: string;
            nom: string;
            code: string;
        };
        lignes: {
            id: string;
            createdAt: Date;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
            devisId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        numero: string;
        clientId: string;
        statut: import("@prisma/client").$Enums.StatutDevis;
        dossierId: string | null;
        dateEmission: Date;
        montantHt: number;
        montantTva: number;
        montantTtc: number;
        devise: string;
        nature: string | null;
        portId: string | null;
        dateValidite: Date | null;
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
            type: import("@prisma/client").$Enums.TypeClient;
            notes: string | null;
        };
        port: {
            id: string;
            nom: string;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            ville: string | null;
            pays: string | null;
        };
        lignes: {
            id: string;
            createdAt: Date;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
            devisId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        numero: string;
        clientId: string;
        statut: import("@prisma/client").$Enums.StatutDevis;
        dossierId: string | null;
        dateEmission: Date;
        montantHt: number;
        montantTva: number;
        montantTtc: number;
        devise: string;
        nature: string | null;
        portId: string | null;
        dateValidite: Date | null;
    }>;
    create(user: CurrentUserType, body: CreateDevisDto): Promise<{
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
            type: import("@prisma/client").$Enums.TypeClient;
            notes: string | null;
        };
        port: {
            id: string;
            nom: string;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            ville: string | null;
            pays: string | null;
        };
        lignes: {
            id: string;
            createdAt: Date;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
            devisId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        numero: string;
        clientId: string;
        statut: import("@prisma/client").$Enums.StatutDevis;
        dossierId: string | null;
        dateEmission: Date;
        montantHt: number;
        montantTva: number;
        montantTtc: number;
        devise: string;
        nature: string | null;
        portId: string | null;
        dateValidite: Date | null;
    }>;
    update(id: string, user: CurrentUserType, body: UpdateDevisDto): Promise<any>;
    remove(id: string, user: CurrentUserType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string | null;
        notes: string | null;
        numero: string;
        clientId: string;
        statut: import("@prisma/client").$Enums.StatutDevis;
        dossierId: string | null;
        dateEmission: Date;
        montantHt: number;
        montantTva: number;
        montantTtc: number;
        devise: string;
        nature: string | null;
        portId: string | null;
        dateValidite: Date | null;
    }>;
}
