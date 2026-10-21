import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class ClientsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(user: CurrentUserType, search?: string): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        _count: {
            dossiers: number;
            factures: number;
        };
    } & {
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
    })[]>;
    findOne(id: string, user: CurrentUserType): Promise<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        _count: {
            devis: number;
            cotations: number;
            dossiers: number;
            factures: number;
        };
        dossiers: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            type: import(".prisma/client").$Enums.TypeDossier;
            notes: string | null;
            numero: string;
            clientId: string;
            creeParId: string | null;
            statut: import(".prisma/client").$Enums.StatutDossier;
            voieTransport: import(".prisma/client").$Enums.VoieTransport;
            marchandise: string | null;
            poids: number | null;
            volume: number | null;
            nombreColis: number | null;
            navireVol: string | null;
            compagnie: string | null;
            numeroBl: string | null;
            portProvenance: string | null;
            portDestination: string | null;
            dateDepart: Date | null;
            dateArriveePrevue: Date | null;
            dateArriveeEffective: Date | null;
            dateLivraison: Date | null;
            bureauDouane: string | null;
            numeroDeclaration: string | null;
            dateDeclaration: Date | null;
            valeurDouane: number | null;
            fraisCircuit: number;
            fraisPrestation: number;
            montantInvesti: number;
            montantPaye: number;
            dateSolde: Date | null;
        }[];
        factures: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            notes: string | null;
            numero: string;
            clientId: string;
            creeParId: string | null;
            statut: import(".prisma/client").$Enums.StatutFacture;
            montantPaye: number;
            dossierId: string | null;
            dateEmission: Date;
            dateEcheance: Date | null;
            montantHt: number;
            tauxTva: number;
            montantTva: number;
            montantTtc: number;
            devise: string;
        }[];
    } & {
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
    }>;
    create(user: CurrentUserType, data: CreateClientDto): Promise<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
    } & {
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
    }>;
    update(id: string, user: CurrentUserType, data: UpdateClientDto): Promise<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
    } & {
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
    }>;
    remove(id: string, user: CurrentUserType): Promise<{
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
    }>;
}
