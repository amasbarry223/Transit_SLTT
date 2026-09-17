import { AnnexesService } from './annexes.service';
import { CreateAnnexeDto } from './dto/create-annexe.dto';
import { UpdateAnnexeDto } from './dto/update-annexe.dto';
export declare class AnnexesController {
    private readonly annexesService;
    constructor(annexesService: AnnexesService);
    findAll(): Promise<{
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
    }[]>;
    findOne(id: string): Promise<{
        _count: {
            dossiers: number;
            factures: number;
            caisses: number;
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
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }>;
    create(body: CreateAnnexeDto): Promise<{
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
    }>;
    update(id: string, body: UpdateAnnexeDto): Promise<{
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
        ville: string | null;
        pays: string;
        rccm: string | null;
        nif: string | null;
        estSiege: boolean;
    }>;
}
