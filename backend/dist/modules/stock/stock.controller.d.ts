import { StockService } from './stock.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { CreateMouvementDto } from './dto/create-mouvement.dto';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    findAllItems(user: CurrentUserType, search?: string, annexeId?: string, clientId?: string): Promise<({
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
        clientId: string | null;
        marchandise: string;
        quantite: number;
        date: string;
        unite: string;
        seuil: number;
        depositaire: string | null;
        commercial: string | null;
        sommePayee: number;
        resteAPayer: number;
    })[]>;
    findOneItem(id: string, user: CurrentUserType): Promise<{
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
        mouvements: {
            id: string;
            createdAt: Date;
            annexeId: string;
            type: string;
            marchandise: string | null;
            quantite: number;
            date: string;
            motif: string | null;
            stockId: string | null;
            unite: string | null;
            responsable: string | null;
            bonRef: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        annexeId: string;
        clientId: string | null;
        marchandise: string;
        quantite: number;
        date: string;
        unite: string;
        seuil: number;
        depositaire: string | null;
        commercial: string | null;
        sommePayee: number;
        resteAPayer: number;
    }>;
    createItem(user: CurrentUserType, body: CreateStockItemDto): Promise<{
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
        clientId: string | null;
        marchandise: string;
        quantite: number;
        date: string;
        unite: string;
        seuil: number;
        depositaire: string | null;
        commercial: string | null;
        sommePayee: number;
        resteAPayer: number;
    }>;
    updateItem(id: string, user: CurrentUserType, body: UpdateStockItemDto): Promise<{
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
        clientId: string | null;
        marchandise: string;
        quantite: number;
        date: string;
        unite: string;
        seuil: number;
        depositaire: string | null;
        commercial: string | null;
        sommePayee: number;
        resteAPayer: number;
    }>;
    deleteItem(id: string, user: CurrentUserType): Promise<any>;
    findAllMouvements(user: CurrentUserType, annexeId?: string, stockId?: string): Promise<({
        annexe: {
            id: string;
            nom: string;
            code: string;
        };
        stock: {
            id: string;
            marchandise: string;
        };
    } & {
        id: string;
        createdAt: Date;
        annexeId: string;
        type: string;
        marchandise: string | null;
        quantite: number;
        date: string;
        motif: string | null;
        stockId: string | null;
        unite: string | null;
        responsable: string | null;
        bonRef: string | null;
    })[]>;
    createMouvement(user: CurrentUserType, body: CreateMouvementDto): Promise<any>;
}
