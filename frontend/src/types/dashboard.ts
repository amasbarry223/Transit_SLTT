/**
 * Transit SLTT — Types Officiels du Tableau de Bord & Analytics
 * 
 * Modélisation 100% dynamique pour le suivi des opérations réelles SLTT :
 * - Dossiers de transit & corridors régionaux
 * - Flux de caisse, trésorerie et débours
 * - Facturation, TVA (18%) et créances
 * - Alertes opérationnelles et opérations récentes
 */

export interface DashboardKPI {
  id: string;
  label: string;
  rawNumericValue: number;
  formattedValue: string;
  unit?: string;
  variation?: {
    percentage: number;
    isPositive: boolean;
    periodText: string;
  };
  subtitle?: string;
  type:
    | "dossiers_total"
    | "dossiers_en_cours"
    | "clients_actifs"
    | "factures_recouvrer"
    | "debours_avances"
    | "tresorerie_disponible";
  category: "operations" | "finance" | "clients" | "stocks";
  isFinancialDebours?: boolean;
  accentColor: "blue" | "emerald" | "purple" | "amber" | "rose" | "teal";
  targetView: string;
}

export interface TransitActivityDataPoint {
  date: string;
  displayDate: string;
  maritime: number;
  terrestre: number;
  aerien: number;
  total: number;
}

export interface TransitStats {
  period30Days: TransitActivityDataPoint[];
  period7Days: TransitActivityDataPoint[];
  period90Days: TransitActivityDataPoint[];
  statusDistribution: {
    name: string;
    key: "en_douane" | "en_transit" | "livre" | "attente_bae" | "cloture" | "en_cours";
    value: number;
    percentage: number;
    color: string;
  }[];
  totalDossiersCount: number;
}

export interface CashFlowMonthlyPoint {
  month: string;
  monthShort: string;
  entrees: number;
  sorties: number;
  soldeNet: number;
}

export interface CashFlowStats {
  monthlyHistory: CashFlowMonthlyPoint[];
  soldeDisponible: number;
  deboursARecuperer: number;
  bonsEnAttente: number;
  variationMois: number;
}

export interface InvoiceMonthlyPoint {
  month: string;
  prestationsHT: number;
  tvaCollectee: number;
  deboursRefactures: number;
  totalFactureTTC: number;
}

export interface InvoiceStats {
  monthlyHistory: InvoiceMonthlyPoint[];
  summary: {
    prestationsHT: number;
    tvaCollectee: number;
    deboursRefactures: number;
    totalFactureTTC: number;
    variationPrestations: number;
  };
}

export interface AgingBalanceCategory {
  bracket: "0-30j" | "31-60j" | "61-90j" | "+90j";
  label: string;
  montant: number;
  count: number;
  color: string;
}

export interface RiskClient {
  id: string;
  clientNom: string;
  referenceDossierOuFacture: string;
  montant: number;
  echeance: string;
  statut: "En retard" | "À risque" | "Contentieux" | "En cours";
  joursRetard: number;
}

export interface ReceivableStats {
  totalARecouvrer: number;
  montantEchu: number;
  montantNonEchu: number;
  agingBalance: AgingBalanceCategory[];
  topRiskClients: RiskClient[];
}

export interface WarehouseCategoryUsage {
  category: string;
  volumeM3: number;
  percentage: number;
  unitesCount: number;
  color: string;
}

export interface WarehouseStats {
  capaciteTotaleM3: number;
  capaciteUtiliseeM3: number;
  capaciteDisponibleM3: number;
  tauxOccupation: number;
  categories: WarehouseCategoryUsage[];
}

export interface RecentOperation {
  id: string;
  date: string;
  formattedDate: string;
  type: "Dossier" | "Facture" | "Débours" | "Caisse" | "Stock";
  reference: string;
  clientOuTiers: string;
  montant?: number;
  statut: "En douane" | "Validé" | "En cours" | "Partiellement payée" | "Payée" | "Livré" | "En attente";
  statutColor: "blue" | "emerald" | "amber" | "purple" | "slate";
  targetView: string;
  targetId?: string;
}

export interface OperationalAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  badgeText: string;
  title: string;
  description: string;
  count: number;
  targetView: string;
  targetId?: string;
}

export interface TransitPipelineStep {
  stepKey: "OUVERT" | "EN_COURS" | "DOUANE" | "BAE" | "TRANSIT" | "LIVRE" | "CLOTURE" | string;
  label: string;
  count: number;
  percentage: number;
  deboursEngages: number;
  hasOverdueAlert: boolean;
  overdueCount?: number;
}

export interface TransitPerformanceKPI {
  delaiMoyenDedouanementJours: number;
  tauxDossiersLivresATemps: number;
  dossiersBloques: number;
  conteneursEnTransit: number;
  trend: {
    delaiTrend: number;
    livraisonTrend: number;
  };
}
