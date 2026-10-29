export interface DossierCreance {
    id: string;
    numero: string;
    totalContrat: number | null;
    montantPaye: number | null;
    client?: {
        nom?: string | null;
    } | null;
}
export interface FactureCreance {
    id: string;
    numero: string;
    dossierId?: string | null;
    statut: string;
    montantTtc: number | null;
    montantPaye: number | null;
    dateEcheance?: Date | string | null;
    client?: {
        nom?: string | null;
    } | null;
}
type Tranche = '0-30j' | '31-60j' | '61-90j' | '+90j';
export interface RisqueClient {
    id: string;
    clientNom: string;
    referenceDossierOuFacture: string;
    montant: number;
    echeance: string;
    statut: 'En retard' | 'À risque' | 'Contentieux' | 'En cours';
    joursRetard: number;
}
export interface Creances {
    totalARecouvrer: number;
    montantEchu: number;
    montantNonEchu: number;
    aging: Record<Tranche, {
        montant: number;
        count: number;
    }>;
    topRiskClients: RisqueClient[];
}
export declare function calculerCreances(dossiers: DossierCreance[], factures: FactureCreance[], now: Date): Creances;
export {};
