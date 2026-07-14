"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useNav } from "@/lib/nav-store";
import { supabase } from "@/lib/supabase";
import { fetchWithAuth } from "@/lib/api/fetch-auth";
import { syncClientStats } from "@/lib/client-stats";
import { syncContratStats } from "@/lib/contrat-stats";
import { assertDossierTransition } from "@/lib/dossier-flow";
import { computeIncrementalPaye, validatePaymentAmount } from "@/lib/payments";
import { normalizePermissions, ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions";
import {
  insertAuditLog,
  mapAuditLogFromDb,
  type AuditAction,
  type AuditEntry,
  type AuditModule,
} from "@/lib/audit";
import {
  CHECKLIST_DOCS,
  PRESTATION_OPTIONNELLE_LABEL,
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
  type Societe,
  type Contrat,
  type ContratInput,
  type ContratStatut,
  type ContratFichier,
  type Depense,
  type DepenseInput,
  type ContratPrestation,
  type ContratPrestationInput,
  type ContratPrestationStatut,
  type SortieCaisseLigne,
  type BonSortieCaisse,
  type BonSortieCaisseInput,
} from "@/lib/domain-types";

export {
  CHECKLIST_DOCS,
  PRESTATION_OPTIONNELLE_LABEL,
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
  Societe,
  Contrat,
  ContratInput,
  ContratStatut,
  ContratFichier,
  Depense,
  DepenseInput,
  ContratPrestation,
  ContratPrestationInput,
  ContratPrestationStatut,
  SortieCaisseLigne,
  BonSortieCaisse,
  BonSortieCaisseInput,
};

export type { AuditAction, AuditModule, AuditEntry };

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
  societeId?: string;
  societeNom?: string;
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
  societeId?: string | null;
  date: string;
  dateEcheance: string;
  lignes: Array<{ description: string; quantite: number; prixUnitaire: number }>;
  tauxTVA: number;
  notes: string;
}

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
  societeId: string;
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
  clientId?: string;
  societeId: string;
}

/* ------------------------------------------------------------------ */
/* CONTRATS / DÉPENSES / PRESTATIONS OPTIONNELLES — INPUT TYPES        */
/* ------------------------------------------------------------------ */

export interface AddDepenseInput extends DepenseInput {
  justificatifDataUrl?: string;
  justificatifNom?: string;
}

export interface AddContratFichierInput {
  contratId: string;
  nom: string;
  taille: number;
  type: string;
  dataUrl: string;
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
    societeId: x.societe_id || undefined,
    societeNom: x.societes?.nom || undefined,
    montantInvesti: Number(x.montant_investi || 0),
    montantPaye: Number(x.montant_paye || 0),
    modePaiement: x.mode_paiement || "Virement",
    note: x.note || undefined,
  };
}

function mapStockItemFromDb(x: any): StockItem {
  return {
    id: x.id,
    clientId: x.client_id || undefined,
    clientNom: x.clients?.nom || undefined,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
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
    stockId: x.stock_id || undefined,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    date: x.date,
    type: x.type,
    marchandise: x.marchandise || "",
    quantite: Number(x.quantite),
    unite: x.unite || "",
    responsable: x.responsable || "",
    bonRef: x.bon_ref || undefined,
    motif: x.motif || undefined,
  };
}

function mapBonFromDb(x: any): BonSortie {
  return {
    id: x.id,
    reference: x.reference,
    date: x.date,
    clientId: x.client_id,
    clientNom: x.clients?.nom || x.client_nom || "",
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    stockId: x.stock_id || undefined,
    marchandise: x.marchandise,
    quantite: Number(x.quantite),
    unite: x.unite,
    motif: x.motif,
    montant: Number(x.montant),
    statut: x.statut,
  };
}

function mapBonSortieCaisseFromDb(x: any): BonSortieCaisse {
  return {
    id: x.id,
    reference: x.reference,
    date: x.date,
    montantTotal: Number(x.montant_total),
    creePar: x.cree_par || undefined,
    creeLe: x.created_at,
    lignes: (x.bons_sortie_caisse_lignes || []).map((l: any) => ({
      id: l.id,
      date: l.date,
      beneficiaire: l.beneficiaire,
      motif: l.motif,
      montant: Number(l.montant),
    })),
  };
}

function mapSocieteFromDb(x: any): Societe {
  return { id: x.id, nom: x.nom, actif: x.actif };
}

function mapContratFromDb(
  x: any,
): Omit<Contrat, "nbPrestations" | "nbPrestationsRealisees" | "totalDepenses"> {
  return {
    id: x.id,
    reference: x.reference,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    clientId: x.client_id,
    clientNom: x.clients?.nom || "—",
    objet: x.objet,
    dateDebut: x.date_debut,
    dateFin: x.date_fin || undefined,
    montant: Number(x.montant),
    statut: x.statut,
    notes: x.notes || undefined,
    creePar: x.cree_par || undefined,
    creeLe: x.created_at,
  };
}

function mapContratFichierFromDb(x: any): ContratFichier {
  return {
    id: x.id,
    contratId: x.contrat_id,
    nom: x.nom,
    taille: Number(x.taille),
    type: x.type,
    dateUpload: x.date_upload || x.created_at,
    storagePath: x.storage_path,
  };
}

function mapDepenseFromDb(x: any): Depense {
  return {
    id: x.id,
    contratId: x.contrat_id,
    societeId: x.societe_id,
    libelle: x.libelle,
    montant: Number(x.montant),
    dateDepense: x.date_depense,
    modePaiement: x.mode_paiement,
    justificatifPath: x.justificatif_path || undefined,
    note: x.note || undefined,
    creePar: x.cree_par || undefined,
  };
}

function mapContratPrestationFromDb(x: any): ContratPrestation {
  return {
    id: x.id,
    contratId: x.contrat_id,
    libelle: x.libelle,
    description: x.description || undefined,
    montant: x.montant != null ? Number(x.montant) : undefined,
    statut: x.statut,
    datePrevue: x.date_prevue || undefined,
    dateRealisation: x.date_realisation || undefined,
    creePar: x.cree_par || undefined,
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
    userName: x.user_name || "",
    date: x.date ?? x.created_at ?? new Date().toISOString(),
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
    clientNom: x.clients?.nom || "—",
    societeId: x.societe_id || undefined,
    societeNom: x.societes?.nom || undefined,
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
    creeLe: x.cree_le ?? x.created_at,
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
  const role = x.role as UserRole;
  const raw = Array.isArray(x.permissions) ? x.permissions : [];
  const normalized = normalizePermissions(raw);
  return {
    id: x.id,
    nom: x.nom,
    email: x.email,
    role,
    permissions:
      normalized.length > 0
        ? normalized
        : (ROLE_DEFAULT_PERMISSIONS[role] ?? []),
    actif: x.actif,
    derniereConnexion: x.derniere_connexion || "",
    motDePasse: "",
  };
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function findStockForBon(stock: StockItem[], ref: { stockId?: string; marchandise: string }): StockItem | undefined {
  if (ref.stockId) return stock.find((s) => s.id === ref.stockId);
  return stock.find((s) => s.marchandise === ref.marchandise);
}

/** Seule transition de statut légitime pour un dossier — voir dossier-flow.ts */

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

type SequenceCounters = Pick<
  SLTTState,
  | "dossierSeq"
  | "bonSeq"
  | "auditSeq"
  | "ecritureSeq"
  | "clientSeq"
  | "stockSeq"
  | "userSeq"
  | "mouvementSeq"
  | "subDossierSeq"
  | "fichierSeq"
  | "devisSeq"
  | "transporteurSeq"
  | "commentSeq"
  | "factureSeq"
  | "fournisseurSeq"
  | "dossierFournisseurSeq"
  | "contratSeq"
  | "contratFichierSeq"
  | "depenseSeq"
  | "contratPrestationSeq"
  | "bonSortieCaisseSeq"
>;

function parseTrailingSeq(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

/** Parse la référence "N°{n}" des bons de sortie de caisse (pas de préfixe année). */
function parseNumeroSeq(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/N°(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseIdSeq(id: string | null | undefined, prefix: string): number | null {
  if (!id) return null;
  const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
  return match ? Number.parseInt(match[1], 10) : null;
}

function nextSeqFromValues(values: Array<number | null>, current: number): number {
  const max = values.filter((v): v is number => v !== null).reduce((acc, v) => Math.max(acc, v), 0);
  return Math.max(current, max + 1);
}

function syncSequencesFromData(state: Pick<SLTTState, keyof SequenceCounters | "dossiers" | "factures" | "bons" | "devis" | "auditLogs" | "ecritures" | "clients" | "stock" | "users" | "mouvements" | "subDossiers" | "fichiers" | "comments" | "transporteurs" | "fournisseurs" | "dossierFournisseurs" | "contrats" | "contratFichiers" | "depenses" | "contratPrestations" | "bonsSortieCaisse">): SequenceCounters {
  return {
    dossierSeq: nextSeqFromValues(state.dossiers.map((d) => parseTrailingSeq(d.reference)), state.dossierSeq),
    bonSeq: nextSeqFromValues(state.bons.map((b) => parseTrailingSeq(b.reference)), state.bonSeq),
    auditSeq: nextSeqFromValues(state.auditLogs.map((a) => parseIdSeq(a.id, "A")), state.auditSeq),
    ecritureSeq: nextSeqFromValues(state.ecritures.map((e) => parseIdSeq(e.id, "E")), state.ecritureSeq),
    clientSeq: nextSeqFromValues(state.clients.map((c) => parseIdSeq(c.id, "C")), state.clientSeq),
    stockSeq: nextSeqFromValues(state.stock.map((s) => parseIdSeq(s.id, "S")), state.stockSeq),
    userSeq: nextSeqFromValues(state.users.map((u) => parseIdSeq(u.id, "U")), state.userSeq),
    mouvementSeq: nextSeqFromValues(state.mouvements.map((m) => parseIdSeq(m.id, "M")), state.mouvementSeq),
    subDossierSeq: nextSeqFromValues(state.subDossiers.map((sd) => parseIdSeq(sd.id, "SD")), state.subDossierSeq),
    fichierSeq: nextSeqFromValues(state.fichiers.map((f) => parseIdSeq(f.id, "F")), state.fichierSeq),
    devisSeq: nextSeqFromValues(state.devis.map((d) => parseTrailingSeq(d.reference)), state.devisSeq),
    transporteurSeq: nextSeqFromValues(state.transporteurs.map((t) => parseIdSeq(t.id, "T")), state.transporteurSeq),
    commentSeq: nextSeqFromValues(state.comments.map((c) => parseIdSeq(c.id, "COM")), state.commentSeq),
    factureSeq: nextSeqFromValues(state.factures.map((f) => parseTrailingSeq(f.numero)), state.factureSeq),
    fournisseurSeq: nextSeqFromValues(state.fournisseurs.map((f) => parseIdSeq(f.id, "F")), state.fournisseurSeq),
    dossierFournisseurSeq: nextSeqFromValues(state.dossierFournisseurs.map((df) => parseIdSeq(df.id, "DF")), state.dossierFournisseurSeq),
    contratSeq: nextSeqFromValues(state.contrats.map((c) => parseTrailingSeq(c.reference)), state.contratSeq),
    contratFichierSeq: nextSeqFromValues(state.contratFichiers.map((f) => parseIdSeq(f.id, "CF")), state.contratFichierSeq),
    depenseSeq: nextSeqFromValues(state.depenses.map((d) => parseIdSeq(d.id, "DEP")), state.depenseSeq),
    contratPrestationSeq: nextSeqFromValues(state.contratPrestations.map((p) => parseIdSeq(p.id, "PRES")), state.contratPrestationSeq),
    bonSortieCaisseSeq: nextSeqFromValues(state.bonsSortieCaisse.map((b) => parseNumeroSeq(b.reference)), state.bonSortieCaisseSeq),
  };
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
  societes: Societe[];
  contrats: Contrat[];
  contratFichiers: ContratFichier[];
  depenses: Depense[];
  contratPrestations: ContratPrestation[];
  bonsSortieCaisse: BonSortieCaisse[];

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
  contratSeq: number;
  contratFichierSeq: number;
  depenseSeq: number;
  contratPrestationSeq: number;
  bonSortieCaisseSeq: number;

  // Supabase sync
  dataLoading: boolean;
  loadError: string | null;
  lastSyncedAt: number | null;
  fetchData: () => Promise<void>;
  clearLoadError: () => void;

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
  addStockExit: (stockId: string, quantite: number, responsable: string, bonRef?: string, motif?: string) => Promise<void>;

  // ---- Bons de sortie ----
  addBon: (input: BonInput) => Promise<BonSortie>;
  validateBon: (id: string) => Promise<boolean>;

  // ---- Users ----
  addUser: (input: UserInput) => Promise<User>;
  updateUser: (id: string, input: UserInput) => Promise<void>;
  updateOwnProfile: (id: string, input: { nom: string; email: string }) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string, password: string) => Promise<void>;
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
  convertDevisToDossier: (id: string, bl: string, camion: string) => Promise<Dossier | null>;
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

  // ---- Contrats ----
  addContrat: (input: ContratInput) => Promise<Contrat>;
  updateContrat: (id: string, input: ContratInput) => Promise<void>;
  updateContratStatut: (id: string, statut: ContratStatut) => Promise<void>;
  removeContrat: (id: string) => Promise<void>;
  getContrat: (id: string) => Contrat | undefined;

  // ---- Contrat — fichiers (scans, bucket privé) ----
  addContratFichier: (input: AddContratFichierInput) => Promise<ContratFichier>;
  deleteContratFichier: (id: string) => Promise<void>;
  getSignedContratFichierUrl: (storagePath: string) => Promise<string>;

  // ---- Dépenses ----
  addDepense: (input: AddDepenseInput) => Promise<Depense>;
  removeDepense: (id: string) => Promise<void>;

  // ---- Prestations optionnelles ----
  addContratPrestation: (input: ContratPrestationInput) => Promise<ContratPrestation>;
  updateContratPrestation: (id: string, input: Partial<ContratPrestationInput>) => Promise<void>;
  removeContratPrestation: (id: string) => Promise<void>;

  // ---- Bons de sortie de caisse (décaissement) ----
  addBonSortieCaisse: (input: BonSortieCaisseInput) => Promise<BonSortieCaisse>;
  removeBonSortieCaisse: (id: string) => Promise<void>;

  refetchData: () => Promise<void>;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

const INITIAL_SEQUENCES = {
  dossierSeq: 1,
  bonSeq: 1,
  auditSeq: 1,
  ecritureSeq: 1,
  clientSeq: 1,
  stockSeq: 1,
  userSeq: 1,
  mouvementSeq: 1,
  subDossierSeq: 1,
  fichierSeq: 1,
  devisSeq: 1,
  transporteurSeq: 1,
  commentSeq: 1,
  factureSeq: 1,
  fournisseurSeq: 1,
  dossierFournisseurSeq: 1,
  contratSeq: 1,
  contratFichierSeq: 1,
  depenseSeq: 1,
  contratPrestationSeq: 1,
  bonSortieCaisseSeq: 1,
} as const;

export const useStore = create<SLTTState>()(
  persist(
    (set, get) => ({
      clients: [],
      dossiers: [],
      ecritures: [],
      stock: [],
      mouvements: [],
      bons: [],
      users: [],
      subDossiers: [],
      fichiers: [],
      devis: [],
      comments: [],
      transporteurs: [],
      factures: [],
      fournisseurs: [],
      dossierFournisseurs: [],
      societes: [],
      contrats: [],
      contratFichiers: [],
      depenses: [],
      contratPrestations: [],
      bonsSortieCaisse: [],
      auditLogs: [],
      dataLoading: false,
      loadError: null,
      lastSyncedAt: null,
      ...INITIAL_SEQUENCES,

      clearLoadError: () => set({ loadError: null }),

      fetchData: async () => {
        set({ dataLoading: true, loadError: null });
        try {
          // Sans JWT, le RLS renvoie [] (HTTP 200) — pas d'erreur visible.
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session?.access_token) {
            throw new Error(
              "Session Supabase absente. Reconnectez-vous pour charger les données.",
            );
          }

          const coreResults = await Promise.all([
            supabase.from("clients").select("*"),
            supabase.from("dossiers").select("*, clients(nom)"),
            supabase.from("ecritures").select("*, clients(nom), societes(nom)"),
            supabase.from("factures").select("*, facture_lignes(*), clients(nom), societes(nom)"),
            supabase.from("profiles").select("*"),
            supabase.from("societes").select("*"),
          ]);

          const coreError = coreResults.find((r) => r.error)?.error;
          if (coreError) throw coreError;

          const [
            { data: clients },
            { data: dossiers },
            { data: ecritures },
            { data: factures },
            { data: profiles },
            { data: societes },
          ] = coreResults;

          const mappedClients = (clients || []).map(mapClientFromDb);
          const mappedDossiers = (dossiers || []).map(mapDossierFromDb);
          const mappedFactures = (factures || []).map(mapFactureFromDb);
          const mappedEcritures = (ecritures || []).map(mapEcritureFromDb);

          set((s) => {
            const nextState = {
              ...s,
              clients: syncClientStats(mappedDossiers, mappedFactures, mappedEcritures, mappedClients),
              dossiers: mappedDossiers,
              ecritures: mappedEcritures,
              factures: mappedFactures,
              users: (profiles || []).map(mapProfileFromDb),
              societes: (societes || []).map(mapSocieteFromDb),
              loadError: null,
              dataLoading: false,
            };
            return {
              ...nextState,
              ...syncSequencesFromData(nextState),
            };
          });

          const secondaryResults = await Promise.all([
            supabase.from("stock_items").select("*, clients(nom), societes(nom)"),
            supabase.from("mouvements").select("*, societes(nom)"),
            supabase.from("bons_sortie").select("*, clients(nom), societes(nom)"),
            supabase.from("sub_dossiers").select("*"),
            supabase.from("dossier_fichiers").select("*"),
            supabase.from("dossier_comments").select("*"),
            supabase.from("devis").select("*, clients(nom)"),
            supabase.from("transporteurs").select("*"),
            supabase.from("fournisseurs").select("*"),
            supabase.from("dossier_fournisseurs").select("*, fournisseurs(nom, type), dossiers(reference)"),
            supabase.from("contrats").select("*, clients(nom), societes(nom)"),
            supabase.from("contrat_fichiers").select("*"),
            supabase.from("depenses").select("*"),
            supabase.from("contrat_prestations").select("*"),
            supabase.from("bons_sortie_caisse").select("*, bons_sortie_caisse_lignes(*)"),
            supabase.from("audit_logs").select("*").order("date", { ascending: false }),
          ]);

          const secondaryError = secondaryResults.find((r) => r.error)?.error;
          if (secondaryError) {
            console.warn("[SLTT] Chargement secondaire partiel:", secondaryError);
          }

          const [
            { data: stock },
            { data: mouvements },
            { data: bons },
            { data: subDossiers },
            { data: fichiers },
            { data: comments },
            { data: devis },
            { data: transporteurs },
            { data: fournisseurs },
            { data: dossierFournisseurs },
            { data: contrats },
            { data: contratFichiers },
            { data: depenses },
            { data: contratPrestations },
            { data: bonsSortieCaisse },
            { data: auditLogs },
          ] = secondaryResults;

          const mappedFournisseurs = (fournisseurs || []).map(mapFournisseurFromDb);
          const mappedDossierFournisseurs = (dossierFournisseurs || []).map(mapDossierFournisseurFromDb);
          const mappedDepenses = (depenses || []).map(mapDepenseFromDb);
          const mappedPrestations = (contratPrestations || []).map(mapContratPrestationFromDb);
          const mappedContratsRaw = (contrats || []).map(mapContratFromDb);

          set((s) => {
            const nextState = {
              ...s,
              stock: (stock || []).map(mapStockItemFromDb),
              mouvements: (mouvements || []).map(mapMouvementFromDb),
              bons: (bons || []).map(mapBonFromDb),
              subDossiers: (subDossiers || []).map(mapSubDossierFromDb),
              fichiers: (fichiers || []).map(mapFichierFromDb),
              comments: (comments || []).map(mapCommentFromDb),
              devis: (devis || []).map(mapDevisFromDb),
              transporteurs: (transporteurs || []).map(mapTransporteurFromDb),
              fournisseurs: syncFournisseurStats(mappedDossierFournisseurs, mappedFournisseurs),
              dossierFournisseurs: mappedDossierFournisseurs,
              contrats: syncContratStats(mappedDepenses, mappedPrestations, mappedContratsRaw),
              contratFichiers: (contratFichiers || []).map(mapContratFichierFromDb),
              depenses: mappedDepenses,
              contratPrestations: mappedPrestations,
              bonsSortieCaisse: (bonsSortieCaisse || []).map(mapBonSortieCaisseFromDb),
              auditLogs: (auditLogs || []).map(mapAuditLogFromDb),
              clients: syncClientStats(s.dossiers, s.factures, s.ecritures, s.clients),
              lastSyncedAt: Date.now(),
            };
            return {
              ...nextState,
              ...syncSequencesFromData(nextState),
            };
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Impossible de charger les données.";
          console.error("[SLTT] Erreur de chargement Supabase:", e);
          set({ loadError: message, dataLoading: false });
        }
      },

      // ---- Audit ----
      addAuditLog: async (module, action, detail) => {
        const seq = get().auditSeq;
        const userStr = getConnectedUserName();
        const newLog = await insertAuditLog({
          module,
          action,
          detail,
          userName: userStr,
        });
        if (!newLog) return;
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
        // Tout nouveau dossier démarre à « En cours » — les transitions guidées
        // sont le seul chemin légitime pour avancer le statut.
        const statut: DossierStatut = "En cours";

        
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
            statut,
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
            clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
          };
        });
        await get().addAuditLog("Dossiers", "Création", `Dossier ${reference} créé — Client ${input.clientNom}`);
        return newDossier;

      },

      updateDossier: async (id, input) => {
        const existing = get().dossiers.find((d) => d.id === id);
        // Le statut ne se change que via transitionDossier (flux guidé) — on
        // ignore toute valeur envoyée ici pour ne pas contourner la garde.
        const statut = existing?.statut ?? input.statut;
        
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
            statut,
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
      

        set((s) => {
          const updatedDossiers = s.dossiers.map((d) => d.id === id ? { ...d, ...input, statut } : d);
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
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

        
        const { error } = await supabase
          .from("dossiers")
          .update({ checklist_docs: updatedDocs })
          .eq("id", dossierId);
        if (error) throw error;
      

        set((s) => ({
          dossiers: s.dossiers.map((d) =>
            d.id !== dossierId ? d : { ...d, checklistDocs: updatedDocs }
          ),
        }));
      },

      removeDossier: async (id) => {
        const dossier = get().dossiers.find((d) => d.id === id);
        
        const { error } = await supabase.from("dossiers").delete().eq("id", id);
        if (error) throw error;
      

        set((s) => {
          const updatedDossiers = s.dossiers.filter((d) => d.id !== id);
          const removedDF = s.dossierFournisseurs.filter((df) => df.dossierId === id);
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
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
        // LOGIC-audit : contrairement aux devis (dont le menu "..." permet un
        // recalage manuel volontaire de statut), aucun écran ne propose de
        // saut libre pour un dossier — le seul chemin légitime est le flux
        // linéaire guidé par TransitionDialog. On le fait respecter ici aussi
        // pour ne pas dépendre uniquement de la garde côté UI.
        assertDossierTransition(dossier.statut, newStatut);
        const montantApplicable = newStatut === "Soldé" ? montantRecu : undefined;
        const updatedMontantPaye =
          montantApplicable !== undefined
            ? Math.min(dossier.montantInvesti, Math.max(0, dossier.montantPaye + montantApplicable))
            : dossier.montantPaye;

        
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
            clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
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

      },

      updateClient: async (id, input) => {
        
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
          if (!ecriture.dossierId) {
            return {
              ecritures: updatedEcritures,
              clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
            };
          }
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
            clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
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

        
        const { data, error } = await supabase
          .from("ecritures")
          .insert({
            date: e.date,
            date_paiement: e.datePaiement || null,
            client_id: e.clientId,
            dossier_id: e.dossierId || null,
            societe_id: e.societeId || null,
            montant_investi: e.montantInvesti,
            montant_paye: validatedPaye,
            mode_paiement: e.modePaiement,
            note: e.note || null,
          })
          .select("*, clients(nom), societes(nom)")
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
          if (!e.dossierId) {
            return {
              ecritures: updatedEcritures,
              ecritureSeq: seq + 1,
              clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
            };
          }
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
            clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
          };
        });

        await get().addAuditLog("Comptabilité", "Création", `Écriture créée pour ${e.clientNom}`);
        return newEcriture;

      },

      // ---- Stock ----
      addStockItem: async (input) => {
        const seq = get().stockSeq;

        
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
            client_id: input.clientId || null,
            societe_id: input.societeId,
          })
          .select("*, clients(nom), societes(nom)")
          .single();

        if (error) throw error;
        const newItem = mapStockItemFromDb(data);
        set((s) => ({
          stock: [newItem, ...s.stock],
          stockSeq: seq + 1,
        }));
        await get().addAuditLog("Stock", "Création", `Article de stock créé : ${input.marchandise}`);
        return newItem;

      },

      addStockEntry: async (stockId, quantite, responsable) => {
        const stockItem = get().stock.find((s) => s.id === stockId);
        if (!stockItem) return;

        const newQty = stockItem.quantite + quantite;

        
        await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
        await supabase.from("mouvements").insert({
          stock_id: stockId,
          societe_id: stockItem.societeId,
          type: "Entrée",
          quantite,
          date: new Date().toISOString(),
          responsable,
          marchandise: stockItem.marchandise,
          unite: stockItem.unite,
          bon_ref: null,
        });


        const seq = get().mouvementSeq;
        const newMouvement: Mouvement = {
          id: `M-${seq}`,
          societeId: stockItem.societeId,
          societeNom: stockItem.societeNom,
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

      addStockExit: async (stockId, quantite, responsable, bonRef, motif) => {
        const stockItem = get().stock.find((s) => s.id === stockId);
        if (!stockItem) return;

        const newQty = Math.max(0, stockItem.quantite - quantite);

        
        await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
        await supabase.from("mouvements").insert({
          stock_id: stockId,
          societe_id: stockItem.societeId,
          type: "Sortie",
          quantite,
          date: new Date().toISOString(),
          responsable,
          marchandise: stockItem.marchandise,
          unite: stockItem.unite,
          bon_ref: bonRef || null,
          motif: motif || null,
        });


        const seq = get().mouvementSeq;
        const newMouvement: Mouvement = {
          id: `M-${seq}`,
          societeId: stockItem.societeId,
          societeNom: stockItem.societeNom,
          date: new Date().toISOString(),
          type: "Sortie",
          marchandise: stockItem.marchandise,
          quantite,
          unite: stockItem.unite,
          responsable,
          bonRef,
          motif,
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

        
        const { data, error } = await supabase
          .from("bons_sortie")
          .insert({
            reference: numero,
            date: input.date,
            client_id: input.clientId,
            societe_id: input.societeId,
            stock_id: input.stockId,
            marchandise: input.marchandise,
            quantite: input.quantite,
            unite: input.unite,
            motif: input.motif,
            montant: input.montant,
            statut: input.statut || "Brouillon",
          })
          .select("*, clients(nom), societes(nom)")
          .single();

        if (error) throw error;
        const newBon = mapBonFromDb(data);
        set((s) => ({
          bons: [newBon, ...s.bons],
          bonSeq: seq + 1,
        }));
        await get().addAuditLog("Bons", "Création", `Bon ${numero} créé`);
        return newBon;

      },

      validateBon: async (id) => {
        const bon = get().bons.find((b) => b.id === id);
        if (!bon || bon.statut === "Validé") return false;

        const stockItem = findStockForBon(get().stock, bon);
        if (!stockItem || stockItem.quantite < bon.quantite) {
          return false;
        }

        
        await supabase.from("bons_sortie").update({ statut: "Validé" }).eq("id", id);
      

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
        const permissions = normalizePermissions(input.permissions);

        
        const res = await fetchWithAuth("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            nom: input.nom,
            email: input.email,
            role: input.role,
            permissions,
            password: input.motDePasse,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de créer l'utilisateur.");

        const newUser = mapProfileFromDb(payload.user);
        set((s) => ({
          users: [newUser, ...s.users],
          userSeq: seq + 1,
        }));
        await get().addAuditLog("Utilisateurs", "Création", `Utilisateur ${input.nom} créé`);
        return newUser;
      },

      updateUser: async (id, input) => {
        const permissions = normalizePermissions(input.permissions);

        
        const res = await fetchWithAuth(`/api/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            nom: input.nom,
            email: input.email,
            role: input.role,
            permissions,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de mettre à jour l'utilisateur.");
      

        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, ...input, permissions } : u,
          ),
        }));
        await get().addAuditLog("Utilisateurs", "Modification", `Utilisateur ${input.nom} mis à jour`);
      },

      toggleUserActive: async (id) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return;

        const newStatus = !user.actif;

        
        const res = await fetchWithAuth(`/api/admin/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            nom: user.nom,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            actif: newStatus,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de modifier le statut.");
      

        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, actif: newStatus } : u)),
        }));
        await get().addAuditLog("Utilisateurs", "Modification", `Statut actif de l'utilisateur ${user.nom} basculé à ${newStatus}`);
      },

      removeUser: async (id) => {
        const user = get().users.find((u) => u.id === id);

        
        const res = await fetchWithAuth(`/api/admin/users/${id}`, { method: "DELETE" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de supprimer l'utilisateur.");
      

        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
        }));

        if (user) {
          await get().addAuditLog("Utilisateurs", "Suppression", `Utilisateur ${user.nom} supprimé`);
        }
      },

      resetUserPassword: async (id, password) => {
        
        const res = await fetchWithAuth(`/api/admin/users/${id}/password`, {
          method: "POST",
          body: JSON.stringify({ password }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Impossible de réinitialiser le mot de passe.");
      },

      updateLastLogin: async (id) => {
        
        await supabase
          .from("profiles")
          .update({ derniere_connexion: new Date().toISOString() })
          .eq("id", id);
      
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, derniereConnexion: new Date().toISOString() } : u
          ),
        }));
      },

      // ---- Sous-dossiers ----
      addSubDossier: async (input) => {
        const seq = get().subDossierSeq;

        
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

      },

      updateSubDossier: async (id, nom, description) => {
        
        const { error } = await supabase
          .from("sub_dossiers")
          .update({ nom, description })
          .eq("id", id);
        if (error) throw error;
      

        set((s) => ({
          subDossiers: s.subDossiers.map((sd) =>
            sd.id === id ? { ...sd, nom, description } : sd
          ),
        }));
      },

      deleteSubDossier: async (id) => {
        
        const { error } = await supabase.from("sub_dossiers").delete().eq("id", id);
        if (error) throw error;
      

        set((s) => ({
          subDossiers: s.subDossiers.filter((sd) => sd.id !== id),
          fichiers: s.fichiers.filter((f) => f.sousDossierId !== id),
        }));
      },

      // ---- Fichiers ----
      addFichier: async (input) => {
        const seq = get().fichierSeq;

        let storedUrl = input.dataUrl;
        if (input.dataUrl.startsWith("data:")) {
          try {
            const res = await fetch(input.dataUrl);
            const blob = await res.blob();
            const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
            const path = `${input.dossierId}/${Date.now()}-${safeName}`;
            const { error: uploadError } = await supabase.storage
              .from("dossier-fichiers")
              .upload(path, blob, {
                contentType: blob.type || "application/octet-stream",
                upsert: false,
              });
            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from("dossier-fichiers")
                .getPublicUrl(path);
              storedUrl = urlData.publicUrl;
            }
          } catch {
            // Conserver data_url en secours si le bucket n'est pas configuré
          }
        }

        const { data, error } = await supabase
          .from("dossier_fichiers")
          .insert({
            dossier_id: input.dossierId,
            sub_dossier_id: input.sousDossierId,
            nom: input.nom,
            taille: input.taille,
            type: input.type,
            data_url: storedUrl,
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

      },

      deleteFichier: async (id) => {
        
        const { error } = await supabase.from("dossier_fichiers").delete().eq("id", id);
        if (error) throw error;
      

        set((s) => ({
          fichiers: s.fichiers.filter((f) => f.id !== id),
        }));
      },

      deleteFichiersByDossier: async (dossierId) => {
        
        const { error } = await supabase.from("dossier_fichiers").delete().eq("dossier_id", dossierId);
        if (error) throw error;
      

        set((s) => ({
          fichiers: s.fichiers.filter((f) => f.dossierId !== dossierId),
        }));
      },

      // ---- Commentaires dossiers ----
      addComment: async (dossierId, texte) => {
        const seq = get().commentSeq;
        const userNom = getConnectedUserName();

        
        const { data, error } = await supabase
          .from("dossier_comments")
          .insert({
            dossier_id: dossierId,
            texte,
            user_name: userNom,
            date: new Date().toISOString(),
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

      },

      deleteComment: async (id) => {
        
        const { error } = await supabase.from("dossier_comments").delete().eq("id", id);
        if (error) throw error;
      

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
        await get().addAuditLog("Devis", "Création", `Devis ${reference} créé — Client ${newDevis.clientNom}`);
        return newDevis;

      },

      updateDevis: async (id, input) => {
        const total = Number(input.droitDouane) + Number(input.fraisCircuit) + Number(input.fraisPrestation);

        
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
      

        const existing = get().devis.find((d) => d.id === id);
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
        if (existing) {
          await get().addAuditLog("Devis", "Modification", `Devis ${existing.reference} modifié`);
        }
      },

      updateDevisStatut: async (id, statut) => {
        
        const { error } = await supabase
          .from("devis")
          .update({ statut })
          .eq("id", id);
        if (error) throw error;
      

        const existing = get().devis.find((d) => d.id === id);
        set((s) => ({
          devis: s.devis.map((d) => (d.id === id ? { ...d, statut } : d)),
        }));
        if (existing) {
          await get().addAuditLog("Devis", "Modification", `Devis ${existing.reference} → ${statut}`);
        }
      },

      expireDevisObsoletes: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const obsoletes = get().devis.filter(
          (d) => d.dateValidite < today && d.statut !== "Accepté" && d.statut !== "Refusé" && d.statut !== "Expiré"
        );

        if (obsoletes.length === 0) return;

        
        await supabase
          .from("devis")
          .update({ statut: "Expiré" })
          .in("id", obsoletes.map((o) => o.id));
      

        set((s) => ({
          devis: s.devis.map((d) =>
            d.dateValidite < today && d.statut !== "Accepté" && d.statut !== "Refusé"
              ? { ...d, statut: "Expiré" as DevisStatut }
              : d
          ),
        }));
        await get().addAuditLog(
          "Devis",
          "Modification",
          `${obsoletes.length} devis expiré${obsoletes.length !== 1 ? "s" : ""} automatiquement`,
        );
      },
      convertDevisToDossier: async (id, bl, camion) => {
        const dev = get().devis.find((d) => d.id === id);
        if (!dev || dev.dossierId) return null; // déjà converti — pas de doublon

        const inputDossier: DossierInput = {
          clientId: dev.clientId,
          clientNom: dev.clientNom,
          nature: dev.nature || `Devis ${dev.reference} : ${dev.notes || "transit"}`,
          bl,
          camion,
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
        
        const { error } = await supabase
          .from("devis")
          .update({ statut: "Accepté", dossier_id: newDossier.id })
          .eq("id", id);
        if (error) throw error;
      

        set((s) => ({
          devis: s.devis.map((d) =>
            d.id === id ? { ...d, statut: "Accepté", dossierId: newDossier.id } : d
          ),
        }));

        await get().addAuditLog(
          "Devis",
          "Validation",
          `Devis ${dev.reference} converti en dossier ${newDossier.reference}`,
        );
        return newDossier;
      },

      removeDevis: async (id) => {
        const existing = get().devis.find((d) => d.id === id);
        const { error } = await supabase.from("devis").delete().eq("id", id);
        if (error) throw error;

        set((s) => ({
          devis: s.devis.filter((d) => d.id !== id),
        }));
        if (existing) {
          await get().addAuditLog("Devis", "Suppression", `Devis ${existing.reference} supprimé`);
        }
      },

      // ---- Transporteurs ----
      addTransporteur: async (input) => {
        const seq = get().transporteurSeq;

        
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

      },

      updateTransporteur: async (id, input) => {
        
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
      

        set((s) => ({
          transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, ...input } : t)),
        }));
        await get().addAuditLog("Transporteurs", "Modification", `Transporteur ${input.nom} mis à jour`);
      },

      updateTransporteurStatut: async (id, statut) => {
        
        const { error } = await supabase
          .from("transporteurs")
          .update({ statut })
          .eq("id", id);
        if (error) throw error;
      

        set((s) => ({
          transporteurs: s.transporteurs.map((t) => (t.id === id ? { ...t, statut } : t)),
        }));
      },

      removeTransporteur: async (id) => {
        const trans = get().transporteurs.find((t) => t.id === id);
        
        const { error } = await supabase.from("transporteurs").delete().eq("id", id);
        if (error) throw error;
      

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
        const TVA = Math.round(HT * (input.tauxTVA / 100));
        const TTC = HT + TVA;
        const creePar = getConnectedUserName();

        
        const { data: dbFact, error: errFact } = await supabase
          .from("factures")
          .insert({
            numero,
            dossier_id: input.dossierId,
            client_id: input.clientId,
            societe_id: input.societeId || null,
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
          .select("*, facture_lignes(*), clients(nom), societes(nom)")
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

      },

      updateFacture: async (id, input) => {
        const HT = input.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
        const TVA = Math.round(HT * (input.tauxTVA / 100));
        const TTC = HT + TVA;

        
        const { error: errFact } = await supabase
          .from("factures")
          .update({
            dossier_id: input.dossierId,
            client_id: input.clientId,
            societe_id: input.societeId ?? null,
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
              societeId: input.societeId ?? undefined,
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
        
        const { error } = await supabase.from("factures").delete().eq("id", id);
        if (error) throw error;
      

        set((s) => {
          const updatedFactures = s.factures.filter((f) => f.id !== id);
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
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

        
        const { error } = await supabase
          .from("factures")
          .update({ statut, montant_paye: montantPaye })
          .eq("id", id);
        if (error) throw error;
      

        set((s) => {
          const updatedFactures = s.factures.map((x) =>
            x.id === id ? { ...x, statut, montantPaye } : x
          );
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
          };
        });
        
        await get().addAuditLog("Factures", "Modification", `Facture ${f.numero} → ${statut}`);
      },

      recordFacturePaiement: async (id, montant) => {
        const fact = get().factures.find((f) => f.id === id);
        if (!fact) return;

        const reste = Math.max(0, fact.montantTTC - fact.montantPaye);
        const effective = validatePaymentAmount(montant, reste);
        const newPaye = computeIncrementalPaye(fact.montantPaye, fact.montantTTC, effective);
        const newStatut: FactureStatut = newPaye >= fact.montantTTC ? "Soldée" : "Partielle";

        
        const { error } = await supabase
          .from("factures")
          .update({ montant_paye: newPaye, statut: newStatut })
          .eq("id", id);
        if (error) throw error;
      

        set((s) => {
          const updatedFactures = s.factures.map((f) =>
            f.id === id ? { ...f, montantPaye: newPaye, statut: newStatut } : f
          );
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
          };
        });

        await get().addAuditLog(
          "Factures",
          "Paiement",
          `Encaissement de ${effective.toLocaleString("fr-FR")} FCFA sur la facture ${fact.numero}`
        );
      },

      updateOwnProfile: async (id, input) => {
        const trimmedNom = input.nom.trim();
        const trimmedEmail = input.email.trim();
        if (!trimmedNom) throw new Error("Le nom est requis.");
        if (!trimmedEmail) throw new Error("L'e-mail est requis.");

        const existing = get().users.find((u) => u.id === id);
        if (!existing) throw new Error("Utilisateur introuvable.");

        
        const { error } = await supabase
          .from("profiles")
          .update({ nom: trimmedNom, email: trimmedEmail })
          .eq("id", id);
        if (error) throw error;
      

        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, nom: trimmedNom, email: trimmedEmail } : u,
          ),
        }));

        useNav.getState().setCurrentUserName(trimmedNom);
        await get().addAuditLog("Utilisateurs", "Modification", `Profil de ${trimmedNom} mis à jour`);
      },

      // ---- Fournisseurs ----
      addFournisseur: async (input) => {
        const seq = get().fournisseurSeq;

        
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

      },
      updateFournisseur: async (id, input) => {
        
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
      

        set((s) => ({
          fournisseurs: s.fournisseurs.map((f) => (f.id === id ? { ...f, ...input } : f)),
        }));
        await get().addAuditLog("Fournisseurs", "Modification", `Fournisseur ${input.nom} mis à jour`);
      },

      removeFournisseur: async (id) => {
        const fourn = get().fournisseurs.find((f) => f.id === id);
        
        const { error } = await supabase.from("fournisseurs").delete().eq("id", id);
        if (error) throw error;
      

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

      },

      updateDossierFournisseur: async (id, input) => {
        
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
      

        set((s) => {
          const updatedDf = s.dossierFournisseurs.map((df) => (df.id === id ? { ...df, ...input } : df));
          return {
            dossierFournisseurs: updatedDf,
            fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
          };
        });
      },

      removeDossierFournisseur: async (id) => {
        
        const { error } = await supabase.from("dossier_fournisseurs").delete().eq("id", id);
        if (error) throw error;
      

        set((s) => {
          const updatedDf = s.dossierFournisseurs.filter((df) => df.id !== id);
          return {
            dossierFournisseurs: updatedDf,
            fournisseurs: syncFournisseurStats(updatedDf, s.fournisseurs),
          };
        });
      },

      // ---- Contrats ----
      addContrat: async (input) => {
        const seq = get().contratSeq;
        const year = new Date().getFullYear();
        const reference = `CTR-${year}-${pad(seq, 4)}`;
        const creePar = getConnectedUserName();

        const { data, error } = await supabase
          .from("contrats")
          .insert({
            reference,
            societe_id: input.societeId,
            client_id: input.clientId,
            objet: input.objet,
            date_debut: input.dateDebut,
            date_fin: input.dateFin || null,
            montant: input.montant,
            statut: input.statut,
            notes: input.notes || null,
            cree_par: creePar,
          })
          .select("*, clients(nom), societes(nom)")
          .single();

        if (error) throw error;
        const raw = mapContratFromDb(data);
        set((s) => ({
          contrats: syncContratStats(s.depenses, s.contratPrestations, [raw, ...s.contrats]),
          contratSeq: seq + 1,
        }));
        await get().addAuditLog("Contrats", "Création", `Contrat ${reference} créé — ${input.clientNom}`);
        return get().contrats.find((c) => c.id === raw.id)!;
      },

      updateContrat: async (id, input) => {
        const { error } = await supabase
          .from("contrats")
          .update({
            societe_id: input.societeId,
            client_id: input.clientId,
            objet: input.objet,
            date_debut: input.dateDebut,
            date_fin: input.dateFin || null,
            montant: input.montant,
            statut: input.statut,
            notes: input.notes || null,
          })
          .eq("id", id);
        if (error) throw error;

        const existing = get().contrats.find((c) => c.id === id);
        const societeChanged = !!existing && existing.societeId !== input.societeId;

        // La société d'une dépense est dénormalisée depuis son contrat à la
        // création (perf/simplicité de lecture) — si le contrat change de
        // société, il faut recaler les dépenses déjà créées pour ne pas
        // fausser silencieusement le Bénéfice par société.
        if (societeChanged) {
          const { error: depensesError } = await supabase
            .from("depenses")
            .update({ societe_id: input.societeId })
            .eq("contrat_id", id);
          if (depensesError) throw depensesError;
        }

        set((s) => ({
          contrats: s.contrats.map((c) =>
            c.id === id
              ? { ...c, ...input, clientNom: input.clientNom }
              : c,
          ),
          depenses: societeChanged
            ? s.depenses.map((d) => (d.contratId === id ? { ...d, societeId: input.societeId } : d))
            : s.depenses,
        }));
        if (existing) {
          await get().addAuditLog(
            "Contrats",
            "Modification",
            societeChanged
              ? `Contrat ${existing.reference} modifié — société changée, dépenses liées recalées`
              : `Contrat ${existing.reference} modifié`,
          );
        }
      },

      updateContratStatut: async (id, statut) => {
        const { error } = await supabase.from("contrats").update({ statut }).eq("id", id);
        if (error) throw error;
        const existing = get().contrats.find((c) => c.id === id);
        set((s) => ({ contrats: s.contrats.map((c) => (c.id === id ? { ...c, statut } : c)) }));
        if (existing) {
          await get().addAuditLog("Contrats", "Modification", `Contrat ${existing.reference} → ${statut}`);
        }
      },

      removeContrat: async (id) => {
        const contrat = get().contrats.find((c) => c.id === id);
        if (!contrat) return;

        // Garde client-side — message clair AVANT l'appel réseau. La contrainte FK
        // (NO ACTION sur depenses.contrat_id / contrat_prestations.contrat_id) est
        // la garde de dernier recours côté DB en cas de course (2 onglets, etc.).
        const depensesLiees = get().depenses.filter((d) => d.contratId === id).length;
        const prestationsLiees = get().contratPrestations.filter((p) => p.contratId === id).length;
        if (depensesLiees > 0 || prestationsLiees > 0) {
          throw new Error(
            `Impossible de supprimer le contrat ${contrat.reference} : il porte ${depensesLiees} dépense(s) et ${prestationsLiees} prestation(s). Retirez-les d'abord.`,
          );
        }

        const { error } = await supabase.from("contrats").delete().eq("id", id);
        if (error) throw error;

        set((s) => ({
          contrats: s.contrats.filter((c) => c.id !== id),
          contratFichiers: s.contratFichiers.filter((f) => f.contratId !== id),
        }));
        await get().addAuditLog("Contrats", "Suppression", `Contrat ${contrat.reference} supprimé`);
      },

      getContrat: (id) => get().contrats.find((c) => c.id === id),

      // ---- Contrat — fichiers (scans, bucket privé) ----
      addContratFichier: async (input) => {
        const seq = get().contratFichierSeq;
        const res = await fetch(input.dataUrl);
        const blob = await res.blob();
        const safeName = input.nom.replace(/[^\w.\-]+/g, "_");
        const path = `${input.contratId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("contrat-fichiers")
          .upload(path, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;

        const { data, error } = await supabase
          .from("contrat_fichiers")
          .insert({
            contrat_id: input.contratId,
            nom: input.nom,
            taille: input.taille,
            type: input.type,
            storage_path: path,
          })
          .select()
          .single();
        if (error) throw error;

        const newFile = mapContratFichierFromDb(data);
        set((s) => ({ contratFichiers: [newFile, ...s.contratFichiers], contratFichierSeq: seq + 1 }));
        return newFile;
      },

      deleteContratFichier: async (id) => {
        const file = get().contratFichiers.find((f) => f.id === id);
        if (file) {
          await supabase.storage.from("contrat-fichiers").remove([file.storagePath]);
        }
        const { error } = await supabase.from("contrat_fichiers").delete().eq("id", id);
        if (error) throw error;
        set((s) => ({ contratFichiers: s.contratFichiers.filter((f) => f.id !== id) }));
      },

      getSignedContratFichierUrl: async (storagePath) => {
        const { data, error } = await supabase.storage
          .from("contrat-fichiers")
          .createSignedUrl(storagePath, 3600);
        if (error) throw error;
        return data.signedUrl;
      },

      // ---- Dépenses ----
      addDepense: async (input) => {
        const seq = get().depenseSeq;
        const contrat = get().contrats.find((c) => c.id === input.contratId);
        if (!contrat) throw new Error("Contrat introuvable.");
        const creePar = getConnectedUserName();

        let justificatifPath: string | undefined;
        if (input.justificatifDataUrl && input.justificatifNom) {
          const res = await fetch(input.justificatifDataUrl);
          const blob = await res.blob();
          const safeName = input.justificatifNom.replace(/[^\w.\-]+/g, "_");
          justificatifPath = `${input.contratId}/depenses/${Date.now()}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("contrat-fichiers")
            .upload(justificatifPath, blob, { contentType: blob.type || "application/octet-stream", upsert: false });
          if (uploadError) throw uploadError;
        }

        const { data, error } = await supabase
          .from("depenses")
          .insert({
            contrat_id: input.contratId,
            societe_id: contrat.societeId,
            libelle: input.libelle,
            montant: input.montant,
            date_depense: input.dateDepense,
            mode_paiement: input.modePaiement,
            justificatif_path: justificatifPath || null,
            note: input.note || null,
            cree_par: creePar,
          })
          .select()
          .single();
        if (error) throw error;

        const newDepense = mapDepenseFromDb(data);
        set((s) => {
          const updatedDepenses = [newDepense, ...s.depenses];
          return {
            depenses: updatedDepenses,
            depenseSeq: seq + 1,
            contrats: syncContratStats(updatedDepenses, s.contratPrestations, s.contrats),
          };
        });
        await get().addAuditLog(
          "Dépenses",
          "Création",
          `Dépense "${input.libelle}" (${input.montant.toLocaleString("fr-FR")} FCFA) — contrat ${contrat.reference}`,
        );
        return newDepense;
      },

      removeDepense: async (id) => {
        const depense = get().depenses.find((d) => d.id === id);
        if (depense?.justificatifPath) {
          await supabase.storage.from("contrat-fichiers").remove([depense.justificatifPath]);
        }
        const { error } = await supabase.from("depenses").delete().eq("id", id);
        if (error) throw error;
        set((s) => {
          const updatedDepenses = s.depenses.filter((d) => d.id !== id);
          return {
            depenses: updatedDepenses,
            contrats: syncContratStats(updatedDepenses, s.contratPrestations, s.contrats),
          };
        });
        if (depense) {
          await get().addAuditLog("Dépenses", "Suppression", `Dépense "${depense.libelle}" supprimée`);
        }
      },

      // ---- Prestations optionnelles ----
      addContratPrestation: async (input) => {
        const seq = get().contratPrestationSeq;
        const creePar = getConnectedUserName();
        const { data, error } = await supabase
          .from("contrat_prestations")
          .insert({
            contrat_id: input.contratId,
            libelle: input.libelle,
            description: input.description || null,
            montant: input.montant ?? null,
            statut: input.statut,
            date_prevue: input.datePrevue || null,
            date_realisation: input.dateRealisation || null,
            cree_par: creePar,
          })
          .select()
          .single();
        if (error) throw error;

        const newPrestation = mapContratPrestationFromDb(data);
        set((s) => {
          const updated = [newPrestation, ...s.contratPrestations];
          return {
            contratPrestations: updated,
            contratPrestationSeq: seq + 1,
            contrats: syncContratStats(s.depenses, updated, s.contrats),
          };
        });
        return newPrestation;
      },

      updateContratPrestation: async (id, input) => {
        const { error } = await supabase
          .from("contrat_prestations")
          .update({
            libelle: input.libelle,
            description: input.description,
            montant: input.montant,
            statut: input.statut,
            date_prevue: input.datePrevue,
            date_realisation: input.dateRealisation,
          })
          .eq("id", id);
        if (error) throw error;

        set((s) => {
          const updated = s.contratPrestations.map((p) => (p.id === id ? { ...p, ...input } : p));
          return { contratPrestations: updated, contrats: syncContratStats(s.depenses, updated, s.contrats) };
        });
      },

      removeContratPrestation: async (id) => {
        const { error } = await supabase.from("contrat_prestations").delete().eq("id", id);
        if (error) throw error;
        set((s) => {
          const updated = s.contratPrestations.filter((p) => p.id !== id);
          return { contratPrestations: updated, contrats: syncContratStats(s.depenses, updated, s.contrats) };
        });
      },

      // ---- Bons de sortie de caisse (décaissement — sans rapport avec le stock) ----
      addBonSortieCaisse: async (input) => {
        const seq = get().bonSortieCaisseSeq;
        const reference = `N°${seq}`;
        const creePar = getConnectedUserName();
        const montantTotal = input.lignes.reduce((sum, l) => sum + l.montant, 0);

        const { data: dbBon, error: errBon } = await supabase
          .from("bons_sortie_caisse")
          .insert({
            reference,
            date: input.date,
            montant_total: montantTotal,
            cree_par: creePar,
          })
          .select()
          .single();
        if (errBon) throw errBon;

        if (input.lignes.length > 0) {
          const { error: errLignes } = await supabase
            .from("bons_sortie_caisse_lignes")
            .insert(
              input.lignes.map((l) => ({
                bon_id: dbBon.id,
                date: l.date,
                beneficiaire: l.beneficiaire,
                motif: l.motif,
                montant: l.montant,
              })),
            );
          if (errLignes) throw errLignes;
        }

        const { data: fullBon, error: errFetch } = await supabase
          .from("bons_sortie_caisse")
          .select("*, bons_sortie_caisse_lignes(*)")
          .eq("id", dbBon.id)
          .single();
        if (errFetch) throw errFetch;

        const newBon = mapBonSortieCaisseFromDb(fullBon);
        set((s) => ({
          bonsSortieCaisse: [newBon, ...s.bonsSortieCaisse],
          bonSortieCaisseSeq: seq + 1,
        }));
        await get().addAuditLog("Bons", "Création", `Bon de sortie caisse ${reference} créé — ${montantTotal.toLocaleString("fr-FR")} FCFA`);
        return newBon;
      },

      removeBonSortieCaisse: async (id) => {
        const bon = get().bonsSortieCaisse.find((b) => b.id === id);
        const { error } = await supabase.from("bons_sortie_caisse").delete().eq("id", id);
        if (error) throw error;
        set((s) => ({ bonsSortieCaisse: s.bonsSortieCaisse.filter((b) => b.id !== id) }));
        if (bon) {
          await get().addAuditLog("Bons", "Suppression", `Bon de sortie caisse ${bon.reference} supprimé`);
        }
      },

      refetchData: async () => {
        set({ loadError: null });
        await get().fetchData();
      },
    }),
    {
      name: "sltt-data-v10",
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
        devisSeq: s.devisSeq,
        transporteurSeq: s.transporteurSeq,
        commentSeq: s.commentSeq,
        factureSeq: s.factureSeq,
        fournisseurSeq: s.fournisseurSeq,
        dossierFournisseurSeq: s.dossierFournisseurSeq,
        contratSeq: s.contratSeq,
        contratFichierSeq: s.contratFichierSeq,
        depenseSeq: s.depenseSeq,
        contratPrestationSeq: s.contratPrestationSeq,
        bonSortieCaisseSeq: s.bonSortieCaisseSeq,
      }),
    },
  ),
);
