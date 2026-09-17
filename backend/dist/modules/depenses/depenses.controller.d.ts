import { DepensesService } from './depenses.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class DepensesController {
    private readonly depensesService;
    constructor(depensesService: DepensesService);
    findAll(user: CurrentUserType, search?: string, statut?: string, categorie?: string, dossierId?: string, annexeId?: string, page?: number, limit?: number): Promise<import("../../common/pagination.utils").PaginatedResult<{
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        dossier: {
            id: string;
            numero: string;
        };
        fournisseur: {
            id: string;
            nom: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        numero: string;
        creeParId: string | null;
        statut: import("@prisma/client").$Enums.StatutDepense;
        dossierId: string | null;
        devise: string;
        description: string | null;
        montant: number;
        fournisseurId: string | null;
        approuveParId: string | null;
        categorie: import("@prisma/client").$Enums.CategorieDepense;
        justificatif: string | null;
        dateDepense: Date;
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
        dossier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            type: import("@prisma/client").$Enums.TypeDossier;
            notes: string | null;
            numero: string;
            clientId: string;
            creeParId: string | null;
            statut: import("@prisma/client").$Enums.StatutDossier;
            voieTransport: import("@prisma/client").$Enums.VoieTransport;
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
        fournisseur: {
            id: string;
            email: string | null;
            nom: string;
            telephone: string | null;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            adresse: string | null;
            rccm: string | null;
            nif: string | null;
            type: string | null;
            contact: string | null;
        };
        creePar: {
            id: string;
            email: string;
            nom: string;
        };
        transactions: ({
            caisse: {
                id: string;
                nom: string;
                createdAt: Date;
                updatedAt: Date;
                annexeId: string;
                code: string;
                statut: import("@prisma/client").$Enums.StatutCaisse;
                devise: string;
                soldeActuel: number;
            };
        } & {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.TypeTransactionCaisse;
            date: Date;
            montant: number;
            factureId: string | null;
            caisseId: string;
            motif: string;
            depenseId: string | null;
            effectueParId: string | null;
        })[];
        approuvePar: {
            id: string;
            email: string;
            nom: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        numero: string;
        creeParId: string | null;
        statut: import("@prisma/client").$Enums.StatutDepense;
        dossierId: string | null;
        devise: string;
        description: string | null;
        montant: number;
        fournisseurId: string | null;
        approuveParId: string | null;
        categorie: import("@prisma/client").$Enums.CategorieDepense;
        justificatif: string | null;
        dateDepense: Date;
    }>;
    create(user: CurrentUserType, body: CreateDepenseDto): Promise<{
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
        fournisseur: {
            id: string;
            email: string | null;
            nom: string;
            telephone: string | null;
            actif: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            adresse: string | null;
            rccm: string | null;
            nif: string | null;
            type: string | null;
            contact: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        numero: string;
        creeParId: string | null;
        statut: import("@prisma/client").$Enums.StatutDepense;
        dossierId: string | null;
        devise: string;
        description: string | null;
        montant: number;
        fournisseurId: string | null;
        approuveParId: string | null;
        categorie: import("@prisma/client").$Enums.CategorieDepense;
        justificatif: string | null;
        dateDepense: Date;
    }>;
    approuver(id: string, user: CurrentUserType): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        numero: string;
        creeParId: string | null;
        statut: import("@prisma/client").$Enums.StatutDepense;
        dossierId: string | null;
        devise: string;
        description: string | null;
        montant: number;
        fournisseurId: string | null;
        approuveParId: string | null;
        categorie: import("@prisma/client").$Enums.CategorieDepense;
        justificatif: string | null;
        dateDepense: Date;
    }>;
    payerDepuisCaisse(id: string, user: CurrentUserType, body: {
        caisseId: string;
        motif?: string;
    }): Promise<any>;
    remove(id: string, user: CurrentUserType): Promise<{
        id: string;
    }>;
}
