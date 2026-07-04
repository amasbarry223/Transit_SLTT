"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useNav } from "@/lib/nav-store";
import { supabase } from "@/lib/supabase";
import {
  clients as seedClients,
  dossiers as seedDossiers,
  ecritures as seedEcritures,
  stock as seedStock,
  mouvements as seedMouvements,
  bonsSortie as seedBons,
  users as seedUsers,
  subDossiers as seedSubDossiers,
  fichiers as seedFichiers,
  devis as seedDevis,
  dossierComments as seedComments,
  transporteurs as seedTransporteurs,
  type Client,
  type Dossier,
  type DossierStatut,
  type Ecriture,
  type PaiementMode,
  type StockItem,
  type Mouvement,
  type BonSortie,
  type BonMotif,
  type User,
  type UserRole,
  type SubDossier,
  type DossierFichier,
  type Devis,
  type DevisStatut,
  type DevisInput,
  type DossierComment,
  type Transporteur,
  type TransporteurInput,
  type TransporteurStatut,
  type TypeVehicule,
  type Fournisseur,
  type FournisseurInput,
  type FournisseurType,
  type FournisseurStatut,
  type DossierFournisseur,
  type DossierFournisseurInput,
  fournisseurs as seedFournisseurs,
  dossierFournisseurs as seedDossierFournisseurs,
  CHECKLIST_DOCS,
} from "@/lib/mock-data";

export {
  CHECKLIST_DOCS,
};

export type {
  Fournisseur,
  FournisseurInput,
  FournisseurType,
  FournisseurStatut,
  DossierFournisseur,
  DossierFournisseurInput,
  Client,
  Dossier,
  DossierStatut,
  Ecriture,
  PaiementMode,
  StockItem,
  Mouvement,
  BonSortie,
  BonMotif,
  User,
  UserRole,
  SubDossier,
  DossierFichier,
  Devis,
  DevisStatut,
  DevisInput,
  DossierComment,
  Transporteur,
  TransporteurInput,
  TransporteurStatut,
  TypeVehicule,
};

export type AuditAction =
  | "Connexion"
  | "Création"
  | "Modification"
  | "Validation"
  | "Paiement"
  | "Export"
  | "Suppression";

export type AuditModule =
  | "Authentification"
  | "Dossiers"
  | "Comptabilité"
  | "Factures"
  | "Stock"
  | "Bons"
  | "Clients"
  | "Transporteurs"
  | "Fournisseurs"
  | "Utilisateurs";

export type FactureStatut = "Brouillon" | "Envoyée" | "Partielle" | "Soldée" | "Annulée";

export interface FactureLigne {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

export interface Facture {
  id: string;
  numero: string;
  dossierId: string | null;
  clientId: string;
  clientNom: string;
  date: string;
  dateEcheance: string;
  statut: FactureStatut;
  lignes: FactureLigne[];
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantPaye: number;
  notes: string;
  creePar: string;
  creeLe: string;
}

export interface FactureInput {
  dossierId?: string | null;
  clientId: string;
  clientNom: string;
  date: string;
  dateEcheance: string;
  lignes: Array<{ description: string; quantite: number; prixUnitaire: number }>;
  tauxTVA: number;
  notes: string;
}

// LOGIC-12 (audit) : seul module sans aucune donnée de démo — un compte neuf
// affichait un écran vide qu'on pouvait confondre avec un bug. 3 factures
// liées à des dossiers seed réels (D-0041/D-0042/D-0040) + 1 facture hors
// dossier, sur les 4 statuts non-brouillon/annulé possibles.
const seedFactures: Facture[] = [
  {
    id: "FACT-0001",
    numero: "SLTT-FACT-2026-0001",
    dossierId: "D-0041",
    clientId: "C-004",
    clientNom: "Groupe Keïta Distribution",
    date: "2026-01-09",
    dateEcheance: "2026-02-08",
    statut: "Soldée",
    lignes: [
      { id: "FACT-0001-L1", description: "Frais de prestation — SLTT-TR-2026-0041 (Sacs de ciment)", quantite: 1, prixUnitaire: 600_000, montantHT: 600_000 },
      { id: "FACT-0001-L2", description: "Droits de douane", quantite: 1, prixUnitaire: 980_000, montantHT: 980_000 },
      { id: "FACT-0001-L3", description: "Frais de circuit", quantite: 1, prixUnitaire: 320_000, montantHT: 320_000 },
    ],
    tauxTVA: 18,
    montantHT: 1_900_000,
    montantTVA: 342_000,
    montantTTC: 2_242_000,
    montantPaye: 2_242_000,
    notes: "",
    creePar: "Fatoumata Diallo",
    creeLe: "2026-01-09T09:30:00.000Z",
  },
  {
    id: "FACT-0002",
    numero: "SLTT-FACT-2026-0002",
    dossierId: "D-0042",
    clientId: "C-001",
    clientNom: "Société des Établissements Diallo",
    date: "2026-01-10",
    dateEcheance: "2026-02-09",
    statut: "Partielle",
    lignes: [
      { id: "FACT-0002-L1", description: "Frais de prestation — SLTT-TR-2026-0042 (Matériel électronique)", quantite: 1, prixUnitaire: 850_000, montantHT: 850_000 },
      { id: "FACT-0002-L2", description: "Droits de douane", quantite: 1, prixUnitaire: 1_200_000, montantHT: 1_200_000 },
      { id: "FACT-0002-L3", description: "Frais de circuit", quantite: 1, prixUnitaire: 450_000, montantHT: 450_000 },
    ],
    tauxTVA: 18,
    montantHT: 2_500_000,
    montantTVA: 450_000,
    montantTTC: 2_950_000,
    montantPaye: 1_500_000,
    notes: "",
    creePar: "Fatoumata Diallo",
    creeLe: "2026-01-10T10:15:00.000Z",
  },
  {
    id: "FACT-0003",
    numero: "SLTT-FACT-2026-0003",
    dossierId: "D-0040",
    clientId: "C-002",
    clientNom: "Traoré & Frères Commerce",
    date: "2026-01-11",
    dateEcheance: "2026-02-10",
    statut: "Envoyée",
    lignes: [
      { id: "FACT-0003-L1", description: "Frais de prestation — SLTT-TR-2026-0040 (Pièces automobiles)", quantite: 1, prixUnitaire: 900_000, montantHT: 900_000 },
      { id: "FACT-0003-L2", description: "Droits de douane", quantite: 1, prixUnitaire: 1_500_000, montantHT: 1_500_000 },
      { id: "FACT-0003-L3", description: "Frais de circuit", quantite: 1, prixUnitaire: 500_000, montantHT: 500_000 },
    ],
    tauxTVA: 18,
    montantHT: 2_900_000,
    montantTVA: 522_000,
    montantTTC: 3_422_000,
    montantPaye: 0,
    notes: "",
    creePar: "Amadou Traoré",
    creeLe: "2026-01-11T14:00:00.000Z",
  },
  {
    id: "FACT-0004",
    numero: "SLTT-FACT-2026-0004",
    dossierId: null,
    clientId: "C-005",
    clientNom: "Boutique Cissé Import",
    date: "2026-01-12",
    dateEcheance: "2026-02-11",
    statut: "Brouillon",
    lignes: [
      { id: "FACT-0004-L1", description: "Prestation de courtage — hors dossier", quantite: 1, prixUnitaire: 180_000, montantHT: 180_000 },
    ],
    tauxTVA: 18,
    montantHT: 180_000,
    montantTVA: 32_400,
    montantTTC: 212_400,
    montantPaye: 0,
    notes: "",
    creePar: "Amadou Traoré",
    creeLe: "2026-01-12T08:45:00.000Z",
  },
];

export type AuditEntry = {
  id: string;
  date: string;
  user: string;
  module: AuditModule;
  action: AuditAction;
  detail: string;
  ip: string;
};

export interface DossierInput {
  clientId: string;
  clientNom: string;
  nature: string;
  bl: string;
  camion: string;
  date: string;
  dateEcheance?: string;
  dateDedouanement?: string;
  modeTransport?: "Maritime" | "Aérien" | "Routier" | "Ferroviaire";
  noConteneur?: string;
  portEntree?: string;
  poidsTotal?: number;
  droitDouane: number;
  fraisCircuit: number;
  fraisPrestation: number;
  montantInvesti: number;
  statut: DossierStatut;
  notes?: string;
}

export interface ClientInput {
  nom: string;
  type: Client["type"];
  telephone: string;
  email: string;
  adresse: string;
}

export interface BonInput {
  date: string;
  clientId: string;
  clientNom: string;
  stockId?: string;
  marchandise: string;
  quantite: number;
  unite: string;
  motif: BonMotif;
  montant: number;
  statut?: "Validé" | "Brouillon";
}

export interface StockItemInput {
  marchandise: string;
  quantite: number;
  unite: string;
  seuil: number;
  depositaire: string;
  commercial: string;
  sommePayee: number;
  resteAPayer: number;
}

export interface SubDossierInput {
  dossierId: string;
  nom: string;
  description?: string;
}

export interface FichierInput {
  dossierId: string;
  sousDossierId?: string;
  nom: string;
  taille: number;
  type: string;
  dataUrl: string;
}

export interface UserInput {
  nom: string;
  email: string;
  role: UserRole;
  permissions: string[];
  motDePasse?: string;
}

/* ------------------------------------------------------------------ */
/* SUPABASE MAPPING HELPERS                                            */
/* ------------------------------------------------------------------ */

function mapClientFromDb(x: any): Client {
  return {
    id: x.id,
    nom: x.nom,
    type: x.type,
    telephone: x.telephone,
    email: x.email,
    adresse: x.adresse,
    nbDossiers: 0,
    totalDu: 0,
    totalPaye: 0,
  };
}

function mapDossierFromDb(x: any): Dossier {
  return {
    id: x.id,
    reference: x.reference,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    bl: x.bl,
    camion: x.camion,
    nature: x.nature,
    droitDouane: Number(x.droit_douane),
    fraisCircuit: Number(x.frais_circuit),
    fraisPrestation: Number(x.frais_prestation),
    montantInvesti: Number(x.montant_investi),
    montantPaye: Number(x.montant_paye),
    statut: x.statut,
    date: x.date,
    dateEcheance: x.date_echeance,
    dateDedouanement: x.date_dedouanement,
    checklistDocs: x.checklist_docs || [],
    modeTransport: x.mode_transport,
    noConteneur: x.no_conteneur,
    portEntree: x.port_entree,
    poidsTotal: x.poids_total ? Number(x.poids_total) : undefined,
    notes: x.notes,
  };
}

function mapFournisseurFromDb(x: any): Fournisseur {
  return {
    id: x.id,
    nom: x.nom,
    type: x.type,
    contact: x.contact,
    telephone: x.telephone,
    email: x.email || "",
    adresse: x.adresse || "",
    tarifContractuel: x.tarif_contractuel ? Number(x.tarif_contractuel) : undefined,
    nbDossiers: 0,
    montantTotal: 0,
    statut: x.statut,
  };
}

function mapDossierFournisseurFromDb(x: any): DossierFournisseur {
  return {
    id: x.id,
    dossierId: x.dossier_id,
    dossierRef: x.dossiers?.reference || undefined,
    fournisseurId: x.fournisseur_id,
    fournisseurNom: x.fournisseurs?.nom || "",
    type: x.fournisseurs?.type || "Transport",
    description: x.description,
    montantBudgete: Number(x.montant_budgete),
    montantReel: Number(x.montant_reel),
    statut: x.statut,
    date: x.date || new Date().toISOString().slice(0, 10),
  };
}

function mapEcritureFromDb(x: any): Ecriture {
  return {
    id: x.id,
    date: x.date,
    datePaiement: x.date_paiement || undefined,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "",
    dossierId: x.dossier_id || undefined,
    montantInvesti: Number(x.montant_investi || 0),
    montantPaye: Number(x.montant_paye || 0),
    modePaiement: x.mode_paiement || "Virement",
    note: x.note || undefined,
  };
}

function mapStockItemFromDb(x: any): StockItem {
  return {
    id: x.id,
    marchandise: x.marchandise,
    quantite: Number(x.quantite),
    unite: x.unite,
    seuil: Number(x.seuil),
    depositaire: x.depositaire,
    commercial: x.commercial,
    sommePayee: Number(x.somme_payee),
    resteAPayer: Number(x.reste_a_payer),
  };
}

function mapMouvementFromDb(x: any): Mouvement {
  return {
    id: x.id,
    date: x.date,
    type: x.type,
    marchandise: x.marchandise || "",
    quantite: Number(x.quantite),
    unite: x.unite || "",
    responsable: x.responsable || "",
    bonRef: x.bon_ref || undefined,
  };
}

function mapBonFromDb(x: any): BonSortie {
  return {
    id: x.id,
    reference: x.numero,
    date: x.date,
    clientId: x.client_id,
    clientNom: x.client_nom,
    stockId: x.stock_id || undefined,
    marchandise: x.marchandise,
    quantite: Number(x.quantite),
    unite: x.unite,
    motif: x.motif,
    montant: Number(x.montant),
    statut: x.statut,
  };
}

function mapSubDossierFromDb(x: any): SubDossier {
  return {
    id: x.id,
    dossierId: x.dossier_id,
    nom: x.nom,
    description: x.description,
    dateCreation: x.date_creation || new Date().toISOString(),
  };
}

function mapFichierFromDb(x: any): DossierFichier {
  return {
    id: x.id,
    dossierId: x.dossier_id,
    sousDossierId: x.sub_dossier_id,
    nom: x.nom,
    taille: Number(x.taille),
    type: x.type,
    dateUpload: x.date_upload || new Date().toISOString(),
    dataUrl: x.data_url,
  };
}

function mapCommentFromDb(x: any): DossierComment {
  return {
    id: x.id,
    dossierId: x.dossier_id,
    texte: x.texte,
    userName: x.user_nom || "",
    date: x.created_at || new Date().toISOString(),
  };
}

function mapDevisFromDb(x: any): Devis {
  return {
    id: x.id,
    reference: x.reference,
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    nature: x.nature,
    droitDouane: Number(x.droit_douane),
    fraisCircuit: Number(x.frais_circuit),
    fraisPrestation: Number(x.frais_prestation),
    total: Number(x.total),
    statut: x.statut,
    dateCreation: x.date_creation,
    dateValidite: x.date_validite,
    notes: x.notes || undefined,
  };
}

function mapTransporteurFromDb(x: any): Transporteur {
  return {
    id: x.id,
    nom: x.nom,
    contact: x.contact || "",
    telephone: x.telephone,
    email: x.email || undefined,
    vehicule: x.vehicule,
    immatriculation: x.immatriculation,
    trajet: x.trajet || "",
    capacite: x.capacite ? Number(x.capacite) : 0,
    statut: x.statut,
    nbDossiers: 0,
    dateCreation: x.date_creation || new Date().toISOString().slice(0, 10),
    notes: x.notes || undefined,
  };
}

function mapFactureFromDb(x: any): Facture {
  return {
    id: x.id,
    numero: x.numero,
    dossierId: x.dossier_id,
    clientId: x.client_id,
    clientNom: x.client_nom,
    date: x.date,
    dateEcheance: x.date_echeance,
    statut: x.statut,
    tauxTVA: Number(x.taux_tva),
    montantHT: Number(x.montant_ht),
    montantTVA: Number(x.montant_tva),
    montantTTC: Number(x.montant_ttc),
    montantPaye: Number(x.montant_paye),
    notes: x.notes,
    creePar: x.cree_par,
    creeLe: x.created_at,
    lignes: (x.facture_lignes || []).map((l: any) => ({
      id: l.id,
      description: l.description,
      quantite: Number(l.quantite),
      prixUnitaire: Number(l.prix_unitaire),
      montantHT: Number(l.montant_ht),
    })),
  };
}

function mapProfileFromDb(x: any): User {
  return {
    id: x.id,
    nom: x.nom,
    email: x.email,
    role: x.role,
    permissions: x.permissions || [],
    actif: x.actif,
    derniereConnexion: x.derniere_connexion || "",
    motDePasse: "",
  };
}

function mapAuditLogFromDb(x: any): AuditEntry {
  return {
    id: x.id,
    date: x.created_at,
    user: x.user_nom,
    module: x.module,
    action: x.action,
    detail: x.detail,
    ip: x.ip,
  };
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function findStockForBon(stock: StockItem[], ref: { stockId?: string; marchandise: string }): StockItem | undefined {
  if (ref.stockId) return stock.find((s) => s.id === ref.stockId);
  return stock.find((s) => s.marchandise === ref.marchandise);
}

// LOGIC-05 (audit) : totalPaye doit refléter Écritures ET Factures — ce sont
// deux canaux de paiement indépendants (payer une facture ne touche jamais
// une écriture, cf. recordFacturePaiement) donc additifs, pas redondants.
// Sans les Factures ici, ce champ dénormalisé divergeait silencieusement du
// total "réconcilié" affiché sur la fiche client (client-fiche.tsx).
function syncClientStats(dossiers: Dossier[], factures: Facture[], clients: Client[]): Client[] {
  return clients.map((c) => {
    const cd = dossiers.filter((d) => d.clientId === c.id);
    const cf = factures.filter((f) => f.clientId === c.id);
    return {
      ...c,
      nbDossiers: cd.length,
      totalPaye: cd.reduce((s, d) => s + d.montantPaye, 0) + cf.reduce((s, f) => s + f.montantPaye, 0),
      totalDu: cd.reduce((s, d) => s + Math.max(0, d.montantInvesti - d.montantPaye), 0),
    };
  });
}

/** Retire l'apport d'une liste de DossierFournisseur des agrégats du Fournisseur parent (LOGIC-04). */
function decrementFournisseurAgg(fournisseurs: Fournisseur[], removed: DossierFournisseur[]): Fournisseur[] {
  if (removed.length === 0) return fournisseurs;
  const deltaByFournisseur = new Map<string, { count: number; montant: number }>();
  for (const df of removed) {
    const prev = deltaByFournisseur.get(df.fournisseurId) ?? { count: 0, montant: 0 };
    deltaByFournisseur.set(df.fournisseurId, { count: prev.count + 1, montant: prev.montant + df.montantReel });
  }
  return fournisseurs.map((f) => {
    const delta = deltaByFournisseur.get(f.id);
    if (!delta) return f;
    return {
      ...f,
      nbDossiers: Math.max(0, f.nbDossiers - delta.count),
      montantTotal: Math.max(0, f.montantTotal - delta.montant),
    };
  });
}

function syncFournisseurStats(df: DossierFournisseur[], providers: Fournisseur[]): Fournisseur[] {
  return providers.map((p) => {
    const pdf = df.filter((x) => x.fournisseurId === p.id);
    return {
      ...p,
      nbDossiers: pdf.length,
      montantTotal: pdf.reduce((sum, item) => sum + item.montantReel, 0),
    };
  });
}

function getConnectedUserName(): string {
  return useNav.getState().currentUserName || "Système";
}

interface SLTTState {
  // Data
  clients: Client[];
  dossiers: Dossier[];
  ecritures: Ecriture[];
  stock: StockItem[];
  mouvements: Mouvement[];
  bons: BonSortie[];
  users: User[];
  subDossiers: SubDossier[];
  fichiers: DossierFichier[];
  auditLogs: AuditEntry[];
  comments: DossierComment[];
  devis: Devis[];
  transporteurs: Transporteur[];
  factures: Facture[];
  fournisseurs: Fournisseur[];
  dossierFournisseurs: DossierFournisseur[];

  // Counters for local reference fallback
  dossierSeq: number;
  bonSeq: number;
  auditSeq: number;
  ecritureSeq: number;
  clientSeq: number;
  stockSeq: number;
  userSeq: number;
  mouvementSeq: number;
  subDossierSeq: number;
  fichierSeq: number;
  devisSeq: number;
  transporteurSeq: number;
  commentSeq: number;
  factureSeq: number;
  fournisseurSeq: number;
  dossierFournisseurSeq: number;

  // Supabase sync
  fetchData: () => Promise<void>;

  // ---- Audit ----
  addAuditLog: (module: AuditModule, action: AuditAction, detail: string) => Promise<void>;

  // ---- Dossiers ----
  addDossier: (input: DossierInput) => Promise<Dossier>;
  updateDossier: (id: string, input: DossierInput) => Promise<void>;
  updateDossierChecklist: (dossierId: string, docId: string, checked: boolean) => Promise<void>;
  removeDossier: (id: string) => Promise<void>;
  getDossier: (id: string) => Dossier | undefined;
  transitionDossier: (id: string, newStatut: DossierStatut, montantRecu?: number, modePaiement?: PaiementMode, transitionNote?: string) => Promise<void>;

  // ---- Clients ----
  addClient: (input: ClientInput) => Promise<Client>;
  updateClient: (id: string, input: ClientInput) => Promise<void>;
  getClient: (id: string) => Client | undefined;

  // ---- Comptabilité ----
  recordPayment: (
    ecritureId: string,
    montant: number,
    mode: PaiementMode,
    date: string,
    note: string,
  ) => Promise<void>;
  addEcriture: (e: Omit<Ecriture, "id">) => Promise<Ecriture>;

  // ---- Stock ----
  addStockItem: (input: StockItemInput) => Promise<StockItem>;
  addStockEntry: (stockId: string, quantite: number, responsable: string) => Promise<void>;
  addStockExit: (stockId: string, quantite: number, responsable: string, bonRef?: string) => Promise<void>;

  // ---- Bons de sortie ----
  addBon: (input: BonInput) => Promise<BonSortie>;
  validateBon: (id: string) => Promise<boolean>;

  // ---- Users ----
  addUser: (input: UserInput) => Promise<User>;
  updateUser: (id: string, input: UserInput) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  updateLastLogin: (id: string) => Promise<void>;

  // ---- Sous-dossiers ----
  addSubDossier: (input: SubDossierInput) => Promise<SubDossier>;
  updateSubDossier: (id: string, nom: string, description?: string) => Promise<void>;
  deleteSubDossier: (id: string) => Promise<void>;

  // ---- Fichiers ----
  addFichier: (input: FichierInput) => Promise<DossierFichier>;
  deleteFichier: (id: string) => Promise<void>;
  deleteFichiersByDossier: (dossierId: string) => Promise<void>;

  // ---- Commentaires dossiers ----
  addComment: (dossierId: string, texte: string) => Promise<DossierComment>;
  deleteComment: (id: string) => Promise<void>;

  // ---- Devis ----
  addDevis: (input: DevisInput) => Promise<Devis>;
  updateDevis: (id: string, input: DevisInput) => Promise<void>;
  updateDevisStatut: (id: string, statut: DevisStatut) => Promise<void>;
  expireDevisObsoletes: () => Promise<void>;
  convertDevisToDossier: (id: string) => Promise<Dossier | null>;
  removeDevis: (id: string) => Promise<void>;

  // ---- Transporteurs ----
  addTransporteur: (input: TransporteurInput) => Promise<Transporteur>;
  updateTransporteur: (id: string, input: TransporteurInput) => Promise<void>;
  updateTransporteurStatut: (id: string, statut: TransporteurStatut) => Promise<void>;
  removeTransporteur: (id: string) => Promise<void>;

  // ---- Factures ----
  addFacture: (input: FactureInput) => Promise<Facture>;
  updateFacture: (id: string, input: FactureInput) => Promise<void>;
  removeFacture: (id: string) => Promise<void>;
  updateFactureStatut: (id: string, statut: FactureStatut) => Promise<void>;
  recordFacturePaiement: (id: string, montant: number) => Promise<void>;

  // ---- Fournisseurs ----
  addFournisseur: (input: FournisseurInput) => Promise<Fournisseur>;
  updateFournisseur: (id: string, input: FournisseurInput) => Promise<void>;
  removeFournisseur: (id: string) => Promise<void>;
  addDossierFournisseur: (input: DossierFournisseurInput) => Promise<DossierFournisseur>;
  updateDossierFournisseur: (id: string, input: Partial<DossierFournisseurInput>) => Promise<void>;
  removeDossierFournisseur: (id: string) => Promise<void>;

  resetAll: () => void;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

const INITIAL_SEQUENCES = {
  dossierSeq: 43,
  bonSeq: 52,
  auditSeq: 7,
  ecritureSeq: 1010,
  clientSeq: 8,
  stockSeq: 8,
  userSeq: 6,
  mouvementSeq: 22,
  subDossierSeq: 1,
  fichierSeq: 1,
  devisSeq: 4,
  transporteurSeq: 6,
  commentSeq: 1,
  factureSeq: 5,
  fournisseurSeq: 6,
  dossierFournisseurSeq: 5,
} as const;

const initialAuditLogs: AuditEntry[] = [
  { id: "A-001", date: "2026-01-09T09:05:00", user: "Ibrahim Keïta", module: "Dossiers", action: "Création", detail: "Dossier DOS-2026-0142 créé — Client SEDIM SA", ip: "154.66.12.7" },
  { id: "A-002", date: "2026-01-09T08:45:00", user: "Fatoumata Diallo", module: "Comptabilité", action: "Paiement", detail: "Paiement 850 000 FCFA — Écriture EC-2026-0089", ip: "41.202.18.50" },
  { id: "A-003", date: "2026-01-09T08:12:00", user: "Amadou Traoré", module: "Authentification", action: "Connexion", detail: "Connexion réussie depuis Chrome · Windows", ip: "41.202.18.45" },
  { id: "A-004", date: "2026-01-08T17:40:00", user: "Fatoumata Diallo", module: "Authentification", action: "Connexion", detail: "Connexion réussie depuis Firefox · macOS", ip: "41.202.18.50" },
  { id: "A-005", date: "2026-01-08T16:22:00", user: "Oumar Cissé", module: "Stock", action: "Modification", detail: "Sortie 120 sacs — Riz parfumé (entrepôt A)", ip: "41.202.18.61" },
  { id: "A-006", date: "2026-01-08T14:10:00", user: "Amadou Traoré", module: "Bons", action: "Validation", detail: "Bon BS-2026-0048 validé — Vente", ip: "41.202.18.45" },
];

export const useStore = create<SLTTState>()(
  persist(
    (set, get) => ({
      clients: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedClients,
      dossiers: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedDossiers,
      ecritures: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedEcritures,
      stock: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedStock,
      mouvements: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedMouvements,
      bons: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedBons,
      users: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedUsers,
      subDossiers: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedSubDossiers,
      fichiers: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedFichiers,
      devis: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedDevis,
      comments: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedComments,
      transporteurs: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedTransporteurs,
      factures: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedFactures,
      fournisseurs: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedFournisseurs,
      dossierFournisseurs: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : seedDossierFournisseurs,
      auditLogs: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? [] : initialAuditLogs,
      ...INITIAL_SEQUENCES,

      fetchData: async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
        try {
          const [
            { data: clients },
            { data: dossiers },
            { data: ecritures },
            { data: stock },
            { data: mouvements },
            { data: bons },
            { data: subDossiers },
            { data: fichiers },
            { data: comments },
            { data: devis },
            { data: transporteurs },
            { data: factures },
            { data: fournisseurs },
            { data: dossierFournisseurs },
            { data: profiles },
            { data: auditLogs },
          ] = await Promise.all([
            supabase.from("clients").select("*"),
            supabase.from("dossiers").select("*, clients(nom)"),
            supabase.from("ecritures").select("*, clients(nom)"),
            supabase.from("stock_items").select("*"),
            supabase.from("mouvements").select("*"),
            supabase.from("bons_sortie").select("*"),
            supabase.from("sub_dossiers").select("*"),
            supabase.from("dossier_fichiers").select("*"),
            supabase.from("dossier_comments").select("*"),
            supabase.from("devis").select("*"),
            supabase.from("transporteurs").select("*"),
            supabase.from("factures").select("*, facture_lignes(*)"),
            supabase.from("fournisseurs").select("*"),
            supabase.from("dossier_fournisseurs").select("*, fournisseurs(nom, type), dossiers(reference)"),
            supabase.from("profiles").select("*"),
            supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
          ]);

          const mappedClients = (clients || []).map(mapClientFromDb);
          const mappedDossiers = (dossiers || []).map(mapDossierFromDb);
          const mappedFactures = (factures || []).map(mapFactureFromDb);
          const mappedFournisseurs = (fournisseurs || []).map(mapFournisseurFromDb);
          const mappedDossierFournisseurs = (dossierFournisseurs || []).map(mapDossierFournisseurFromDb);

          set({
            clients: syncClientStats(mappedDossiers, mappedFactures, mappedClients),
            dossiers: mappedDossiers,
            ecritures: (ecritures || []).map(mapEcritureFromDb),
            stock: (stock || []).map(mapStockItemFromDb),
            mouvements: (mouvements || []).map(mapMouvementFromDb),
            bons: (bons || []).map(mapBonFromDb),
            subDossiers: (subDossiers || []).map(mapSubDossierFromDb),
            fichiers: (fichiers || []).map(mapFichierFromDb),
            comments: (comments || []).map(mapCommentFromDb),
            devis: (devis || []).map(mapDevisFromDb),
            transporteurs: (transporteurs || []).map(mapTransporteurFromDb),
            factures: mappedFactures,
            fournisseurs: syncFournisseurStats(mappedDossierFournisseurs, mappedFournisseurs),
            dossierFournisseurs: mappedDossierFournisseurs,
            users: (profiles || []).map(mapProfileFromDb),
            auditLogs: (auditLogs || []).map(mapAuditLogFromDb),
          });
        } catch (e) {
          console.error("[SLTT] Erreur de chargement Supabase:", e);
        }
      },

      // ---- Audit ----
      addAuditLog: async (module, action, detail) => {
        const seq = get().auditSeq;
        const id = `A-${pad(seq, 3)}`;
        const dateStr = new Date().toISOString();
        const userStr = getConnectedUserName();
        const newLog: AuditEntry = {
          id,
          date: dateStr,
          user: userStr,
          module,
          action,
          detail,
          ip: "N/A",
        };

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          try {
            await supabase.from("audit_logs").insert({
              user_nom: userStr,
              module,
              action,
              detail,
              ip: "N/A",
            });
          } catch { /* ignore */ }
        }

        set((s) => ({
          auditLogs: [newLog, ...s.auditLogs],
          auditSeq: seq + 1,
        }));
      },

      // ---- Dossiers ----
      addDossier: async (input) => {
        const seq = get().dossierSeq;
        const year = new Date().getFullYear();
        const reference = `SLTT-TR-${year}-${pad(seq, 4)}`;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("dossiers")
            .insert({
              reference,
              client_id: input.clientId,
              bl: input.bl,
              camion: input.camion,
              nature: input.nature,
              droit_douane: input.droitDouane,
              frais_circuit: input.fraisCircuit,
              frais_prestation: input.fraisPrestation,
              montant_investi: input.montantInvesti,
              montant_paye: 0,
              statut: input.statut,
              date: input.date,
              date_echeance: input.dateEcheance,
              date_dedouanement: input.dateDedouanement,
              checklist_docs: [],
              mode_transport: input.modeTransport,
              no_conteneur: input.noConteneur,
              port_entree: input.portEntree,
              poids_total: input.poidsTotal,
              notes: input.notes,
            })
            .select("*, clients(nom)")
            .single();

          if (error) throw error;
          const newDossier = mapDossierFromDb(data);
          set((s) => {
            const updatedDossiers = [newDossier, ...s.dossiers];
            return {
              dossiers: updatedDossiers,
              dossierSeq: seq + 1,
              clients: syncClientStats(updatedDossiers, s.factures, s.clients),
            };
          });
          await get().addAuditLog("Dossiers", "Création", `Dossier ${reference} créé — Client ${input.clientNom}`);
          return newDossier;
        } else {
          const id = `D-${pad(seq, 4)}`;
          const newDossier: Dossier = {
            id,
            reference,
            ...input,
            montantPaye: 0,
            notes: input.notes ?? "",
          };
          set((s) => {
            const updatedDossiers = [newDossier, ...s.dossiers];
            return {
              dossiers: updatedDossiers,
              dossierSeq: seq + 1,
              clients: syncClientStats(updatedDossiers, s.factures, s.clients),
            };
          });
          await get().addAuditLog("Dossiers", "Création", `Dossier ${reference} créé — Client ${input.clientNom}`);
          return newDossier;
        }
      },

      updateDossier: async (id, input) => {
        const existing = get().dossiers.find((d) => d.id === id);
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("dossiers")
            .update({
              client_id: input.clientId,
              bl: input.bl,
              camion: input.camion,
              nature: input.nature,
              droit_douane: input.droitDouane,
              frais_circuit: input.fraisCircuit,
              frais_prestation: input.fraisPrestation,
              montant_investi: input.montantInvesti,
              statut: input.statut,
              date: input.date,
              date_echeance: input.dateEcheance,
              date_dedouanement: input.dateDedouanement,
              mode_transport: input.modeTransport,
              no_conteneur: input.noConteneur,
              port_entree: input.portEntree,
              poids_total: input.poidsTotal,
              notes: input.notes,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedDossiers = s.dossiers.map((d) => d.id === id ? { ...d, ...input } : d);
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, s.clients),
          };
        });

        if (existing) {
          await get().addAuditLog("Dossiers", "Modification", `Dossier ${existing.reference} modifié`);
        }
      },

      updateDossierChecklist: async (dossierId, docId, checked) => {
        const dossier = get().dossiers.find((d) => d.id === dossierId);
        if (!dossier) return;

        const updatedDocs = checked
          ? [...(dossier.checklistDocs ?? []), docId]
          : (dossier.checklistDocs ?? []).filter((x) => x !== docId);

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("dossiers")
            .update({ checklist_docs: updatedDocs })
            .eq("id", dossierId);
          if (error) throw error;
        }

        set((s) => ({
          dossiers: s.dossiers.map((d) =>
            d.id !== dossierId ? d : { ...d, checklistDocs: updatedDocs }
          ),
        }));
      },

      removeDossier: async (id) => {
        const dossier = get().dossiers.find((d) => d.id === id);
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("dossiers").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedDossiers = s.dossiers.filter((d) => d.id !== id);
          const removedDF = s.dossierFournisseurs.filter((df) => df.dossierId === id);
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, s.clients),
            ecritures: s.ecritures.filter((e) => e.dossierId !== id),
            fichiers: s.fichiers.filter((f) => f.dossierId !== id),
            subDossiers: s.subDossiers.filter((sd) => sd.dossierId !== id),
            comments: s.comments.filter((c) => c.dossierId !== id),
            factures: s.factures.map((f) => (f.dossierId === id ? { ...f, dossierId: null } : f)),
            dossierFournisseurs: s.dossierFournisseurs.filter((df) => df.dossierId !== id),
            fournisseurs: syncFournisseurStats(
              s.dossierFournisseurs.filter((df) => df.dossierId !== id),
              s.fournisseurs
            ),
            devis: s.devis.map((d) => (d.dossierId === id ? { ...d, dossierId: null } : d)),
          };
        });

        if (dossier) {
          const orphanBons = get().bons.filter((b) => b.marchandise.includes(dossier.reference));
          const orphanNote = orphanBons.length > 0 ? ` — ${orphanBons.length} bon(s) potentiellement orphelin(s)` : "";
          await get().addAuditLog("Dossiers", "Suppression", `Dossier ${dossier.reference} supprimé${orphanNote}`);
        }
      },

      getDossier: (id) => get().dossiers.find((d) => d.id === id),

      transitionDossier: async (id, newStatut, montantRecu, modePaiement, transitionNote) => {
        const dossier = get().dossiers.find((d) => d.id === id);
        if (!dossier) return;
        const montantApplicable = newStatut === "Soldé" ? montantRecu : undefined;
        const updatedMontantPaye =
          montantApplicable !== undefined
            ? Math.min(dossier.montantInvesti, Math.max(0, dossier.montantPaye + montantApplicable))
            : dossier.montantPaye;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("dossiers")
            .update({ statut: newStatut, montant_paye: updatedMontantPaye })
            .eq("id", id);
          if (error) throw error;

          if (newStatut === "Soldé" && montantRecu && montantRecu > 0) {
            const today = new Date().toISOString().slice(0, 10);
            const existing = get().ecritures.find((e) => e.dossierId === id);
            if (existing) {
              await supabase
                .from("ecritures")
                .update({
                  montant_paye: updatedMontantPaye,
                  mode_paiement: modePaiement ?? existing.modePaiement,
                  date_paiement: today,
                  note: transitionNote || existing.note || `Solde dossier ${dossier.reference}`,
                })
                .eq("dossier_id", id);
            } else {
              await supabase.from("ecritures").insert({
                date: today,
                date_paiement: today,
                client_id: dossier.clientId,
                dossier_id: dossier.id,
                montant_investi: dossier.montantInvesti,
                montant_paye: updatedMontantPaye,
                mode_paiement: modePaiement ?? "Virement",
                note: transitionNote || `Solde dossier ${dossier.reference}`,
              });
            }
          }
        }

        set((s) => {
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === id
              ? { ...d, statut: newStatut, montantPaye: updatedMontantPaye }
              : d,
          );

          let updatedEcritures = s.ecritures;
          let nextEcritureSeq = s.ecritureSeq;
          if (newStatut === "Soldé" && montantRecu && montantRecu > 0) {
            const today = new Date().toISOString().slice(0, 10);
            const existingIdx = s.ecritures.findIndex((e) => e.dossierId === id);
            if (existingIdx >= 0) {
              updatedEcritures = s.ecritures.map((e) =>
                e.dossierId === id
                  ? {
                      ...e,
                      montantPaye: updatedMontantPaye,
                      modePaiement: modePaiement ?? e.modePaiement,
                      datePaiement: today,
                      note: transitionNote || e.note || `Solde dossier ${dossier.reference}`,
                    }
                  : e,
              );
            } else {
              const seq = s.ecritureSeq;
              const autoEcriture: Ecriture = {
                id: `E-${seq}`,
                date: today,
                datePaiement: today,
                clientId: dossier.clientId,
                clientNom: dossier.clientNom,
                dossierId: dossier.id,
                montantInvesti: dossier.montantInvesti,
                montantPaye: updatedMontantPaye,
                modePaiement: modePaiement ?? "Virement",
                note: transitionNote || `Solde dossier ${dossier.reference}`,
              };
              updatedEcritures = [autoEcriture, ...s.ecritures];
              nextEcritureSeq = seq + 1;
            }
          }

          return {
            dossiers: updatedDossiers,
            ecritures: updatedEcritures,
            ecritureSeq: nextEcritureSeq,
            clients: syncClientStats(updatedDossiers, s.factures, s.clients),
          };
        });

        await get().addAuditLog(
          "Dossiers",
          "Validation",
          `Dossier ${dossier.reference} → ${newStatut}${montantRecu ? ` — ${montantRecu.toLocaleString("fr-FR")} FCFA reçus` : ""}`,
        );
      },

      // ---- Clients ----
      addClient: async (input) => {
        const seq = get().clientSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("clients")
            .insert({
              nom: input.nom,
              type: input.type,
              telephone: input.telephone,
              email: input.email,
              adresse: input.adresse,
            })
            .select()
            .single();

          if (error) throw error;
          const newClient = mapClientFromDb(data);
          set((s) => ({
            clients: [newClient, ...s.clients],
            clientSeq: seq + 1,
          }));
          await get().addAuditLog("Clients", "Création", `Client ${input.nom} créé`);
          return newClient;
        } else {
          const id = `C-${pad(seq, 3)}`;
          const newClient: Client = {
            id,
            nom: input.nom,
            type: input.type,
            telephone: input.telephone,
            email: input.email,
            adresse: input.adresse,
            nbDossiers: 0,
            totalPaye: 0,
            totalDu: 0,
          };
          set((s) => ({
            clients: [newClient, ...s.clients],
            clientSeq: seq + 1,
          }));
          await get().addAuditLog("Clients", "Création", `Client ${input.nom} créé`);
          return newClient;
        }
      },

      updateClient: async (id, input) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("clients")
            .update({
              nom: input.nom,
              type: input.type,
              telephone: input.telephone,
              email: input.email,
              adresse: input.adresse,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...input } : c)),
        }));
        await get().addAuditLog("Clients", "Modification", `Client ${input.nom} mis à jour`);
      },

      getClient: (id) => get().clients.find((c) => c.id === id),

      // ---- Comptabilité ----
      recordPayment: async (ecritureId, montant, mode, date, note) => {
        const ecriture = get().ecritures.find((e) => e.id === ecritureId);
        if (!ecriture) return;
        const newMontantPaye = Math.min(ecriture.montantInvesti, Math.max(0, ecriture.montantPaye + montant));

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error: ecritureError } = await supabase
            .from("ecritures")
            .update({
              montant_paye: newMontantPaye,
              mode_paiement: mode,
              date_paiement: date,
              note: note,
            })
            .eq("id", ecritureId);
          if (ecritureError) throw ecritureError;

          if (ecriture.dossierId) {
            const relatedEcritures = get().ecritures.map((e) =>
              e.id === ecritureId ? { ...e, montantPaye: newMontantPaye } : e
            ).filter((e) => e.dossierId === ecriture.dossierId);
            const totalPaye = relatedEcritures.reduce((sum, e) => sum + e.montantPaye, 0);

            const { error: dossierError } = await supabase
              .from("dossiers")
              .update({ montant_paye: totalPaye })
              .eq("id", ecriture.dossierId);
            if (dossierError) throw dossierError;
          }
        }

        set((s) => {
          const updatedEcritures = s.ecritures.map((e) =>
            e.id === ecritureId
              ? {
                  ...e,
                  montantPaye: newMontantPaye,
                  modePaiement: mode,
                  datePaiement: date,
                  note: note || e.note,
                }
              : e
          );
          if (!ecriture.dossierId) return { ecritures: updatedEcritures };
          const totalPaye = updatedEcritures
            .filter((e) => e.dossierId === ecriture.dossierId)
            .reduce((sum, e) => sum + e.montantPaye, 0);
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === ecriture.dossierId
              ? { ...d, montantPaye: Math.min(d.montantInvesti, totalPaye) }
              : d
          );
          return {
            ecritures: updatedEcritures,
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, s.clients),
          };
        });

        await get().addAuditLog(
          "Comptabilité",
          "Paiement",
          `Paiement ${montant.toLocaleString("fr-FR")} FCFA — Écriture ${ecritureId}`
        );
      },

      addEcriture: async (e) => {
        const seq = get().ecritureSeq;
        const validatedPaye = Math.max(0, e.montantPaye);

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("ecritures")
            .insert({
              date: e.date,
              date_paiement: e.datePaiement || null,
              client_id: e.clientId,
              dossier_id: e.dossierId || null,
              montant_investi: e.montantInvesti,
              montant_paye: validatedPaye,
              mode_paiement: e.modePaiement,
              note: e.note || null,
            })
            .select()
            .single();

          if (error) throw error;
          const newEcriture = mapEcritureFromDb(data);

          if (e.dossierId) {
            const relatedEcritures = [newEcriture, ...get().ecritures].filter((ec) => ec.dossierId === e.dossierId);
            const totalPaye = relatedEcritures.reduce((sum, ec) => sum + ec.montantPaye, 0);

            const { error: dossierError } = await supabase
              .from("dossiers")
              .update({ montant_paye: totalPaye })
              .eq("id", e.dossierId);
            if (dossierError) throw dossierError;
          }

          set((s) => {
            const updatedEcritures = [newEcriture, ...s.ecritures];
            if (!e.dossierId) return { ecritures: updatedEcritures, ecritureSeq: seq + 1 };
            const totalPaye = updatedEcritures
              .filter((ec) => ec.dossierId === e.dossierId)
              .reduce((sum, ec) => sum + ec.montantPaye, 0);
            const updatedDossiers = s.dossiers.map((d) =>
              d.id === e.dossierId
                ? { ...d, montantPaye: Math.min(d.montantInvesti, Math.max(0, totalPaye)) }
                : d
            );
            return {
              ecritures: updatedEcritures,
              ecritureSeq: seq + 1,
              dossiers: updatedDossiers,
              clients: syncClientStats(updatedDossiers, s.factures, s.clients),
            };
          });

          await get().addAuditLog("Comptabilité", "Création", `Écriture créée pour ${e.clientNom}`);
          return newEcriture;
        } else {
          const id = `E-${seq}`;
          const newEcriture: Ecriture = { id, ...e, montantPaye: validatedPaye };
          set((s) => {
            const updatedEcritures = [newEcriture, ...s.ecritures];
            if (!e.dossierId) return { ecritures: updatedEcritures, ecritureSeq: seq + 1 };
            const totalPaye = updatedEcritures
              .filter((ec) => ec.dossierId === e.dossierId)
              .reduce((sum, ec) => sum + ec.montantPaye, 0);
            const updatedDossiers = s.dossiers.map((d) =>
              d.id === e.dossierId
                ? { ...d, montantPaye: Math.min(d.montantInvesti, Math.max(0, totalPaye)) }
                : d
            );
            return {
              ecritures: updatedEcritures,
              ecritureSeq: seq + 1,
              dossiers: updatedDossiers,
              clients: syncClientStats(updatedDossiers, s.factures, s.clients),
            };
          });
          await get().addAuditLog("Comptabilité", "Création", `Écriture créée pour ${e.clientNom}`);
          return newEcriture;
        }
      },

      // ---- Stock ----
      addStockItem: async (input) => {
        const seq = get().stockSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("stock_items")
            .insert({
              marchandise: input.marchandise,
              quantite: input.quantite,
              unite: input.unite,
              seuil: input.seuil,
              depositaire: input.depositaire,
              commercial: input.commercial,
              somme_payee: input.sommePayee,
              reste_a_payer: input.resteAPayer,
            })
            .select()
            .single();

          if (error) throw error;
          const newItem = mapStockItemFromDb(data);
          set((s) => ({
            stock: [newItem, ...s.stock],
            stockSeq: seq + 1,
          }));
          await get().addAuditLog("Stock", "Création", `Article de stock créé : ${input.marchandise}`);
          return newItem;
        } else {
          const id = `S-${pad(seq, 3)}`;
          const newItem: StockItem = {
            id,
            ...input,
          };
          set((s) => ({
            stock: [newItem, ...s.stock],
            stockSeq: seq + 1,
          }));
          await get().addAuditLog("Stock", "Création", `Article de stock créé : ${input.marchandise}`);
          return newItem;
        }
      },

      addStockEntry: async (stockId, quantite, responsable) => {
        const stockItem = get().stock.find((s) => s.id === stockId);
        if (!stockItem) return;

        const newQty = stockItem.quantite + quantite;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
          await supabase.from("mouvements").insert({
            stock_id: stockId,
            type: "Entrée",
            quantite,
            date: new Date().toISOString(),
            responsable,
            marchandise: stockItem.marchandise,
            unite: stockItem.unite,
            bon_ref: null,
          });
        }

        const seq = get().mouvementSeq;
        const newMouvement: Mouvement = {
          id: `M-${seq}`,
          date: new Date().toISOString(),
          type: "Entrée",
          marchandise: stockItem.marchandise,
          quantite,
          unite: stockItem.unite,
          responsable,
        };

        set((s) => ({
          stock: s.stock.map((item) => (item.id === stockId ? { ...item, quantite: newQty } : item)),
          mouvements: [newMouvement, ...s.mouvements],
          mouvementSeq: seq + 1,
        }));
        await get().addAuditLog("Stock", "Modification", `Entrée de stock : +${quantite} ${stockItem.unite} pour ${stockItem.marchandise}`);
      },

      addStockExit: async (stockId, quantite, responsable, bonRef) => {
        const stockItem = get().stock.find((s) => s.id === stockId);
        if (!stockItem) return;

        const newQty = Math.max(0, stockItem.quantite - quantite);

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
          await supabase.from("mouvements").insert({
            stock_id: stockId,
            type: "Sortie",
            quantite,
            date: new Date().toISOString(),
            responsable,
            marchandise: stockItem.marchandise,
            unite: stockItem.unite,
            bon_ref: bonRef || null,
          });
        }

        const seq = get().mouvementSeq;
        const newMouvement: Mouvement = {
          id: `M-${seq}`,
          date: new Date().toISOString(),
          type: "Sortie",
          marchandise: stockItem.marchandise,
          quantite,
          unite: stockItem.unite,
          responsable,
          bonRef,
        };

        set((s) => ({
          stock: s.stock.map((item) => (item.id === stockId ? { ...item, quantite: newQty } : item)),
          mouvements: [newMouvement, ...s.mouvements],
          mouvementSeq: seq + 1,
        }));
        await get().addAuditLog("Stock", "Modification", `Sortie de stock : -${quantite} ${stockItem.unite} pour ${stockItem.marchandise}`);
      },

      // ---- Bons de sortie ----
      addBon: async (input) => {
        const seq = get().bonSeq;
        const year = new Date().getFullYear();
        const numero = `BS-${year}-${pad(seq, 4)}`;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("bons_sortie")
            .insert({
              numero,
              date: input.date,
              client_id: input.clientId,
              client_nom: input.clientNom,
              stock_id: input.stockId,
              marchandise: input.marchandise,
              quantite: input.quantite,
              unite: input.unite,
              motif: input.motif,
              montant: input.montant,
              statut: input.statut || "Brouillon",
            })
            .select()
            .single();

          if (error) throw error;
          const newBon = mapBonFromDb(data);
          set((s) => ({
            bons: [newBon, ...s.bons],
            bonSeq: seq + 1,
          }));
          await get().addAuditLog("Bons", "Création", `Bon ${numero} créé`);
          return newBon;
        } else {
          const id = `BS-${pad(seq, 3)}`;
          const newBon: BonSortie = {
            id,
            reference: numero,
            ...input,
            statut: input.statut || "Brouillon",
          };
          set((s) => ({
            bons: [newBon, ...s.bons],
            bonSeq: seq + 1,
          }));
          await get().addAuditLog("Bons", "Création", `Bon ${numero} créé`);
          return newBon;
        }
      },

      validateBon: async (id) => {
        const bon = get().bons.find((b) => b.id === id);
        if (!bon || bon.statut === "Validé") return false;

        const stockItem = findStockForBon(get().stock, bon);
        if (!stockItem || stockItem.quantite < bon.quantite) {
          return false;
        }

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          await supabase.from("bons_sortie").update({ statut: "Validé" }).eq("id", id);
        }

        await get().addStockExit(stockItem.id, bon.quantite, getConnectedUserName(), bon.reference);

        set((s) => ({
          bons: s.bons.map((b) => (b.id === id ? { ...b, statut: "Validé" } : b)),
        }));
        await get().addAuditLog("Bons", "Validation", `Bon de sortie ${bon.reference} validé`);
        return true;
      },

      // ---- Users ----
      addUser: async (input) => {
        const seq = get().userSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("profiles")
            .insert({
              nom: input.nom,
              email: input.email,
              role: input.role,
              permissions: input.permissions,
              actif: true,
            })
            .select()
            .single();

          if (error) throw error;
          const newUser = mapProfileFromDb(data);
          set((s) => ({
            users: [newUser, ...s.users],
            userSeq: seq + 1,
          }));
          await get().addAuditLog("Utilisateurs", "Création", `Utilisateur ${input.nom} créé`);
          return newUser;
        } else {
          const id = `U-${pad(seq, 2)}`;
          const newUser: User = {
            id,
            nom: input.nom,
            email: input.email,
            role: input.role,
            permissions: input.permissions,
            actif: true,
            motDePasse: input.motDePasse || "",
            derniereConnexion: "",
          };
          set((s) => ({
            users: [newUser, ...s.users],
            userSeq: seq + 1,
          }));
          await get().addAuditLog("Utilisateurs", "Création", `Utilisateur ${input.nom} créé`);
          return newUser;
        }
      },

      updateUser: async (id, input) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("profiles")
            .update({
              nom: input.nom,
              email: input.email,
              role: input.role,
              permissions: input.permissions,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...input } : u)),
        }));
        await get().addAuditLog("Utilisateurs", "Modification", `Utilisateur ${input.nom} mis à jour`);
      },

      toggleUserActive: async (id) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return;

        const newStatus = !user.actif;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("profiles")
            .update({ actif: newStatus })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, actif: newStatus } : u)),
        }));
        await get().addAuditLog("Utilisateurs", "Modification", `Statut actif de l'utilisateur ${user.nom} basculé à ${newStatus}`);
      },

      removeUser: async (id) => {
        const user = get().users.find((u) => u.id === id);
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("profiles").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
        }));

        if (user) {
          await get().addAuditLog("Utilisateurs", "Suppression", `Utilisateur ${user.nom} supprimé`);
        }
      },

      updateLastLogin: async (id) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          await supabase
            .from("profiles")
            .update({ derniere_connexion: new Date().toISOString() })
            .eq("id", id);
        }
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, derniereConnexion: new Date().toISOString() } : u
          ),
        }));
      },

      // ---- Sous-dossiers ----
      addSubDossier: async (input) => {
        const seq = get().subDossierSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("sub_dossiers")
            .insert({
              dossier_id: input.dossierId,
              nom: input.nom,
              description: input.description,
            })
            .select()
            .single();

          if (error) throw error;
          const newSd = mapSubDossierFromDb(data);
          set((s) => ({
            subDossiers: [newSd, ...s.subDossiers],
            subDossierSeq: seq + 1,
          }));
          return newSd;
        } else {
          const id = `SD-${pad(seq, 3)}`;
          const newSd: SubDossier = {
            id,
            dossierId: input.dossierId,
            nom: input.nom,
            description: input.description,
            dateCreation: new Date().toISOString(),
          };
          set((s) => ({
            subDossiers: [newSd, ...s.subDossiers],
            subDossierSeq: seq + 1,
          }));
          return newSd;
        }
      },

      updateSubDossier: async (id, nom, description) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("sub_dossiers")
            .update({ nom, description })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          subDossiers: s.subDossiers.map((sd) =>
            sd.id === id ? { ...sd, nom, description } : sd
          ),
        }));
      },

      deleteSubDossier: async (id) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("sub_dossiers").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          subDossiers: s.subDossiers.filter((sd) => sd.id !== id),
          fichiers: s.fichiers.filter((f) => f.sousDossierId !== id),
        }));
      },

      // ---- Fichiers ----
      addFichier: async (input) => {
        const seq = get().fichierSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("dossier_fichiers")
            .insert({
              dossier_id: input.dossierId,
              sub_dossier_id: input.sousDossierId,
              nom: input.nom,
              taille: input.taille,
              type: input.type,
              data_url: input.dataUrl,
            })
            .select()
            .single();

          if (error) throw error;
          const newFile = mapFichierFromDb(data);
          set((s) => ({
            fichiers: [newFile, ...s.fichiers],
            fichierSeq: seq + 1,
          }));
          return newFile;
        } else {
          const id = `F-${pad(seq, 4)}`;
          const newFile: DossierFichier = {
            id,
            dossierId: input.dossierId,
            sousDossierId: input.sousDossierId,
            nom: input.nom,
            taille: input.taille,
            type: input.type,
            dateUpload: new Date().toISOString(),
            dataUrl: input.dataUrl,
          };
          set((s) => ({
            fichiers: [newFile, ...s.fichiers],
            fichierSeq: seq + 1,
          }));
          return newFile;
        }
      },

      deleteFichier: async (id) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("dossier_fichiers").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          fichiers: s.fichiers.filter((f) => f.id !== id),
        }));
      },

      deleteFichiersByDossier: async (dossierId) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("dossier_fichiers").delete().eq("dossier_id", dossierId);
          if (error) throw error;
        }

        set((s) => ({
          fichiers: s.fichiers.filter((f) => f.dossierId !== dossierId),
        }));
      },

      // ---- Commentaires dossiers ----
      addComment: async (dossierId, texte) => {
        const seq = get().commentSeq;
        const userNom = getConnectedUserName();

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("dossier_comments")
            .insert({
              dossier_id: dossierId,
              texte,
              user_nom: userNom,
            })
            .select()
            .single();

          if (error) throw error;
          const newComment = mapCommentFromDb(data);
          set((s) => ({
            comments: [newComment, ...s.comments],
            commentSeq: seq + 1,
          }));
          return newComment;
        } else {
          const id = `COM-${pad(seq, 4)}`;
          const newComment: DossierComment = {
            id,
            dossierId,
            texte,
            userName: userNom,
            date: new Date().toISOString(),
          };
          set((s) => ({
            comments: [newComment, ...s.comments],
            commentSeq: seq + 1,
          }));
          return newComment;
        }
      },

      deleteComment: async (id) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("dossier_comments").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          comments: s.comments.filter((c) => c.id !== id),
        }));
      },

      // ---- Devis ----
      addDevis: async (input) => {
        const seq = get().devisSeq;
        const year = new Date().getFullYear();
        const reference = `DEVIS-${year}-${pad(seq, 4)}`;

        const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("devis")
            .insert({
              reference,
              client_id: input.clientId,
              nature: input.nature,
              droit_douane: input.droitDouane,
              frais_circuit: input.fraisCircuit,
              frais_prestation: input.fraisPrestation,
              total,
              statut: "Brouillon",
              date_validite: input.dateValidite,
              notes: input.notes,
            })
            .select("*, clients(nom)")
            .single();

          if (error) throw error;
          const newDevis = mapDevisFromDb(data);
          set((s) => ({
            devis: [newDevis, ...s.devis],
            devisSeq: seq + 1,
          }));
          return newDevis;
        } else {
          const id = `DV-${pad(seq, 3)}`;
          const newDevis: Devis = {
            id,
            reference,
            ...input,
            statut: "Brouillon",
            total,
            dateCreation: new Date().toISOString().slice(0, 10),
          };
          set((s) => ({
            devis: [newDevis, ...s.devis],
            devisSeq: seq + 1,
          }));
          return newDevis;
        }
      },

      updateDevis: async (id, input) => {
        const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("devis")
            .update({
              client_id: input.clientId,
              nature: input.nature,
              droit_douane: input.droitDouane,
              frais_circuit: input.fraisCircuit,
              frais_prestation: input.fraisPrestation,
              total,
              date_validite: input.dateValidite,
              notes: input.notes,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          devis: s.devis.map((d) =>
            d.id === id
              ? {
                  ...d,
                  ...input,
                  total,
                }
              : d
          ),
        }));
      },

      updateDevisStatut: async (id, statut) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("devis")
            .update({ statut })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          devis: s.devis.map((d) => (d.id === id ? { ...d, statut } : d)),
        }));
      },

      expireDevisObsoletes: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const obsoletes = get().devis.filter(
          (d) => d.dateValidite < today && d.statut !== "Accepté" && d.statut !== "Refusé" && d.statut !== "Expiré"
        );

        if (obsoletes.length === 0) return;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          await supabase
            .from("devis")
            .update({ statut: "Expiré" })
            .in("id", obsoletes.map((o) => o.id));
        }

        set((s) => ({
          devis: s.devis.map((d) =>
            d.dateValidite < today && d.statut !== "Accepté" && d.statut !== "Refusé"
              ? { ...d, statut: "Expiré" as DevisStatut }
              : d
          ),
        }));
      },
      convertDevisToDossier: async (id) => {
        const dev = get().devis.find((d) => d.id === id);
        if (!dev || dev.dossierId) return null; // déjà converti — pas de doublon

        const inputDossier: DossierInput = {
          clientId: dev.clientId,
          clientNom: dev.clientNom,
          nature: dev.nature || `Devis ${dev.reference} : ${dev.notes || "transit"}`,
          bl: "BL-A-DEFINIR",
          camion: "NON-DEFINI",
          date: new Date().toISOString().slice(0, 10),
          droitDouane: dev.droitDouane,
          fraisCircuit: dev.fraisCircuit,
          fraisPrestation: dev.fraisPrestation,
          montantInvesti: dev.total,
          statut: "En cours",
          notes: dev.notes,
        };

        const newDossier = await get().addDossier(inputDossier);

        // Update the devis status and link it to the new dossier
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("devis")
            .update({ statut: "Accepté", dossier_id: newDossier.id })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          devis: s.devis.map((d) =>
            d.id === id ? { ...d, statut: "Accepté", dossierId: newDossier.id } : d
          ),
        }));

        return newDossier;
      },

      removeDevis: async (id) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("devis").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          devis: s.devis.filter((d) => d.id !== id),
        }));
      },

      // ---- Transporteurs ----
      addTransporteur: async (input) => {
        const seq = get().transporteurSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("transporteurs")
            .insert({
              nom: input.nom,
              contact: input.contact,
              telephone: input.telephone,
              email: input.email,
              vehicule: input.vehicule,
              immatriculation: input.immatriculation,
              trajet: input.trajet,
              capacite: input.capacite,
              statut: input.statut,
              notes: input.notes,
            })
            .select()
            .single();

          if (error) throw error;
          const newTr = mapTransporteurFromDb(data);
          set((s) => ({
            transporteurs: [newTr, ...s.transporteurs],
            transporteurSeq: seq + 1,
          }));
          await get().addAuditLog("Transporteurs", "Création", `Transporteur ${input.nom} ajouté`);
          return newTr;
        } else {
          const id = `T-${pad(seq, 3)}`;
          const newTr: Transporteur = {
            id,
            ...input,
            nbDossiers: 0,
            dateCreation: new Date().toISOString().slice(0, 10),
          };
          set((s) => ({
            transporteurs: [newTr, ...s.transporteurs],
            transporteurSeq: seq + 1,
          }));
          await get().addAuditLog("Transporteurs", "Création", `Transporteur ${input.nom} ajouté`);
          return newTr;
        }
      },

      updateTransporteur: async (id, input) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("transporteurs")
            .update({
              nom: input.nom,
              contact: input.contact,
              telephone: input.telephone,
              email: input.email,
              vehicule: input.vehicule,
              immatriculation: input.immatriculation,
              trajet: input.trajet,
              capacite: input.capacite,
              statut: input.statut,
              notes: input.notes,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, ...input } : t)),
        }));
        await get().addAuditLog("Transporteurs", "Modification", `Transporteur ${input.nom} mis à jour`);
      },

      updateTransporteurStatut: async (id, statut) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("transporteurs")
            .update({ statut })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, statut } : t)),
        }));
      },

      removeTransporteur: async (id) => {
        const trans = get().transporteurs.find((t) => t.id === id);
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("transporteurs").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          transporteurs: s.transporteurs.filter((t) => t.id !== id),
        }));

        if (trans) {
          await get().addAuditLog("Transporteurs", "Suppression", `Transporteur ${trans.nom} supprimé`);
        }
      },

      // ---- Factures ----
      addFacture: async (input) => {
        const seq = get().factureSeq;
        const year = new Date().getFullYear();
        const numero = `FACT-${year}-${pad(seq, 4)}`;

        const HT = input.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
        const TVA = Math.round(HT * input.tauxTVA);
        const TTC = HT + TVA;
        const creePar = getConnectedUserName();

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data: dbFact, error: errFact } = await supabase
            .from("factures")
            .insert({
              numero,
              dossier_id: input.dossierId,
              client_id: input.clientId,
              client_nom: input.clientNom,
              date: input.date,
              date_echeance: input.dateEcheance,
              statut: "Brouillon",
              taux_tva: input.tauxTVA,
              montant_ht: HT,
              montant_tva: TVA,
              montant_ttc: TTC,
              montant_paye: 0,
              notes: input.notes,
              cree_par: creePar,
            })
            .select()
            .single();

          if (errFact) throw errFact;

          if (input.lignes.length > 0) {
            const { error: errLignes } = await supabase
              .from("facture_lignes")
              .insert(
                input.lignes.map((l) => ({
                  facture_id: dbFact.id,
                  description: l.description,
                  quantite: l.quantite,
                  prix_unitaire: l.prixUnitaire,
                  montant_ht: l.quantite * l.prixUnitaire,
                }))
              );
            if (errLignes) throw errLignes;
          }

          const { data: fullFact, error: errFetch } = await supabase
            .from("factures")
            .select("*, facture_lignes(*)")
            .eq("id", dbFact.id)
            .single();

          if (errFetch) throw errFetch;

          const newFacture = mapFactureFromDb(fullFact);
          set((s) => ({
            factures: [newFacture, ...s.factures],
            factureSeq: seq + 1,
          }));
          await get().addAuditLog("Factures", "Création", `Facture ${numero} créée`);
          return newFacture;
        } else {
          const id = `F-${pad(seq, 3)}`;
          const lignes: FactureLigne[] = input.lignes.map((l, idx) => ({
            id: `FL-${pad(idx + 1, 3)}`,
            description: l.description,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            montantHT: l.quantite * l.prixUnitaire,
          }));

          const newFacture: Facture = {
            id,
            numero,
            dossierId: input.dossierId || null,
            clientId: input.clientId,
            clientNom: input.clientNom,
            date: input.date,
            dateEcheance: input.dateEcheance,
            statut: "Brouillon",
            lignes,
            tauxTVA: input.tauxTVA,
            montantHT: HT,
            montantTVA: TVA,
            montantTTC: TTC,
            montantPaye: 0,
            notes: input.notes,
            creePar,
            creeLe: new Date().toISOString(),
          };

          set((s) => ({
            factures: [newFacture, ...s.factures],
            factureSeq: seq + 1,
          }));
          await get().addAuditLog("Factures", "Création", `Facture ${numero} créée`);
          return newFacture;
        }
      },

      updateFacture: async (id, input) => {
        const HT = input.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
        const TVA = Math.round(HT * input.tauxTVA);
        const TTC = HT + TVA;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error: errFact } = await supabase
            .from("factures")
            .update({
              dossier_id: input.dossierId,
              client_id: input.clientId,
              client_nom: input.clientNom,
              date: input.date,
              date_echeance: input.dateEcheance,
              taux_tva: input.tauxTVA,
              montant_ht: HT,
              montant_tva: TVA,
              montant_ttc: TTC,
              notes: input.notes,
            })
            .eq("id", id);

          if (errFact) throw errFact;

          await supabase.from("facture_lignes").delete().eq("facture_id", id);
          if (input.lignes.length > 0) {
            await supabase.from("facture_lignes").insert(
              input.lignes.map((l) => ({
                facture_id: id,
                description: l.description,
                quantite: l.quantite,
                prix_unitaire: l.prixUnitaire,
                montant_ht: l.quantite * l.prixUnitaire,
              }))
            );
          }
        }

        set((s) => ({
          factures: s.factures.map((fact) => {
            if (fact.id !== id) return fact;
            const updatedLignes: FactureLigne[] = input.lignes.map((l, idx) => ({
              id: `FL-${idx + 1}`,
              description: l.description,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              montantHT: l.quantite * l.prixUnitaire,
            }));
            return {
              ...fact,
              ...input,
              montantHT: HT,
              montantTVA: TVA,
              montantTTC: TTC,
              lignes: updatedLignes,
            };
          }),
        }));
      },

      removeFacture: async (id) => {
        const fact = get().factures.find((f) => f.id === id);
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("factures").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedFactures = s.factures.filter((f) => f.id !== id);
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.clients),
          };
        });

        if (fact) {
          await get().addAuditLog("Factures", "Suppression", `Facture ${fact.numero} supprimée`);
        }
      },

      updateFactureStatut: async (id, statut) => {
        const f = get().factures.find((x) => x.id === id);
        if (!f) return;
        const montantPaye = statut === "Soldée" ? f.montantTTC : f.montantPaye;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("factures")
            .update({ statut, montant_paye: montantPaye })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedFactures = s.factures.map((x) =>
            x.id === id ? { ...x, statut, montantPaye } : x
          );
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.clients),
          };
        });
        
        await get().addAuditLog("Factures", "Modification", `Facture ${f.numero} → ${statut}`);
      },

      recordFacturePaiement: async (id, montant) => {
        const fact = get().factures.find((f) => f.id === id);
        if (!fact) return;

        const newPaye = Math.min(fact.montantTTC, fact.montantPaye + montant);
        const newStatut: FactureStatut = newPaye >= fact.montantTTC ? "Soldée" : "Partielle";

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("factures")
            .update({ montant_paye: newPaye, statut: newStatut })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedFactures = s.factures.map((f) =>
            f.id === id ? { ...f, montantPaye: newPaye, statut: newStatut } : f
          );
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.clients),
          };
        });

        await get().addAuditLog(
          "Factures",
          "Paiement",
          `Encaissement de ${montant.toLocaleString("fr-FR")} FCFA sur la facture ${fact.numero}`
        );
      },

      // ---- Fournisseurs ----
      addFournisseur: async (input) => {
        const seq = get().fournisseurSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("fournisseurs")
            .insert({
              nom: input.nom,
              type: input.type,
              contact: input.contact,
              telephone: input.telephone,
              email: input.email,
              adresse: input.adresse,
              tarif_contractuel: input.tarifContractuel,
              statut: input.statut || "Actif",
            })
            .select()
            .single();

          if (error) throw error;
          const newFourn = mapFournisseurFromDb(data);
          set((s) => ({
            fournisseurs: [newFourn, ...s.fournisseurs],
            fournisseurSeq: seq + 1,
          }));
          await get().addAuditLog("Fournisseurs", "Création", `Fournisseur ${input.nom} créé`);
          return newFourn;
        } else {
          const id = `F-${pad(seq, 3)}`;
          const newFourn: Fournisseur = {
            id,
            ...input,
            statut: input.statut || "Actif",
            nbDossiers: 0,
            montantTotal: 0,
          };
          set((s) => ({
            fournisseurs: [newFourn, ...s.fournisseurs],
            fournisseurSeq: seq + 1,
          }));
          await get().addAuditLog("Fournisseurs", "Création", `Fournisseur ${input.nom} créé`);
          return newFourn;
        }
      },
      updateFournisseur: async (id, input) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("fournisseurs")
            .update({
              nom: input.nom,
              type: input.type,
              contact: input.contact,
              telephone: input.telephone,
              email: input.email,
              adresse: input.adresse,
              tarif_contractuel: input.tarifContractuel,
              statut: input.statut,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          fournisseurs: s.fournisseurs.map((f) => (f.id === id ? { ...f, ...input } : f)),
        }));
        await get().addAuditLog("Fournisseurs", "Modification", `Fournisseur ${input.nom} mis à jour`);
      },

      removeFournisseur: async (id) => {
        const fourn = get().fournisseurs.find((f) => f.id === id);
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("fournisseurs").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => ({
          fournisseurs: s.fournisseurs.filter((f) => f.id !== id),
          dossierFournisseurs: s.dossierFournisseurs.filter((df) => df.fournisseurId !== id),
        }));

        if (fourn) {
          await get().addAuditLog("Fournisseurs", "Suppression", `Fournisseur ${fourn.nom} supprimé`);
        }
      },

      addDossierFournisseur: async (input) => {
        const seq = get().dossierFournisseurSeq;

        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase
            .from("dossier_fournisseurs")
            .insert({
              dossier_id: input.dossierId,
              fournisseur_id: input.fournisseurId,
              description: input.description,
              montant_budgete: input.montantBudgete,
              montant_reel: input.montantReel,
              statut: input.statut || "En attente",
              date: input.date,
            })
            .select("*, fournisseurs(nom, type), dossiers(reference)")
            .single();

          if (error) throw error;
          const newDf = mapDossierFournisseurFromDb(data);
          set((s) => {
            const updatedDf = [newDf, ...s.dossierFournisseurs];
            return {
              dossierFournisseurs: updatedDf,
              dossierFournisseurSeq: seq + 1,
              fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
            };
          });
          return newDf;
        } else {
          const id = `DF-${pad(seq, 3)}`;
          const newDf: DossierFournisseur = {
            id,
            ...input,
            statut: input.statut || "En attente",
          };
          set((s) => {
            const updatedDf = [newDf, ...s.dossierFournisseurs];
            return {
              dossierFournisseurs: updatedDf,
              dossierFournisseurSeq: seq + 1,
              fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
            };
          });
          return newDf;
        }
      },

      updateDossierFournisseur: async (id, input) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase
            .from("dossier_fournisseurs")
            .update({
              dossier_id: input.dossierId,
              fournisseur_id: input.fournisseurId,
              description: input.description,
              montant_budgete: input.montantBudgete,
              montant_reel: input.montantReel,
              statut: input.statut,
              date: input.date,
            })
            .eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedDf = s.dossierFournisseurs.map((df) => (df.id === id ? { ...df, ...input } : df));
          return {
            dossierFournisseurs: updatedDf,
            fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
          };
        });
      },

      removeDossierFournisseur: async (id) => {
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.from("dossier_fournisseurs").delete().eq("id", id);
          if (error) throw error;
        }

        set((s) => {
          const updatedDf = s.dossierFournisseurs.filter((df) => df.id !== id);
          return {
            dossierFournisseurs: updatedDf,
            fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
          };
        });
      },

      // ---- Reset ----
      resetAll: () => {
        set({
          clients: seedClients,
          dossiers: seedDossiers,
          ecritures: seedEcritures,
          stock: seedStock,
          mouvements: seedMouvements,
          bons: seedBons,
          users: seedUsers,
          subDossiers: seedSubDossiers,
          fichiers: seedFichiers,
          devis: seedDevis,
          comments: seedComments,
          transporteurs: seedTransporteurs,
          factures: seedFactures,
          fournisseurs: seedFournisseurs,
          dossierFournisseurs: seedDossierFournisseurs,
          auditLogs: initialAuditLogs,
          ...INITIAL_SEQUENCES,
        });
      },
    }),
    {
      name: "sltt-data-v9",
      // SEC-05: custom storage wrapper to catch QuotaExceededError
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try { return localStorage.getItem(name); } catch { return null; }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch (e) {
            if (e instanceof DOMException && e.name === "QuotaExceededError") {
              console.warn("[SLTT] localStorage quota dépassé — certaines données ne seront pas persistées.");
            }
          }
        },
        removeItem: (name) => {
          try { localStorage.removeItem(name); } catch {}
        },
      })),
      // DX-01: log rehydration errors
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error("[SLTT] Erreur réhydratation store:", error);
      },
      partialize: (s) => ({
        clients: s.clients,
        dossiers: s.dossiers,
        ecritures: s.ecritures,
        stock: s.stock,
        mouvements: s.mouvements,
        bons: s.bons,
        users: s.users,
        subDossiers: s.subDossiers,
        fichiers: s.fichiers,
        auditLogs: s.auditLogs,
        dossierSeq: s.dossierSeq,
        bonSeq: s.bonSeq,
        auditSeq: s.auditSeq,
        ecritureSeq: s.ecritureSeq,
        clientSeq: s.clientSeq,
        stockSeq: s.stockSeq,
        userSeq: s.userSeq,
        mouvementSeq: s.mouvementSeq,
        subDossierSeq: s.subDossierSeq,
        fichierSeq: s.fichierSeq,
        devis: s.devis,
        devisSeq: s.devisSeq,
        comments: s.comments,
        commentSeq: s.commentSeq,
        transporteurs: s.transporteurs,
        transporteurSeq: s.transporteurSeq,
        factures: s.factures,
        factureSeq: s.factureSeq,
        fournisseurs: s.fournisseurs,
        dossierFournisseurs: s.dossierFournisseurs,
        fournisseurSeq: s.fournisseurSeq,
        dossierFournisseurSeq: s.dossierFournisseurSeq,
      }),
    },
  ),
);
