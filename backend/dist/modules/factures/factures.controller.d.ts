import { FacturesService } from './factures.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class FacturesController {
    private readonly facturesService;
    constructor(facturesService: FacturesService);
    findAll(user: CurrentUserType, search?: string, statut?: string, clientId?: string, dossierId?: string, annexeId?: string, page?: number, limit?: number): Promise<import("../../common/pagination.utils").PaginatedResult<{
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
        dossier: {
            id: string;
            numero: string;
        };
        lignes: {
            id: string;
            createdAt: Date;
            factureId: string;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
        }[];
    } & {
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
    }>>;
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
        dossier: {
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
        };
        creePar: {
            id: string;
            email: string;
            nom: string;
        };
        lignes: {
            id: string;
            createdAt: Date;
            factureId: string;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
        }[];
        transactions: ({
            caisse: {
                id: string;
                nom: string;
                createdAt: Date;
                updatedAt: Date;
                annexeId: string;
                code: string;
                statut: import(".prisma/client").$Enums.StatutCaisse;
                devise: string;
                soldeActuel: number;
            };
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.TypeTransactionCaisse;
            montant: number;
            factureId: string | null;
            date: Date;
            caisseId: string;
            motif: string;
            depenseId: string | null;
            effectueParId: string | null;
        })[];
    } & {
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
    }>;
    create(user: CurrentUserType, body: CreateFactureDto): Promise<{
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
        lignes: {
            id: string;
            createdAt: Date;
            factureId: string;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
        }[];
    } & {
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
    }>;
    update(id: string, user: CurrentUserType, body: UpdateFactureDto): Promise<any>;
    updateStatut(id: string, user: CurrentUserType, statut: string): Promise<{
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
        lignes: {
            id: string;
            createdAt: Date;
            factureId: string;
            designation: string;
            quantite: number;
            prixUnitaire: number;
            montantTotal: number;
        }[];
    } & {
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
    }>;
    remove(id: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
    enregistrerPaiement(id: string, user: CurrentUserType, body: {
        montant: number;
        caisseId: string;
        motif?: string;
    }): Promise<any>;
}
