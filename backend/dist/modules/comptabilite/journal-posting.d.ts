export declare const ORIGINE: {
    readonly DOSSIER_PAIEMENT: "DOSSIER_PAIEMENT";
    readonly DOSSIER_DEPENSE: "DOSSIER_DEPENSE";
    readonly FACTURE_PAIEMENT: "FACTURE_PAIEMENT";
    readonly DEPENSE_PAYEE: "DEPENSE_PAYEE";
    readonly BON_CAISSE: "BON_CAISSE";
    readonly CONTREPASSATION: "CONTREPASSATION";
};
export type OrigineType = (typeof ORIGINE)[keyof typeof ORIGINE];
export declare const SOURCE_AUTO: Record<OrigineType, string>;
export declare const modePaiementJournal: (mode?: string | null) => string;
export declare function lendemain(dateIso: string): string;
export declare function apresBascule(bascule: Date, creeLe: Date | string, date: Date | string): boolean;
export declare function getBascule(tx: any): Promise<Date>;
export declare function derniereClotureFin(tx: any, annexeId: string | null): Promise<string | null>;
export declare function nextReference(tx: any): Promise<string>;
export interface EcritureAuto {
    origineType: OrigineType;
    origineId: string;
    annexeId: string | null;
    date: Date | string;
    type: 'Entrée' | 'Sortie';
    montant: number;
    nature: string;
    clientId?: string | null;
    dossierId?: string | null;
    clientNom?: string | null;
    modePaiement?: string;
}
export declare function posterEcriture(tx: any, e: EcritureAuto): Promise<void>;
export declare function retirerEcriture(tx: any, origineType: OrigineType, origineId: string): Promise<void>;
export declare function synchroniserJournalDossier(tx: any, dossierId: string): Promise<void>;
export declare function synchroniserJournalBonCaisse(tx: any, bonId: string): Promise<void>;
