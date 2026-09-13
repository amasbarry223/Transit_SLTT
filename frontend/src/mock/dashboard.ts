/**
 * Transit SLTT — Données Mock Centralisées & Typées pour le Tableau de Bord
 * 
 * Ce fichier sert de référentiel structuré pour l'affichage haute fidélité
 * du Dashboard SLTT. Conforme à la législation et aux pratiques de transit en Afrique de l'Ouest :
 * - Prestations de service SLTT soumises à la TVA (18%)
 * - Débours douaniers & portuaires décaissés pour compte de tiers (TVA 0%, refacturés au centime sans marge)
 * - Séparation stricte Chiffre d'Affaires vs Débours
 * - Corridors régionaux (Abidjan Port ↔ Zégoua ↔ Bamako Faladié / Sénou)
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
    key: "en_douane" | "en_transit" | "livre" | "attente_bae" | "cloture";
    value: number;
    percentage: number;
    color: string;
  }[];
  totalDossiersCount: number;
}

export interface CashFlowMonthlyPoint {
  month: string;
  monthShort: string;
  entrees: number; // Encaissements clients (Prestations + Remboursements débours)
  sorties: number; // Décaissements effectifs (Droits de douane, B/L fees, manutention, charges)
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
  prestationsHT: number;   // CA réel SLTT (Prestations propres)
  tvaCollectee: number;    // TVA 18% sur prestations
  deboursRefactures: number; // Avances douane & port refacturées à 0%
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
  stepKey: "OUVERT" | "EN_COURS" | "DOUANE" | "BAE" | "TRANSIT" | "LIVRE" | "CLOTURE";
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

/* ==========================================================================
   DONNÉES REALISTES MOCK — SLTT (BAMAKO / ABIDJAN)
   ========================================================================== */

export const MOCK_DASHBOARD_KPIS: DashboardKPI[] = [
  {
    id: "kpi-dossiers-total",
    label: "Dossiers de transit",
    rawNumericValue: 128,
    formattedValue: "128",
    variation: {
      percentage: 12.4,
      isPositive: true,
      periodText: "vs mois précédent",
    },
    subtitle: "Maritime, Terrestre & Aérien",
    type: "dossiers_total",
    category: "operations",
    accentColor: "blue",
    targetView: "dossiers",
  },
  {
    id: "kpi-dossiers-en-cours",
    label: "Dossiers en cours",
    rawNumericValue: 42,
    formattedValue: "42",
    variation: {
      percentage: 14.0,
      isPositive: true,
      periodText: "vs. hier",
    },
    subtitle: "dont 8 en attente douane",
    type: "dossiers_en_cours",
    category: "operations",
    accentColor: "emerald",
    targetView: "dossiers",
  },
  {
    id: "kpi-clients-actifs",
    label: "Clients actifs",
    rawNumericValue: 86,
    formattedValue: "86",
    variation: {
      percentage: 8.2,
      isPositive: true,
      periodText: "vs mois dernier",
    },
    subtitle: "24 importateurs réguliers",
    type: "clients_actifs",
    category: "clients",
    accentColor: "purple",
    targetView: "clients",
  },
  {
    id: "kpi-factures-recouvrer",
    label: "Factures à recouvrer",
    rawNumericValue: 18740000,
    formattedValue: "18 740 000 FCFA",
    unit: "FCFA",
    variation: {
      percentage: 21.0,
      isPositive: true,
      periodText: "vs mois dernier",
    },
    subtitle: "Dont 6 420 000 FCFA échus",
    type: "factures_recouvrer",
    category: "finance",
    accentColor: "amber",
    targetView: "factures",
  },
  {
    id: "kpi-debours-avances",
    label: "Débours avancés",
    rawNumericValue: 32450000,
    formattedValue: "32 450 000 FCFA",
    unit: "FCFA",
    subtitle: "À récupérer auprès des clients",
    isFinancialDebours: true,
    type: "debours_avances",
    category: "finance",
    accentColor: "rose",
    targetView: "comptabilite",
  },
  {
    id: "kpi-tresorerie-disponible",
    label: "Trésorerie disponible",
    rawNumericValue: 24750000,
    formattedValue: "24 750 000 FCFA",
    unit: "FCFA",
    variation: {
      percentage: 8.7,
      isPositive: true,
      periodText: "vs mois dernier",
    },
    subtitle: "Caisses & Banques consolidées",
    type: "tresorerie_disponible",
    category: "finance",
    accentColor: "teal",
    targetView: "comptabilite",
  },
];

// 30 jours d'opérations quotidiennes réalistes
export const MOCK_TRANSIT_STATS: TransitStats = {
  totalDossiersCount: 58,
  statusDistribution: [
    { name: "En cours de douane", key: "en_douane", value: 22, percentage: 38, color: "#2563EB" },
    { name: "En transit (corridor)", key: "en_transit", value: 12, percentage: 21, color: "#10B981" },
    { name: "En attente BAE", key: "attente_bae", value: 10, percentage: 17, color: "#F59E0B" },
    { name: "Livrés sur site", key: "livre", value: 8, percentage: 14, color: "#6366F1" },
    { name: "Clôturés", key: "cloture", value: 6, percentage: 10, color: "#94A3B8" },
  ],
  period7Days: [
    { date: "2026-09-17", displayDate: "17 Sep", maritime: 6, terrestre: 4, aerien: 2, total: 12 },
    { date: "2026-09-18", displayDate: "18 Sep", maritime: 8, terrestre: 5, aerien: 1, total: 14 },
    { date: "2026-09-19", displayDate: "19 Sep", maritime: 9, terrestre: 6, aerien: 3, total: 18 },
    { date: "2026-09-20", displayDate: "20 Sep", maritime: 5, terrestre: 3, aerien: 1, total: 9 },
    { date: "2026-09-21", displayDate: "21 Sep", maritime: 7, terrestre: 4, aerien: 2, total: 13 },
    { date: "2026-09-22", displayDate: "22 Sep", maritime: 10, terrestre: 6, aerien: 2, total: 18 },
    { date: "2026-09-23", displayDate: "Aujourd'hui", maritime: 8, terrestre: 5, aerien: 3, total: 16 },
  ],
  period30Days: [
    { date: "2026-08-25", displayDate: "25 Aoû", maritime: 5, terrestre: 3, aerien: 1, total: 9 },
    { date: "2026-08-27", displayDate: "27 Aoû", maritime: 7, terrestre: 4, aerien: 2, total: 13 },
    { date: "2026-08-29", displayDate: "29 Aoû", maritime: 8, terrestre: 5, aerien: 1, total: 14 },
    { date: "2026-08-31", displayDate: "31 Aoû", maritime: 6, terrestre: 3, aerien: 2, total: 11 },
    { date: "2026-09-02", displayDate: "02 Sep", maritime: 9, terrestre: 6, aerien: 2, total: 17 },
    { date: "2026-09-04", displayDate: "04 Sep", maritime: 7, terrestre: 4, aerien: 3, total: 14 },
    { date: "2026-09-06", displayDate: "06 Sep", maritime: 8, terrestre: 5, aerien: 1, total: 14 },
    { date: "2026-09-08", displayDate: "08 Sep", maritime: 10, terrestre: 6, aerien: 2, total: 18 },
    { date: "2026-09-10", displayDate: "10 Sep", maritime: 6, terrestre: 4, aerien: 1, total: 11 },
    { date: "2026-09-12", displayDate: "12 Sep", maritime: 8, terrestre: 5, aerien: 2, total: 15 },
    { date: "2026-09-14", displayDate: "14 Sep", maritime: 7, terrestre: 4, aerien: 3, total: 14 },
    { date: "2026-09-16", displayDate: "16 Sep", maritime: 9, terrestre: 6, aerien: 2, total: 17 },
    { date: "2026-09-18", displayDate: "18 Sep", maritime: 8, terrestre: 5, aerien: 1, total: 14 },
    { date: "2026-09-20", displayDate: "20 Sep", maritime: 7, terrestre: 4, aerien: 2, total: 13 },
    { date: "2026-09-22", displayDate: "22 Sep", maritime: 10, terrestre: 7, aerien: 2, total: 19 },
    { date: "2026-09-23", displayDate: "23 Sep", maritime: 9, terrestre: 5, aerien: 2, total: 16 },
  ],
  period90Days: [
    { date: "2026-07-01", displayDate: "Semaine 27", maritime: 28, terrestre: 18, aerien: 6, total: 52 },
    { date: "2026-07-15", displayDate: "Semaine 29", maritime: 32, terrestre: 20, aerien: 8, total: 60 },
    { date: "2026-08-01", displayDate: "Semaine 31", maritime: 35, terrestre: 22, aerien: 7, total: 64 },
    { date: "2026-08-15", displayDate: "Semaine 33", maritime: 40, terrestre: 24, aerien: 9, total: 73 },
    { date: "2026-09-01", displayDate: "Semaine 35", maritime: 42, terrestre: 26, aerien: 11, total: 79 },
    { date: "2026-09-15", displayDate: "Semaine 37", maritime: 45, terrestre: 28, aerien: 10, total: 83 },
  ],
};

export const MOCK_CASHFLOW_STATS: CashFlowStats = {
  soldeDisponible: 24750000,
  deboursARecuperer: 32450000,
  bonsEnAttente: 4850000,
  variationMois: 8.7,
  monthlyHistory: [
    { month: "Avril 2026", monthShort: "Avr", entrees: 18500000, sorties: 16200000, soldeNet: 2300000 },
    { month: "Mai 2026", monthShort: "Mai", entrees: 22400000, sorties: 19800000, soldeNet: 2600000 },
    { month: "Juin 2026", monthShort: "Juin", entrees: 20100000, sorties: 18300000, soldeNet: 1800000 },
    { month: "Juillet 2026", monthShort: "Juil", entrees: 26800000, sorties: 22500000, soldeNet: 4300000 },
    { month: "Août 2026", monthShort: "Août", entrees: 24500000, sorties: 21900000, soldeNet: 2600000 },
    { month: "Septembre 2026", monthShort: "Sep", entrees: 28900000, sorties: 24750000, soldeNet: 4150000 },
  ],
};

export const MOCK_INVOICE_STATS: InvoiceStats = {
  summary: {
    prestationsHT: 18740000,
    tvaCollectee: 3373200,
    deboursRefactures: 42850000,
    totalFactureTTC: 64963200,
    variationPrestations: 21.0,
  },
  monthlyHistory: [
    { month: "Avr", prestationsHT: 13200000, tvaCollectee: 2376000, deboursRefactures: 28400000, totalFactureTTC: 43976000 },
    { month: "Mai", prestationsHT: 15400000, tvaCollectee: 2772000, deboursRefactures: 34200000, totalFactureTTC: 52372000 },
    { month: "Juin", prestationsHT: 14800000, tvaCollectee: 2664000, deboursRefactures: 31500000, totalFactureTTC: 48964000 },
    { month: "Juil", prestationsHT: 17900000, tvaCollectee: 3222000, deboursRefactures: 39800000, totalFactureTTC: 60922000 },
    { month: "Août", prestationsHT: 16500000, tvaCollectee: 2970000, deboursRefactures: 36700000, totalFactureTTC: 56170000 },
    { month: "Sep", prestationsHT: 18740000, tvaCollectee: 3373200, deboursRefactures: 42850000, totalFactureTTC: 64963200 },
  ],
};

export const MOCK_RECEIVABLE_STATS: ReceivableStats = {
  totalARecouvrer: 18740000,
  montantEchu: 6420000,
  montantNonEchu: 12320000,
  agingBalance: [
    { bracket: "0-30j", label: "0 à 30 jours (Non échu)", montant: 12320000, count: 18, color: "#10B981" },
    { bracket: "31-60j", label: "31 à 60 jours", montant: 3450000, count: 6, color: "#F59E0B" },
    { bracket: "61-90j", label: "61 à 90 jours", montant: 1820000, count: 3, color: "#F97316" },
    { bracket: "+90j", label: "+90 jours (Contentieux)", montant: 1150000, count: 2, color: "#EF4444" },
  ],
  topRiskClients: [
    {
      id: "cl-01",
      clientNom: "Société Diamant SA",
      referenceDossierOuFacture: "FAC-2026-0112",
      montant: 3200000,
      echeance: "28/08/2026",
      statut: "En retard",
      joursRetard: 26,
    },
    {
      id: "cl-02",
      clientNom: "AFRICA TRADING SARL",
      referenceDossierOuFacture: "FAC-2026-0129",
      montant: 1850000,
      echeance: "10/09/2026",
      statut: "En retard",
      joursRetard: 13,
    },
    {
      id: "cl-03",
      clientNom: "BTP Mali Logistique",
      referenceDossierOuFacture: "FAC-2026-0138",
      montant: 950000,
      echeance: "15/09/2026",
      statut: "À risque",
      joursRetard: 8,
    },
    {
      id: "cl-04",
      clientNom: "Grands Moulins du Sahel",
      referenceDossierOuFacture: "FAC-2026-0144",
      montant: 420000,
      echeance: "20/09/2026",
      statut: "En cours",
      joursRetard: 3,
    },
  ],
};

export const MOCK_TRANSIT_PIPELINE: TransitPipelineStep[] = [
  { stepKey: "OUVERT", label: "Ouvert", count: 8, percentage: 14, deboursEngages: 2400000, hasOverdueAlert: false },
  { stepKey: "EN_COURS", label: "En cours", count: 12, percentage: 21, deboursEngages: 5800000, hasOverdueAlert: false },
  { stepKey: "DOUANE", label: "Douane (Sydonia)", count: 22, percentage: 38, deboursEngages: 14600000, hasOverdueAlert: true, overdueCount: 2 },
  { stepKey: "BAE", label: "Bon à enlever", count: 10, percentage: 17, deboursEngages: 4200000, hasOverdueAlert: false },
  { stepKey: "TRANSIT", label: "En route corridor", count: 14, percentage: 24, deboursEngages: 6500000, hasOverdueAlert: false },
  { stepKey: "LIVRE", label: "Livré client", count: 8, percentage: 14, deboursEngages: 1800000, hasOverdueAlert: false },
  { stepKey: "CLOTURE", label: "Clôturé", count: 6, percentage: 10, deboursEngages: 0, hasOverdueAlert: false },
];

export const MOCK_OPERATIONAL_ALERTS: OperationalAlert[] = [
  {
    id: "alert-1",
    severity: "critical",
    badgeText: "Surestaries",
    title: "3 conteneurs proches de la fin de franchise",
    description: "Port d'Abidjan (Maersk & CMA CGM) — franchise expire dans moins de 48h.",
    count: 3,
    targetView: "dossiers",
  },
  {
    id: "alert-2",
    severity: "warning",
    badgeText: "Factures échues",
    title: "5 factures échues à relancer",
    description: "Montant total en souffrance : 6 420 000 FCFA dont Société Diamant SA.",
    count: 5,
    targetView: "factures",
  },
  {
    id: "alert-3",
    severity: "warning",
    badgeText: "Caisse Débours",
    title: "4 bons de décaissement en attente de validation",
    description: "Avances douanières pour 4 850 000 FCFA au bureau de Sénou & Faladié.",
    count: 4,
    targetView: "comptabilite",
  },
  {
    id: "alert-4",
    severity: "warning",
    badgeText: "Douane Sydonia",
    title: "2 dossiers bloqués à l'étape douane",
    description: "Inspection physique scanner programmée sur BKO-MAR-2026-0089.",
    count: 2,
    targetView: "dossiers",
  },
  {
    id: "alert-5",
    severity: "info",
    badgeText: "GED / OCR",
    title: "3 documents nécessitent une validation",
    description: "Quittances de douane et B/L scannés prêts pour contrôle.",
    count: 3,
    targetView: "archives",
  },
];

export const MOCK_WAREHOUSE_STATS: WarehouseStats = {
  capaciteTotaleM3: 600,
  capaciteUtiliseeM3: 456,
  capaciteDisponibleM3: 144,
  tauxOccupation: 76,
  categories: [
    { category: "Conteneurs (TC 20'/40')", volumeM3: 185, percentage: 41, unitesCount: 128, color: "#2563EB" },
    { category: "Marchandises diverses", volumeM3: 138, percentage: 30, unitesCount: 96, color: "#10B981" },
    { category: "Produits agricoles", volumeM3: 92, percentage: 20, unitesCount: 64, color: "#F59E0B" },
    { category: "Équipements industriels", volumeM3: 75, percentage: 16, unitesCount: 52, color: "#8B5CF6" },
    { category: "Autres colis / MAD", volumeM3: 23, percentage: 5, unitesCount: 16, color: "#64748B" },
  ],
};

export const MOCK_RECENT_OPERATIONS: RecentOperation[] = [
  {
    id: "op-1",
    date: "2026-09-23",
    formattedDate: "23/09/2026",
    type: "Dossier",
    reference: "BKO-MAR-2026-0089",
    clientOuTiers: "Société Diamant SA",
    montant: 5420000,
    statut: "En douane",
    statutColor: "blue",
    targetView: "dossiers",
  },
  {
    id: "op-2",
    date: "2026-09-23",
    formattedDate: "23/09/2026",
    type: "Facture",
    reference: "FAC-2026-0158",
    clientOuTiers: "AFRICA TRADING SARL",
    montant: 8589000,
    statut: "Partiellement payée",
    statutColor: "amber",
    targetView: "factures",
  },
  {
    id: "op-3",
    date: "2026-09-22",
    formattedDate: "22/09/2026",
    type: "Débours",
    reference: "DBR-2026-0021",
    clientOuTiers: "Douanes Maliennes (Quittance Sydonia)",
    montant: 4500000,
    statut: "Validé",
    statutColor: "emerald",
    targetView: "comptabilite",
  },
  {
    id: "op-4",
    date: "2026-09-22",
    formattedDate: "22/09/2026",
    type: "Caisse",
    reference: "BC-2026-0045",
    clientOuTiers: "Agent de transit Sénou (Avance B/L)",
    montant: 650000,
    statut: "Validé",
    statutColor: "emerald",
    targetView: "comptabilite",
  },
  {
    id: "op-5",
    date: "2026-09-21",
    formattedDate: "21/09/2026",
    type: "Stock",
    reference: "STK-2026-0034",
    clientOuTiers: "Grands Moulins du Sahel (Entrée MAD)",
    montant: 3200000,
    statut: "Livré",
    statutColor: "purple",
    targetView: "entreposage",
  },
];

export const MOCK_TRANSIT_PERFORMANCE: TransitPerformanceKPI = {
  delaiMoyenDedouanementJours: 2.8,
  tauxDossiersLivresATemps: 87,
  dossiersBloques: 6,
  conteneursEnTransit: 24,
  trend: {
    delaiTrend: -0.4, // -0.4 jours (amélioration)
    livraisonTrend: 3.5, // +3.5%
  },
};
