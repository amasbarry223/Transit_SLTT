import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
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
    uploadFile(file: Express.Multer.File, dossierId?: string): Promise<{
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
    downloadFile(filename: string, res: Response): Promise<void>;
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
