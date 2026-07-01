/**
 * Mock data for the SLTT application.
 * All amounts are in FCFA. All text in French.
 */

export type DossierStatut = "En cours" | "Dédouané" | "Livré" | "Soldé";
export type PaiementMode =
  | "Espèces"
  | "Virement"
  | "Mobile Money"
  | "Chèque";
export type EcritureStatut = "Soldé" | "En attente";
export type StockStatut = "Disponible" | "Stock faible";
export type BonMotif = "Vente" | "Livraison" | "Transfert";
export type ClientType = "Particulier" | "Entreprise";
export type UserRole =
  | "Administrateur"
  | "Agent de transit"
  | "Comptable"
  | "Magasinier"
  | "Commercial";

export interface Client {
  id: string;
  nom: string;
  type: ClientType;
  telephone: string;
  email: string;
  adresse: string;
  nbDossiers: number;
  totalDu: number;
  totalPaye: number;
}

export interface Dossier {
  id: string;
  reference: string;
  clientId: string;
  clientNom: string;
  bl: string;
  camion: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
  montantPaye: number;
  statut: DossierStatut;
  date: string;
  /** Date limite de dédouanement / livraison. Dépassée = surestaries. */
  dateEcheance?: string;
  /** Date réelle de dédouanement (remplie quand statut → Dédouané). */
  dateDedouanement?: string;
  /** IDs des documents de la checklist reçus. */
  checklistDocs?: string[];
  /** Mode de transport principal. */
  modeTransport?: "Maritime" | "Aérien" | "Routier" | "Ferroviaire";
  /** Numéro de conteneur (si Maritime). */
  noConteneur?: string;
  /** Port ou aéroport d'entrée. */
  portEntree?: string;
  /** Poids total en kg. */
  poidsTotal?: number;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* FOURNISSEURS / SOUS-TRAITANTS                                        */
/* ------------------------------------------------------------------ */

export type FournisseurType =
  | "Transporteur"
  | "Manutentionnaire"
  | "Commissionnaire en douane"
  | "Loueur"
  | "Autre";

export type FournisseurStatut = "Actif" | "Inactif";

export interface Fournisseur {
  id: string;
  nom: string;
  type: FournisseurType;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  tarifContractuel?: number;
  nbDossiers: number;
  montantTotal: number;
  statut: FournisseurStatut;
}

export interface FournisseurInput {
  nom: string;
  type: FournisseurType;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  tarifContractuel?: number;
  statut: FournisseurStatut;
}

export interface DossierFournisseur {
  id: string;
  dossierId: string;
  dossierRef?: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: FournisseurType;
  description: string;
  montantBudgete: number;
  montantReel: number;
  statut: "En attente" | "Payé" | "Litige";
  date: string;
}

export interface DossierFournisseurInput {
  dossierId: string;
  dossierRef?: string;
  fournisseurId: string;
  fournisseurNom: string;
  type: FournisseurType;
  description: string;
  montantBudgete: number;
  montantReel: number;
  statut: "En attente" | "Payé" | "Litige";
  date: string;
}

export const fournisseurs: Fournisseur[] = [
  { id: "F-001", nom: "Trans-Sahel Transport", type: "Transporteur", contact: "Moussa Konaté", telephone: "+223 76 12 34 56", email: "konat.moussa@transsahel.ml", adresse: "Zone Industrielle, Bamako", tarifContractuel: 350_000, nbDossiers: 8, montantTotal: 2_800_000, statut: "Actif" },
  { id: "F-002", nom: "Douane Conseil Mali", type: "Commissionnaire en douane", contact: "Aminata Coulibaly", telephone: "+223 66 98 76 54", email: "a.coulibaly@douanemali.ml", adresse: "Près de la Direction des Douanes, Bamako", tarifContractuel: 200_000, nbDossiers: 12, montantTotal: 2_400_000, statut: "Actif" },
  { id: "F-003", nom: "Manutention Express", type: "Manutentionnaire", contact: "Ibrahim Dembélé", telephone: "+223 65 44 22 11", email: "contact@manut-express.ml", adresse: "Port Sec de Bamako", tarifContractuel: 120_000, nbDossiers: 5, montantTotal: 600_000, statut: "Actif" },
  { id: "F-004", nom: "Location Camions Mali", type: "Loueur", contact: "Seydou Traoré", telephone: "+223 75 33 11 99", email: "s.traore@loccam.ml", adresse: "Route de Koulikoro, Bamako", tarifContractuel: 180_000, nbDossiers: 3, montantTotal: 540_000, statut: "Actif" },
  { id: "F-005", nom: "Gestion Entrepôts SA", type: "Manutentionnaire", contact: "Fatoumata Sissoko", telephone: "+223 79 55 66 77", email: "f.sissoko@gesamali.ml", adresse: "Zone Industrielle de Sotuba", tarifContractuel: 90_000, nbDossiers: 2, montantTotal: 180_000, statut: "Inactif" },
];

export const dossierFournisseurs: DossierFournisseur[] = [
  { id: "DF-001", dossierId: "D-0042", dossierRef: "SLTT-TR-2026-0042", fournisseurId: "F-001", fournisseurNom: "Trans-Sahel Transport", type: "Transporteur", description: "Transport Dakar → Bamako", montantBudgete: 400_000, montantReel: 380_000, statut: "En attente", date: "2026-01-08" },
  { id: "DF-002", dossierId: "D-0042", dossierRef: "SLTT-TR-2026-0042", fournisseurId: "F-002", fournisseurNom: "Douane Conseil Mali", type: "Commissionnaire en douane", description: "Assistance dédouanement matériel électronique", montantBudgete: 200_000, montantReel: 200_000, statut: "Payé", date: "2026-01-09" },
  { id: "DF-003", dossierId: "D-0040", dossierRef: "SLTT-TR-2026-0040", fournisseurId: "F-001", fournisseurNom: "Trans-Sahel Transport", type: "Transporteur", description: "Transport pièces automobiles", montantBudgete: 350_000, montantReel: 370_000, statut: "Payé", date: "2026-01-04" },
  { id: "DF-004", dossierId: "D-0040", dossierRef: "SLTT-TR-2026-0040", fournisseurId: "F-003", fournisseurNom: "Manutention Express", type: "Manutentionnaire", description: "Déchargement et mise en entrepôt", montantBudgete: 120_000, montantReel: 115_000, statut: "Payé", date: "2026-01-05" },
];

/** Documents standards d'un dossier de transit. */
export const CHECKLIST_DOCS = [
  { id: "bl",                  label: "Connaissement (BL)",         obligatoire: true  },
  { id: "dau",                 label: "Déclaration en douane (DAU)", obligatoire: true  },
  { id: "bad",                 label: "Bon à délivrer (BAD)",        obligatoire: true  },
  { id: "facture-commerciale", label: "Facture commerciale",         obligatoire: true  },
  { id: "colisage",            label: "Liste de colisage",           obligatoire: true  },
  { id: "certif-origine",      label: "Certificat d'origine",        obligatoire: false },
  { id: "assurance",           label: "Attestation d'assurance",     obligatoire: false },
] as const;

export interface Ecriture {
  id: string;
  date: string;
  datePaiement?: string;
  clientId: string;
  clientNom: string;
  dossierId?: string;
  montantInvesti: number;
  montantPaye: number;
  modePaiement: PaiementMode;
  note?: string;
}

export interface StockItem {
  id: string;
  marchandise: string;
  quantite: number;
  unite: string;
  seuil: number;
  depositaire: string;
  commercial: string;
  sommePayee: number;
  resteAPayer: number;
}

export interface Mouvement {
  id: string;
  date: string;
  type: "Entrée" | "Sortie";
  marchandise: string;
  quantite: number;
  unite: string;
  responsable: string;
  bonRef?: string;
}

export interface BonSortie {
  id: string;
  reference: string;
  date: string;
  clientId: string;
  clientNom: string;
  /** Référence vers l'article de stock concerné, pour un décrément fiable (les bons plus anciens peuvent ne pas l'avoir). */
  stockId?: string;
  marchandise: string;
  quantite: number;
  unite: string;
  motif: BonMotif;
  montant: number;
  statut: "Validé" | "Brouillon";
}

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  permissions: string[];
  motDePasse: string;
  actif: boolean;
  derniereConnexion: string;
}

export interface SubDossier {
  id: string;
  dossierId: string;
  nom: string;
  description?: string;
  dateCreation: string;
}

export interface DossierFichier {
  id: string;
  dossierId: string;
  sousDossierId?: string;
  nom: string;
  taille: number;
  type: string;
  dateUpload: string;
  dataUrl: string;
}

export const subDossiers: SubDossier[] = [];
export const fichiers: DossierFichier[] = [];

export interface DossierComment {
  id: string;
  dossierId: string;
  userName: string;
  texte: string;
  date: string;
}

export const dossierComments: DossierComment[] = [];

/* ------------------------------------------------------------------ */
/* CLIENTS                                                              */
/* ------------------------------------------------------------------ */

export const clients: Client[] = [
  {
    id: "C-001",
    nom: "Société des Établissements Diallo",
    type: "Entreprise",
    telephone: "+223 76 12 34 56",
    email: "contact@diallo-sa.ml",
    adresse: "Av. de l'Indépendance, Bamako",
    nbDossiers: 8,
    totalDu: 1_250_000,
    totalPaye: 9_800_000,
  },
  {
    id: "C-002",
    nom: "Traoré & Frères Commerce",
    type: "Entreprise",
    telephone: "+223 65 98 76 54",
    email: "traorefreres@gmail.com",
    adresse: "Rue 30, Hamdallaye, Bamako",
    nbDossiers: 5,
    totalDu: 680_000,
    totalPaye: 4_200_000,
  },
  {
    id: "C-003",
    nom: "Aïssata Koné",
    type: "Particulier",
    telephone: "+223 90 11 22 33",
    email: "aissata.kone@orange.ml",
    adresse: "Magnambougou, Bamako",
    nbDossiers: 2,
    totalDu: 0,
    totalPaye: 1_350_000,
  },
  {
    id: "C-004",
    nom: "Groupe Keïta Distribution",
    type: "Entreprise",
    telephone: "+223 78 44 55 66",
    email: "direction@keita-group.ml",
    adresse: "Zone Industrielle, Ségou",
    nbDossiers: 11,
    totalDu: 920_000,
    totalPaye: 12_400_000,
  },
  {
    id: "C-005",
    nom: "Boutique Cissé Import",
    type: "Entreprise",
    telephone: "+223 67 77 88 99",
    email: "cisse.import@gmail.com",
    adresse: "Marché Médine, Bamako",
    nbDossiers: 3,
    totalDu: 350_000,
    totalPaye: 2_100_000,
  },
  {
    id: "C-006",
    nom: "Moussa Diarra",
    type: "Particulier",
    telephone: "+223 91 23 45 67",
    email: "moussa.diarra@yahoo.fr",
    adresse: "Kalaban Coura, Bamako",
    nbDossiers: 1,
    totalDu: 0,
    totalPaye: 780_000,
  },
  {
    id: "C-007",
    nom: "Sahel Agro Industries",
    type: "Entreprise",
    telephone: "+223 80 00 11 22",
    email: "contact@sahelagro.ml",
    adresse: "Route de Koulikoro, Bamako",
    nbDossiers: 6,
    totalDu: 0,
    totalPaye: 7_650_000,
  },
];

/* ------------------------------------------------------------------ */
/* DOSSIERS DE TRANSIT                                                  */
/* ------------------------------------------------------------------ */

export const dossiers: Dossier[] = [
  {
    id: "D-0042",
    reference: "SLTT-TR-2026-0042",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    bl: "BL-7821",
    camion: "RJ 4521 KM",
    nature: "Matériel électronique",
    droitDouane: 1_200_000,
    fraisCircuit: 450_000,
    fraisPrestation: 850_000,
    montantInvesti: 2_500_000,
    montantPaye: 1_800_000,
    statut: "En cours",
    date: "2026-01-08",
    dateEcheance: "2026-01-12",
    checklistDocs: ["bl", "facture-commerciale"],
    modeTransport: "Maritime",
    noConteneur: "MSCU4521789",
    portEntree: "Port de Dakar",
    poidsTotal: 12500,
    notes: "Conteneur 40 pieds, dédouanement en cours.",
  },
  {
    id: "D-0041",
    reference: "SLTT-TR-2026-0041",
    clientId: "C-004",
    clientNom: "Groupe Keïta Distribution",
    bl: "BL-7790",
    camion: "KN 8890 PQ",
    nature: "Sacs de ciment",
    droitDouane: 980_000,
    fraisCircuit: 320_000,
    fraisPrestation: 600_000,
    montantInvesti: 1_900_000,
    montantPaye: 1_900_000,
    statut: "Soldé",
    date: "2026-01-05",
    dateEcheance: "2026-01-10",
    dateDedouanement: "2026-01-08",
    checklistDocs: ["bl", "dau", "bad", "facture-commerciale", "colisage", "certif-origine", "assurance"],
  },
  {
    id: "D-0040",
    reference: "SLTT-TR-2026-0040",
    clientId: "C-002",
    clientNom: "Traoré & Frères Commerce",
    bl: "BL-7765",
    camion: "LM 3344 RT",
    nature: "Pièces automobiles",
    droitDouane: 1_500_000,
    fraisCircuit: 500_000,
    fraisPrestation: 900_000,
    montantInvesti: 2_900_000,
    montantPaye: 2_200_000,
    statut: "Dédouané",
    date: "2026-01-03",
    dateEcheance: "2026-01-11",
    dateDedouanement: "2026-01-10",
    checklistDocs: ["bl", "dau", "bad", "facture-commerciale", "colisage"],
    modeTransport: "Routier",
    portEntree: "Frontière Mali-Côte d'Ivoire",
    poidsTotal: 8200,
  },
  {
    id: "D-0039",
    reference: "SLTT-TR-2026-0039",
    clientId: "C-005",
    clientNom: "Boutique Cissé Import",
    bl: "BL-7740",
    camion: "OP 1199 MN",
    nature: "Textiles & vêtements",
    droitDouane: 600_000,
    fraisCircuit: 200_000,
    fraisPrestation: 350_000,
    montantInvesti: 1_150_000,
    montantPaye: 800_000,
    statut: "Livré",
    date: "2026-01-02",
    dateEcheance: "2026-01-09",
    dateDedouanement: "2026-01-06",
    checklistDocs: ["bl", "dau", "bad", "facture-commerciale", "colisage"],
  },
  {
    id: "D-0038",
    reference: "SLTT-TR-2026-0038",
    clientId: "C-007",
    clientNom: "Sahel Agro Industries",
    bl: "BL-7712",
    camion: "QR 5566 ST",
    nature: "Équipements agricoles",
    droitDouane: 2_100_000,
    fraisCircuit: 700_000,
    fraisPrestation: 1_200_000,
    montantInvesti: 4_000_000,
    montantPaye: 4_000_000,
    statut: "Soldé",
    date: "2025-12-28",
  },
  {
    id: "D-0037",
    reference: "SLTT-TR-2026-0037",
    clientId: "C-003",
    clientNom: "Aïssata Koné",
    bl: "BL-7688",
    camion: "UV 2233 WX",
    nature: "Électroménager",
    droitDouane: 450_000,
    fraisCircuit: 150_000,
    fraisPrestation: 300_000,
    montantInvesti: 900_000,
    montantPaye: 900_000,
    statut: "Soldé",
    date: "2025-12-22",
  },
  {
    id: "D-0036",
    reference: "SLTT-TR-2026-0036",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    bl: "BL-7655",
    camion: "RJ 4521 KM",
    nature: "Conserves alimentaires",
    droitDouane: 880_000,
    fraisCircuit: 280_000,
    fraisPrestation: 520_000,
    montantInvesti: 1_680_000,
    montantPaye: 1_300_000,
    statut: "En cours",
    date: "2025-12-18",
  },
  {
    id: "D-0035",
    reference: "SLTT-TR-2026-0035",
    clientId: "C-004",
    clientNom: "Groupe Keïta Distribution",
    bl: "BL-7621",
    camion: "KN 8890 PQ",
    nature: "Carburant & lubrifiants",
    droitDouane: 1_750_000,
    fraisCircuit: 560_000,
    fraisPrestation: 980_000,
    montantInvesti: 3_290_000,
    montantPaye: 2_900_000,
    statut: "Dédouané",
    date: "2025-12-15",
  },
  {
    id: "D-0034",
    reference: "SLTT-TR-2026-0034",
    clientId: "C-002",
    clientNom: "Traoré & Frères Commerce",
    bl: "BL-7599",
    camion: "LM 3344 RT",
    nature: "Matériel informatique",
    droitDouane: 1_320_000,
    fraisCircuit: 410_000,
    fraisPrestation: 720_000,
    montantInvesti: 2_450_000,
    montantPaye: 2_450_000,
    statut: "Soldé",
    date: "2025-12-10",
  },
  {
    id: "D-0033",
    reference: "SLTT-TR-2026-0033",
    clientId: "C-006",
    clientNom: "Moussa Diarra",
    bl: "BL-7570",
    camion: "YZ 7788 AB",
    nature: "Mobilier domestique",
    droitDouane: 380_000,
    fraisCircuit: 120_000,
    fraisPrestation: 280_000,
    montantInvesti: 780_000,
    montantPaye: 780_000,
    statut: "Soldé",
    date: "2025-12-05",
  },
];

/* ------------------------------------------------------------------ */
/* ÉCRITURES COMPTABLES                                                 */
/* ------------------------------------------------------------------ */

export const ecritures: Ecriture[] = [
  {
    id: "E-1001",
    date: "2026-01-08",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    dossierId: "D-0042",
    montantInvesti: 2_500_000,
    montantPaye: 1_800_000,
    modePaiement: "Virement",
    note: "Acompte dossier SLTT-TR-2026-0042",
  },
  {
    id: "E-1000",
    date: "2026-01-05",
    datePaiement: "2026-01-05",
    clientId: "C-004",
    clientNom: "Groupe Keïta Distribution",
    dossierId: "D-0041",
    montantInvesti: 1_900_000,
    montantPaye: 1_900_000,
    modePaiement: "Virement",
    note: "Solde dossier SLTT-TR-2026-0041",
  },
  {
    id: "E-0999",
    date: "2026-01-03",
    clientId: "C-002",
    clientNom: "Traoré & Frères Commerce",
    dossierId: "D-0040",
    montantInvesti: 2_900_000,
    montantPaye: 2_200_000,
    modePaiement: "Mobile Money",
    note: "Acompte dossier SLTT-TR-2026-0040",
  },
  {
    id: "E-0998",
    date: "2026-01-02",
    clientId: "C-005",
    clientNom: "Boutique Cissé Import",
    dossierId: "D-0039",
    montantInvesti: 1_150_000,
    montantPaye: 800_000,
    modePaiement: "Espèces",
    note: "Acompte dossier SLTT-TR-2026-0039",
  },
  {
    id: "E-0997",
    date: "2025-12-28",
    datePaiement: "2025-12-28",
    clientId: "C-007",
    clientNom: "Sahel Agro Industries",
    dossierId: "D-0038",
    montantInvesti: 4_000_000,
    montantPaye: 4_000_000,
    modePaiement: "Virement",
    note: "Solde dossier SLTT-TR-2026-0038",
  },
  {
    id: "E-0996",
    date: "2025-12-22",
    datePaiement: "2025-12-22",
    clientId: "C-003",
    clientNom: "Aïssata Koné",
    dossierId: "D-0037",
    montantInvesti: 900_000,
    montantPaye: 900_000,
    modePaiement: "Mobile Money",
    note: "Solde dossier SLTT-TR-2026-0037",
  },
  {
    id: "E-0995",
    date: "2025-12-18",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    dossierId: "D-0036",
    montantInvesti: 1_680_000,
    montantPaye: 1_300_000,
    modePaiement: "Chèque",
    note: "Acompte dossier SLTT-TR-2026-0036",
  },
  {
    id: "E-0994",
    date: "2025-12-15",
    clientId: "C-004",
    clientNom: "Groupe Keïta Distribution",
    dossierId: "D-0035",
    montantInvesti: 3_290_000,
    montantPaye: 2_900_000,
    modePaiement: "Virement",
    note: "Acompte dossier SLTT-TR-2026-0035",
  },
];

/* ------------------------------------------------------------------ */
/* STOCK & MOUVEMENTS                                                   */
/* ------------------------------------------------------------------ */

export const stock: StockItem[] = [
  {
    id: "S-01",
    marchandise: "Sacs de ciment 50kg",
    quantite: 420,
    unite: "sacs",
    seuil: 100,
    depositaire: "Entrepôt A — Bamako",
    commercial: "Amadou Traoré",
    sommePayee: 3_500_000,
    resteAPayer: 500_000,
  },
  {
    id: "S-02",
    marchandise: "Riz parfumé 25kg",
    quantite: 65,
    unite: "sacs",
    seuil: 80,
    depositaire: "Entrepôt B — Bamako",
    commercial: "Fatoumata Diallo",
    sommePayee: 2_200_000,
    resteAPayer: 0,
  },
  {
    id: "S-03",
    marchandise: "Huile végétale 20L",
    quantite: 180,
    unite: "bidons",
    seuil: 60,
    depositaire: "Entrepôt A — Bamako",
    commercial: "Amadou Traoré",
    sommePayee: 1_800_000,
    resteAPayer: 300_000,
  },
  {
    id: "S-04",
    marchandise: "Pièces automobiles diverses",
    quantite: 28,
    unite: "lots",
    seuil: 40,
    depositaire: "Entrepôt C — Ségou",
    commercial: "Ibrahim Keïta",
    sommePayee: 4_600_000,
    resteAPayer: 1_200_000,
  },
  {
    id: "S-05",
    marchandise: "Matériel électronique",
    quantite: 95,
    unite: "unités",
    seuil: 50,
    depositaire: "Entrepôt A — Bamako",
    commercial: "Fatoumata Diallo",
    sommePayee: 5_300_000,
    resteAPayer: 0,
  },
  {
    id: "S-06",
    marchandise: "Textiles & vêtements",
    quantite: 32,
    unite: "balles",
    seuil: 50,
    depositaire: "Entrepôt B — Bamako",
    commercial: "Ibrahim Keïta",
    sommePayee: 1_950_000,
    resteAPayer: 200_000,
  },
  {
    id: "S-07",
    marchandise: "Conserves alimentaires",
    quantite: 540,
    unite: "cartons",
    seuil: 150,
    depositaire: "Entrepôt A — Bamako",
    commercial: "Amadou Traoré",
    sommePayee: 2_850_000,
    resteAPayer: 1_000_000,
  },
];

export const mouvements: Mouvement[] = [
  {
    id: "M-021",
    date: "2026-01-09",
    type: "Sortie",
    marchandise: "Sacs de ciment 50kg",
    quantite: 80,
    unite: "sacs",
    responsable: "Oumar Cissé",
    bonRef: "BS-2026-0051",
  },
  {
    id: "M-020",
    date: "2026-01-08",
    type: "Entrée",
    marchandise: "Matériel électronique",
    quantite: 120,
    unite: "unités",
    responsable: "Oumar Cissé",
    bonRef: "—",
  },
  {
    id: "M-019",
    date: "2026-01-07",
    type: "Sortie",
    marchandise: "Huile végétale 20L",
    quantite: 30,
    unite: "bidons",
    responsable: "Oumar Cissé",
    bonRef: "BS-2026-0050",
  },
  {
    id: "M-018",
    date: "2026-01-05",
    type: "Entrée",
    marchandise: "Conserves alimentaires",
    quantite: 200,
    unite: "cartons",
    responsable: "Oumar Cissé",
  },
  {
    id: "M-017",
    date: "2026-01-03",
    type: "Sortie",
    marchandise: "Textiles & vêtements",
    quantite: 18,
    unite: "balles",
    responsable: "Oumar Cissé",
    bonRef: "BS-2026-0049",
  },
  {
    id: "M-016",
    date: "2025-12-30",
    type: "Entrée",
    marchandise: "Pièces automobiles diverses",
    quantite: 45,
    unite: "lots",
    responsable: "Oumar Cissé",
  },
  {
    id: "M-015",
    date: "2025-12-28",
    type: "Sortie",
    marchandise: "Riz parfumé 25kg",
    quantite: 35,
    unite: "sacs",
    responsable: "Oumar Cissé",
    bonRef: "BS-2026-0048",
  },
];

/* ------------------------------------------------------------------ */
/* BONS DE SORTIE                                                       */
/* ------------------------------------------------------------------ */

export const bonsSortie: BonSortie[] = [
  {
    id: "B-0051",
    reference: "BS-2026-0051",
    date: "2026-01-09",
    clientId: "C-004",
    clientNom: "Groupe Keïta Distribution",
    marchandise: "Sacs de ciment 50kg",
    quantite: 80,
    unite: "sacs",
    motif: "Vente",
    montant: 1_600_000,
    statut: "Validé",
  },
  {
    id: "B-0050",
    reference: "BS-2026-0050",
    date: "2026-01-07",
    clientId: "C-002",
    clientNom: "Traoré & Frères Commerce",
    marchandise: "Huile végétale 20L",
    quantite: 30,
    unite: "bidons",
    motif: "Vente",
    montant: 540_000,
    statut: "Validé",
  },
  {
    id: "B-0049",
    reference: "BS-2026-0049",
    date: "2026-01-03",
    clientId: "C-005",
    clientNom: "Boutique Cissé Import",
    marchandise: "Textiles & vêtements",
    quantite: 18,
    unite: "balles",
    motif: "Vente",
    montant: 720_000,
    statut: "Validé",
  },
  {
    id: "B-0048",
    reference: "BS-2026-0048",
    date: "2025-12-28",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    marchandise: "Riz parfumé 25kg",
    quantite: 35,
    unite: "sacs",
    motif: "Livraison",
    montant: 875_000,
    statut: "Validé",
  },
  {
    id: "B-0047",
    reference: "BS-2026-0047",
    date: "2025-12-20",
    clientId: "C-007",
    clientNom: "Sahel Agro Industries",
    marchandise: "Conserves alimentaires",
    quantite: 120,
    unite: "cartons",
    motif: "Transfert",
    montant: 1_440_000,
    statut: "Validé",
  },
];

/* ------------------------------------------------------------------ */
/* DEVIS                                                                */
/* ------------------------------------------------------------------ */

export type DevisStatut = "Brouillon" | "Envoyé" | "Accepté" | "Refusé" | "Expiré";

export interface Devis {
  id: string;
  reference: string;
  clientId: string;
  clientNom: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  total: number;
  statut: DevisStatut;
  dateCreation: string;
  dateValidite: string;
  notes?: string;
}

export interface DevisInput {
  clientId: string;
  clientNom: string;
  nature: string;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  dateValidite: string;
  notes?: string;
}

export const devis: Devis[] = [
  {
    id: "DV-001",
    reference: "DEVIS-2026-0001",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    nature: "Matériaux de construction (acier, ciment)",
    droitDouane: 1_200_000,
    fraisCircuit: 450_000,
    fraisPrestation: 320_000,
    total: 1_970_000,
    statut: "Envoyé",
    dateCreation: "2026-01-05",
    dateValidite: "2026-02-05",
    notes: "Lot de 20 conteneurs — port de Dakar via Bamako",
  },
  {
    id: "DV-002",
    reference: "DEVIS-2026-0002",
    clientId: "C-004",
    clientNom: "Groupe Keïta International",
    nature: "Équipements agricoles",
    droitDouane: 850_000,
    fraisCircuit: 310_000,
    fraisPrestation: 195_000,
    total: 1_355_000,
    statut: "Accepté",
    dateCreation: "2025-12-20",
    dateValidite: "2026-01-20",
  },
  {
    id: "DV-003",
    reference: "DEVIS-2026-0003",
    clientId: "C-002",
    clientNom: "Traoré Frères SARL",
    nature: "Produits alimentaires (riz, sucre)",
    droitDouane: 620_000,
    fraisCircuit: 230_000,
    fraisPrestation: 145_000,
    total: 995_000,
    statut: "Brouillon",
    dateCreation: "2026-01-08",
    dateValidite: "2026-02-08",
  },
];

/* ------------------------------------------------------------------ */
/* UTILISATEURS                                                         */
/* ------------------------------------------------------------------ */

export const users: User[] = [
  {
    id: "U-01",
    nom: "Amadou Traoré",
    email: "amadou.traore@sltt.ml",
    role: "Administrateur",
    permissions: ["dossiers:read", "dossiers:write", "dossiers:transition", "comptabilite:read", "comptabilite:write", "clients:read", "clients:write", "stock:read", "stock:write", "bons:read", "bons:write", "parametres:read", "parametres:write", "rapports:read"],
    // hash PBKDF2(SHA-256, salt="sltt-app-salt-v1", 100000 iters) de "sltt2026"
    motDePasse: "ad240c669b96636242920fef8d26db72173e9d1f5349724ad89ea4076ffc001a",
    actif: true,
    derniereConnexion: "2026-01-09T08:12:00",
  },
  {
    id: "U-02",
    nom: "Fatoumata Diallo",
    email: "fatoumata.diallo@sltt.ml",
    role: "Comptable",
    permissions: ["dossiers:read", "comptabilite:read", "comptabilite:write", "clients:read", "rapports:read"],
    // hash PBKDF2 de "compta2026"
    motDePasse: "839bd3abfb4807a81ba36613c4d0f0dd7061845cc477572f4f773e5abbeb6a96",
    actif: true,
    derniereConnexion: "2026-01-08T17:40:00",
  },
  {
    id: "U-03",
    nom: "Ibrahim Keïta",
    email: "ibrahim.keita@sltt.ml",
    role: "Agent de transit",
    permissions: ["dossiers:read", "dossiers:write", "dossiers:transition", "clients:read"],
    // hash PBKDF2 de "transit2026"
    motDePasse: "9f8de6d7d9e2e9513da1f0ff756011e145b71d4271a127e7c490105df0cc98c0",
    actif: true,
    derniereConnexion: "2026-01-09T09:05:00",
  },
  {
    id: "U-04",
    nom: "Oumar Cissé",
    email: "oumar.cisse@sltt.ml",
    role: "Magasinier",
    permissions: ["stock:read", "stock:write", "bons:read", "bons:write"],
    // hash PBKDF2 de "stock2026"
    motDePasse: "88af7c47fe4acbbd6ba745c17c5052c548b1a621d97067774eb371184342dea8",
    actif: true,
    derniereConnexion: "2026-01-07T16:20:00",
  },
  {
    id: "U-05",
    nom: "Aminata Sangaré",
    email: "aminata.sangare@sltt.ml",
    role: "Commercial",
    permissions: ["clients:read", "clients:write", "bons:read", "dossiers:read"],
    // hash PBKDF2 de "sales2026"
    motDePasse: "c7cb19cbaa2f12ffc04ec1b764cd24add8afb0c981d12c18d66fdb8056d0375f",
    actif: false,
    derniereConnexion: "2025-12-15T11:00:00",
  },
  {
    id: "U-06",
    nom: "Mody Barry",
    email: "modybarry50@gmail.com",
    role: "Administrateur",
    permissions: ["dossiers:read", "dossiers:write", "dossiers:transition", "comptabilite:read", "comptabilite:write", "clients:read", "clients:write", "stock:read", "stock:write", "bons:read", "bons:write", "parametres:read", "parametres:write", "rapports:read"],
    motDePasse: "2480e9698e06e086e74f2ba4df489848ddca9748ff136bf23d09a4038d3aaa1f",
    actif: true,
    derniereConnexion: "2026-01-09T08:12:00",
  },
  {
    id: "U-07",
    nom: "Mohammed Traoré",
    email: "mohammedtraore301@gmail.com",
    role: "Administrateur",
    permissions: ["dossiers:read", "dossiers:write", "dossiers:transition", "comptabilite:read", "comptabilite:write", "clients:read", "clients:write", "stock:read", "stock:write", "bons:read", "bons:write", "parametres:read", "parametres:write", "rapports:read"],
    motDePasse: "2480e9698e06e086e74f2ba4df489848ddca9748ff136bf23d09a4038d3aaa1f",
    actif: true,
    derniereConnexion: "2026-01-09T08:12:00",
  },
];

/* ------------------------------------------------------------------ */
/* TRANSPORTEURS                                                        */
/* ------------------------------------------------------------------ */

export type TransporteurStatut = "Actif" | "Inactif";
export type TypeVehicule = "Camion" | "Remorque" | "Semi-remorque" | "Benne" | "Fourgon";

export interface Transporteur {
  id: string;
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  vehicule: TypeVehicule;
  immatriculation: string;
  trajet: string;
  capacite: number;
  statut: TransporteurStatut;
  nbDossiers: number;
  dateCreation: string;
  notes?: string;
}

export interface TransporteurInput {
  nom: string;
  contact: string;
  telephone: string;
  email?: string;
  vehicule: TypeVehicule;
  immatriculation: string;
  trajet: string;
  capacite: number;
  statut: TransporteurStatut;
  notes?: string;
}

export const transporteurs: Transporteur[] = [
  {
    id: "TRP-001",
    nom: "Société Konaté Transport",
    contact: "Mamadou Konaté",
    telephone: "+223 76 12 34 56",
    email: "konate.transport@mail.ml",
    vehicule: "Semi-remorque",
    immatriculation: "BK-0845-ML",
    trajet: "Bamako – Dakar",
    capacite: 30,
    statut: "Actif",
    nbDossiers: 12,
    dateCreation: "2025-03-15",
    notes: "Partenaire fiable, délais respectés",
  },
  {
    id: "TRP-002",
    nom: "Diarra & Frères Logistique",
    contact: "Seydou Diarra",
    telephone: "+223 66 98 77 44",
    vehicule: "Camion",
    immatriculation: "BK-2210-ML",
    trajet: "Bamako – Abidjan",
    capacite: 20,
    statut: "Actif",
    nbDossiers: 8,
    dateCreation: "2025-05-01",
  },
  {
    id: "TRP-003",
    nom: "Trans-Sahel SARL",
    contact: "Aliou Coulibaly",
    telephone: "+223 79 55 22 11",
    email: "transahel@sltt.ml",
    vehicule: "Remorque",
    immatriculation: "BK-3301-ML",
    trajet: "Bamako – Conakry",
    capacite: 25,
    statut: "Actif",
    nbDossiers: 5,
    dateCreation: "2025-07-20",
  },
  {
    id: "TRP-004",
    nom: "Touré Express Fret",
    contact: "Kadiatou Touré",
    telephone: "+223 65 40 33 99",
    vehicule: "Fourgon",
    immatriculation: "BK-1155-ML",
    trajet: "Local Bamako",
    capacite: 5,
    statut: "Actif",
    nbDossiers: 20,
    dateCreation: "2024-11-10",
    notes: "Spécialisé livraisons urbaines",
  },
  {
    id: "TRP-005",
    nom: "Sidibé Camions Lourds",
    contact: "Boubacar Sidibé",
    telephone: "+223 72 88 66 00",
    vehicule: "Benne",
    immatriculation: "BK-0092-ML",
    trajet: "Bamako – Niamey",
    capacite: 35,
    statut: "Inactif",
    nbDossiers: 3,
    dateCreation: "2025-01-08",
    notes: "Véhicule en maintenance",
  },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                              */
/* ------------------------------------------------------------------ */

/** Calcule l'écart = fraisPrestation - montantInvesti (positif = bénéfice) */
export function calculerEcart(d: {
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
}): number {
  // L'écart représente la marge : prestation perçue - coûts engagés
  return d.fraisPrestation - (d.droitDouane + d.fraisCircuit);
}

export function resteAPayer(d: {
  montantInvesti: number;
  montantPaye: number;
}): number {
  return Math.max(0, d.montantInvesti - d.montantPaye);
}

