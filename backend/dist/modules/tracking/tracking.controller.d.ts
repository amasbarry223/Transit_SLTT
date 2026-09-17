import { TrackingService } from './tracking.service';
import type { CurrentUserType } from '../../auth/auth.types';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    getPublicTracking(code: string): Promise<{
        dossier: {
            type: import("@prisma/client").$Enums.TypeDossier;
            numero: string;
            statut: import("@prisma/client").$Enums.StatutDossier;
            voieTransport: import("@prisma/client").$Enums.VoieTransport;
            marchandise: string;
            navireVol: string;
            compagnie: string;
            numeroBl: string;
            portProvenance: string;
            portDestination: string;
            dateDepart: Date;
            dateArriveePrevue: Date;
            dateArriveeEffective: Date;
            dateLivraison: Date;
            conteneurs: {
                type: string;
                numero: string;
                statut: import("@prisma/client").$Enums.StatutConteneur;
            }[];
            etapes: {
                titre: string;
                description: string;
                completee: boolean;
                dateEffective: Date;
            }[];
        };
    } & {
        id: string;
        actif: boolean;
        updatedAt: Date;
        dossierId: string;
        codeTracking: string;
        dernierePosition: string | null;
        statutAffiche: string | null;
    }>;
    updatePosition(dossierId: string, user: CurrentUserType, body: {
        dernierePosition?: string;
        statutAffiche?: string;
    }): Promise<{
        id: string;
        actif: boolean;
        updatedAt: Date;
        dossierId: string;
        codeTracking: string;
        dernierePosition: string | null;
        statutAffiche: string | null;
    }>;
}
