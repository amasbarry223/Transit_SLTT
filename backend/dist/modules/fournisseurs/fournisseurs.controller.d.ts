import { FournisseursService } from './fournisseurs.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
export declare class FournisseursController {
    private readonly fournisseursService;
    constructor(fournisseursService: FournisseursService);
    findAll(search?: string): Promise<({
        _count: {
            depenses: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            depenses: number;
        };
        depenses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            annexeId: string;
            numero: string;
            creeParId: string | null;
            statut: import(".prisma/client").$Enums.StatutDepense;
            dossierId: string | null;
            devise: string;
            description: string | null;
            fournisseurId: string | null;
            approuveParId: string | null;
            categorie: import(".prisma/client").$Enums.CategorieDepense;
            montant: number;
            justificatif: string | null;
            dateDepense: Date;
        }[];
    } & {
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
    }>;
    create(body: CreateFournisseurDto): Promise<{
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
    }>;
    update(id: string, body: UpdateFournisseurDto): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
