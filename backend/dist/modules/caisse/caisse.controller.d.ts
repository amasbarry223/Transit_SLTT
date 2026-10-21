import { CaisseService } from './caisse.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class CaisseController {
    private readonly caisseService;
    constructor(caisseService: CaisseService);
    findAll(user: CurrentUserType, annexeId?: string): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        _count: {
            transactions: number;
        };
    } & {
        id: string;
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        code: string;
        statut: import(".prisma/client").$Enums.StatutCaisse;
        devise: string;
        soldeActuel: number;
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
        transactions: ({
            facture: {
                id: string;
                numero: string;
            };
            depense: {
                id: string;
                numero: string;
            };
            effectuePar: {
                id: string;
                nom: string;
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
        nom: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        code: string;
        statut: import(".prisma/client").$Enums.StatutCaisse;
        devise: string;
        soldeActuel: number;
    }>;
    createTransaction(id: string, user: CurrentUserType, body: {
        type: 'ENTREE' | 'SORTIE';
        montant: number;
        motif: string;
    }): Promise<{
        transaction: any;
        soldeActuel: any;
    }>;
}
