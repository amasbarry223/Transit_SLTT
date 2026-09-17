import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class DocumentsService {
    private readonly prisma;
    private readonly uploadBaseDir;
    constructor(prisma: PrismaService);
    saveFileMetadata(file: Express.Multer.File, dossierId?: string): Promise<{
        id: string;
        createdAt: Date;
        dossierId: string | null;
        nomFichier: string;
        nomOriginal: string;
        typeMime: string;
        taille: number;
        cheminRelatif: string;
        url: string | null;
    }>;
    findAll(user: CurrentUserType): Promise<({
        dossier: {
            id: string;
            annexeId: string;
            numero: string;
        };
    } & {
        id: string;
        createdAt: Date;
        dossierId: string | null;
        nomFichier: string;
        nomOriginal: string;
        typeMime: string;
        taille: number;
        cheminRelatif: string;
        url: string | null;
    })[]>;
    findByDossier(dossierId: string, user: CurrentUserType): Promise<{
        id: string;
        createdAt: Date;
        dossierId: string | null;
        nomFichier: string;
        nomOriginal: string;
        typeMime: string;
        taille: number;
        cheminRelatif: string;
        url: string | null;
    }[]>;
    private resolveInsideUploads;
    getFilePath(filename: string): Promise<{
        doc: {
            nomOriginal: string;
            typeMime: string;
        };
        fullPath: string;
    } | {
        doc: {
            id: string;
            createdAt: Date;
            dossierId: string | null;
            nomFichier: string;
            nomOriginal: string;
            typeMime: string;
            taille: number;
            cheminRelatif: string;
            url: string | null;
        };
        fullPath: string;
    }>;
    deleteFile(id: string, user: CurrentUserType): Promise<{
        id: string;
        createdAt: Date;
        dossierId: string | null;
        nomFichier: string;
        nomOriginal: string;
        typeMime: string;
        taille: number;
        cheminRelatif: string;
        url: string | null;
    }>;
}
