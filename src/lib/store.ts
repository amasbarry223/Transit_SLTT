"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { getConnectedUserName } from "@/lib/store/connected-user";
import {
  createContratFichiersSlice,
  mapContratFichierFromDb,
  type ContratFichiersSlice,
} from "@/lib/store/contrat-fichiers-slice";
import { createArchivesSlice, mapArchiveFromDb, type ArchivesSlice } from "@/lib/store/archives-slice";
import {
  createDossiersSlice,
  mapDossierFromDb,
  type DossiersSlice,
} from "@/lib/store/dossiers-slice";
import {
  createTransporteursSlice,
  mapTransporteurFromDb,
  type TransporteursSlice,
} from "@/lib/store/transporteurs-slice";
import {
  createSocietesSlice,
  mapSocieteFromDb,
  type SocietesSlice,
} from "@/lib/store/societes-slice";
import {
  createUsersSlice,
  mapProfileFromDb,
  type UsersSlice,
} from "@/lib/store/users-slice";
import {
  createClientsSlice,
  mapClientFromDb,
  type ClientsSlice,
} from "@/lib/store/clients-slice";
import {
  createFournisseursSlice,
  mapFournisseurFromDb,
  mapDossierFournisseurFromDb,
  type FournisseursSlice,
} from "@/lib/store/fournisseurs-slice";
import { syncFournisseurStats } from "@/lib/fournisseur-stats";
import {
  createContratsSlice,
  mapContratFromDb,
  mapDepenseFromDb,
  mapContratPrestationFromDb,
  type ContratsSlice,
} from "@/lib/store/contrats-slice";
import {
  createDevisSlice,
  mapDevisFromDb,
  type DevisSlice,
} from "@/lib/store/devis-slice";
import { syncDossierPayeFromEcritures } from "@/lib/store/sync-helpers";
import type {
  EcritureRow,
  StockItemRow,
  MouvementRow,
  BonSortieRow,
  BonSortieCaisseRow,
  SubDossierRow,
  DossierFichierRow,
  FactureRow,
  ProfilePublicRow,
} from "@/lib/db-rows";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import { syncClientStats } from "@/lib/client-stats";
import { syncContratStats } from "@/lib/contrat-stats";
import { computeIncrementalPaye, validatePaymentAmount } from "@/lib/payments";
import { canTransitionFacture } from "@/lib/status-flow";
import {
  insertAuditLog,
  mapAuditLogFromDb,
  type AuditAction,
  type AuditEntry,
  type AuditModule,
  type AuditSourceRef,
} from "@/lib/audit";
import {
  PRESTATION_OPTIONNELLE_LABEL,
  resteAPayer,
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
  type Archive,
  type TypeDocument,
  type Facture,
  type FactureLigne,
  type FactureStatut,
} from "@/lib/domain-types";

export {
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
  Archive,
  TypeDocument,
  Facture,
  FactureLigne,
  FactureStatut,
};

export type { AuditAction, AuditModule, AuditEntry };

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

function mapEcritureFromDb(x: EcritureRow): Ecriture {
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
    modePaiement: x.mode_paiement || DEFAULT_PAIEMENT_MODE,
    note: x.note || undefined,
  };
}

function mapStockItemFromDb(x: StockItemRow): StockItem {
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

function mapMouvementFromDb(x: MouvementRow): Mouvement {
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

function mapBonFromDb(x: BonSortieRow): BonSortie {
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

function mapBonSortieCaisseFromDb(x: BonSortieCaisseRow): BonSortieCaisse {
  return {
    id: x.id,
    reference: x.reference,
    date: x.date,
    societeId: x.societe_id,
    societeNom: x.societes?.nom || "—",
    montantTotal: Number(x.montant_total),
    creePar: x.cree_par || undefined,
    creeLe: x.created_at,
    lignes: (x.bons_sortie_caisse_lignes || []).map((l) => ({
      id: l.id,
      date: l.date,
      beneficiaire: l.beneficiaire,
      motif: l.motif,
      montant: Number(l.montant),
    })),
  };
}

function mapSubDossierFromDb(x: SubDossierRow): SubDossier {
  return {
    id: x.id,
    dossierId: x.dossier_id,
    nom: x.nom,
    description: x.description,
    dateCreation: x.date_creation || new Date().toISOString(),
  };
}

function mapFichierFromDb(x: DossierFichierRow): DossierFichier {
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

function mapFactureFromDb(x: FactureRow): Facture {
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
    lignes: (x.facture_lignes || []).map((l) => ({
      id: l.id,
      description: l.description,
      quantite: Number(l.quantite),
      prixUnitaire: Number(l.prix_unitaire),
      montantHT: Number(l.montant_ht),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

function findStockForBon(stock: StockItem[], ref: { stockId?: string; marchandise: string }): StockItem | undefined {
  if (ref.stockId) return stock.find((s) => s.id === ref.stockId);
  return stock.find((s) => s.marchandise === ref.marchandise);
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

function syncSequencesFromData(state: Pick<SLTTState, keyof SequenceCounters | "dossiers" | "factures" | "bons" | "devis" | "auditLogs" | "ecritures" | "clients" | "stock" | "users" | "mouvements" | "subDossiers" | "fichiers" | "transporteurs" | "fournisseurs" | "dossierFournisseurs" | "contrats" | "contratFichiers" | "depenses" | "contratPrestations" | "bonsSortieCaisse">): SequenceCounters {
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

export interface SLTTState extends ContratFichiersSlice, ArchivesSlice, DossiersSlice, TransporteursSlice, SocietesSlice, UsersSlice, ClientsSlice, FournisseursSlice, ContratsSlice, DevisSlice {
  // Data
  ecritures: Ecriture[];
  stock: StockItem[];
  mouvements: Mouvement[];
  bons: BonSortie[];
  subDossiers: SubDossier[];
  fichiers: DossierFichier[];
  auditLogs: AuditEntry[];
  factures: Facture[];
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
  addAuditLog: (
    module: AuditModule,
    action: AuditAction,
    detail: string,
    clientId?: string,
    source?: AuditSourceRef,
  ) => Promise<void>;

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

  // ---- Sous-dossiers ----
  addSubDossier: (input: SubDossierInput) => Promise<SubDossier>;
  updateSubDossier: (id: string, nom: string, description?: string) => Promise<void>;
  deleteSubDossier: (id: string) => Promise<void>;

  // ---- Fichiers ----
  addFichier: (input: FichierInput) => Promise<DossierFichier>;
  deleteFichier: (id: string) => Promise<void>;
  deleteFichiersByDossier: (dossierId: string) => Promise<void>;

  // ---- Factures ----
  addFacture: (input: FactureInput) => Promise<Facture>;
  updateFacture: (id: string, input: FactureInput) => Promise<void>;
  removeFacture: (id: string) => Promise<void>;
  updateFactureStatut: (id: string, statut: FactureStatut) => Promise<void>;
  recordFacturePaiement: (id: string, montant: number) => Promise<void>;

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
    (set, get, api) => ({
      ...createContratFichiersSlice(set, get, api),
      ...createArchivesSlice(set, get, api),
      ...createDossiersSlice(set, get, api),
      ...createTransporteursSlice(set, get, api),
      ...createSocietesSlice(set, get, api),
      ...createUsersSlice(set, get, api),
      ...createClientsSlice(set, get, api),
      ...createFournisseursSlice(set, get, api),
      ...createContratsSlice(set, get, api),
      ...createDevisSlice(set, get, api),
      ecritures: [],
      stock: [],
      mouvements: [],
      bons: [],
      subDossiers: [],
      fichiers: [],
      factures: [],
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

          // Vue optionnelle (migration 20260722) — tant qu'elle n'est pas encore
          // appliquée en base, on dégrade sur users (ou liste vide) plutôt que
          // de faire échouer tout le chargement des données.
          let profilesPublic: ProfilePublicRow[] | null = null;
          try {
            const { data, error } = await supabase.from("profiles_public").select("*");
            if (error) throw error;
            profilesPublic = data;
          } catch {
            profilesPublic = null;
          }

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
              usersPublic: (
                profilesPublic ?? (profiles || [])
              ).map((x: ProfilePublicRow) => ({
                id: x.id,
                nom: x.nom,
                role: x.role as UserRole,
                actif: x.actif,
                derniereConnexion: x.derniere_connexion || "",
              })),
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
            supabase.from("devis").select("*, clients(nom)"),
            supabase.from("transporteurs").select("*"),
            supabase.from("fournisseurs").select("*"),
            supabase.from("dossier_fournisseurs").select("*, fournisseurs(nom, type), dossiers(reference)"),
            supabase.from("contrats").select("*, clients(nom), societes(nom)"),
            supabase.from("contrat_fichiers").select("*"),
            supabase.from("depenses").select("*"),
            supabase.from("contrat_prestations").select("*"),
            supabase.from("bons_sortie_caisse").select("*, bons_sortie_caisse_lignes(*), societes(nom)"),
            supabase.from("audit_logs").select("*").order("date", { ascending: false }),
            supabase.from("archives").select("*"),
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
            { data: archives },
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
              archives: (archives || []).map(mapArchiveFromDb),
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
      addAuditLog: async (module, action, detail, clientId, source) => {
        const seq = get().auditSeq;
        const userStr = getConnectedUserName();
        const newLog = await insertAuditLog({
          module,
          action,
          detail,
          userName: userStr,
          clientId,
          source,
        });
        if (!newLog) return;
        set((s) => ({
          auditLogs: [newLog, ...s.auditLogs],
          auditSeq: seq + 1,
        }));
      },

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

        const updatedEcrituresPreview = get().ecritures.map((e) =>
          e.id === ecritureId
            ? {
                ...e,
                montantPaye: newMontantPaye,
                modePaiement: mode,
                datePaiement: date,
                note: note || e.note,
              }
            : e,
        );

        let syncedMontantPaye: number | undefined;
        if (ecriture.dossierId) {
          const dossier = get().dossiers.find((d) => d.id === ecriture.dossierId);
          if (dossier) {
            syncedMontantPaye = await syncDossierPayeFromEcritures(
              ecriture.dossierId,
              updatedEcrituresPreview,
              dossier,
            );
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
              : e,
          );
          if (!ecriture.dossierId) {
            return {
              ecritures: updatedEcritures,
              clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
            };
          }
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === ecriture.dossierId
              ? { ...d, montantPaye: syncedMontantPaye ?? d.montantPaye }
              : d,
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
          `Paiement ${montant.toLocaleString("fr-FR")} FCFA — Écriture ${ecritureId}`,
          ecriture.clientId,
          { sourceType: "ecriture", sourceId: ecritureId },
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
        const updatedEcrituresPreview = [newEcriture, ...get().ecritures];

        let syncedMontantPaye: number | undefined;
        if (e.dossierId) {
          const dossier = get().dossiers.find((d) => d.id === e.dossierId);
          if (dossier) {
            syncedMontantPaye = await syncDossierPayeFromEcritures(
              e.dossierId,
              updatedEcrituresPreview,
              dossier,
            );
          }
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
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === e.dossierId
              ? { ...d, montantPaye: syncedMontantPaye ?? d.montantPaye }
              : d,
          );
          return {
            ecritures: updatedEcritures,
            ecritureSeq: seq + 1,
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, updatedEcritures, s.clients),
          };
        });

        await get().addAuditLog(
          "Comptabilité",
          "Création",
          `Écriture créée pour ${e.clientNom}`,
          e.clientId,
          { sourceType: "ecriture", sourceId: newEcriture.id },
        );
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

        const { error: stockErr } = await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
        if (stockErr) throw stockErr;
        const { error: mvtErr } = await supabase.from("mouvements").insert({
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
        if (mvtErr) throw mvtErr;

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

        if (quantite > stockItem.quantite) {
          throw new Error("Quantité supérieure au stock disponible.");
        }
        const newQty = stockItem.quantite - quantite;

        const { error: stockErr } = await supabase.from("stock_items").update({ quantite: newQty }).eq("id", stockId);
        if (stockErr) throw stockErr;
        const { error: mvtErr } = await supabase.from("mouvements").insert({
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
        if (mvtErr) throw mvtErr;

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
            statut: "Brouillon",
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

        if (input.statut === "Validé") {
          // Réutilise le même chemin que la validation différée : vérifie le
          // stock disponible et décrémente réellement au lieu de marquer le
          // bon "Validé" sans toucher au stock.
          const validated = await get().validateBon(newBon.id);
          if (!validated) {
            throw new Error("Stock insuffisant pour valider ce bon de sortie.");
          }
          return get().bons.find((b) => b.id === newBon.id) ?? newBon;
        }

        return newBon;
      },

      validateBon: async (id) => {
        const bon = get().bons.find((b) => b.id === id);
        if (!bon || bon.statut === "Validé") return false;

        const stockItem = findStockForBon(get().stock, bon);
        if (!stockItem || stockItem.quantite < bon.quantite) {
          return false;
        }

        const { error } = await supabase.from("bons_sortie").update({ statut: "Validé" }).eq("id", id);
        if (error) throw error;

        await get().addStockExit(stockItem.id, bon.quantite, getConnectedUserName(), bon.reference);

        set((s) => ({
          bons: s.bons.map((b) => (b.id === id ? { ...b, statut: "Validé" } : b)),
        }));
        await get().addAuditLog("Bons", "Validation", `Bon de sortie ${bon.reference} validé`);
        return true;
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
        const fichier = get().fichiers.find((f) => f.id === id);

        const { error } = await supabase.from("dossier_fichiers").delete().eq("id", id);
        if (error) throw error;

        set((s) => ({
          fichiers: s.fichiers.filter((f) => f.id !== id),
        }));
        if (fichier) {
          await get().addAuditLog("Dossiers", "Suppression", `Fichier "${fichier.nom}" supprimé`);
        }
      },

      deleteFichiersByDossier: async (dossierId) => {
        
        const { error } = await supabase.from("dossier_fichiers").delete().eq("dossier_id", dossierId);
        if (error) throw error;
      

        set((s) => ({
          fichiers: s.fichiers.filter((f) => f.dossierId !== dossierId),
        }));
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
        set((s) => {
          const updatedFactures = [newFacture, ...s.factures];
          return {
            factures: updatedFactures,
            factureSeq: seq + 1,
            clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
          };
        });
        await get().addAuditLog(
          "Factures",
          "Création",
          `Facture ${numero} créée`,
          newFacture.clientId,
          { sourceType: "facture", sourceId: newFacture.id },
        );
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

        const { error: errDeleteLignes } = await supabase.from("facture_lignes").delete().eq("facture_id", id);
        if (errDeleteLignes) throw errDeleteLignes;
        if (input.lignes.length > 0) {
          const { error: errInsertLignes } = await supabase.from("facture_lignes").insert(
            input.lignes.map((l) => ({
              facture_id: id,
              description: l.description,
              quantite: l.quantite,
              prix_unitaire: l.prixUnitaire,
              montant_ht: l.quantite * l.prixUnitaire,
            }))
          );
          if (errInsertLignes) throw errInsertLignes;
        }

        set((s) => {
          const updatedFactures = s.factures.map((fact) => {
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
          });
          return {
            factures: updatedFactures,
            clients: syncClientStats(s.dossiers, updatedFactures, s.ecritures, s.clients),
          };
        });
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
          await get().addAuditLog(
            "Factures",
            "Suppression",
            `Facture ${fact.numero} supprimée`,
            fact.clientId,
            { sourceType: "facture", sourceId: fact.id },
          );
        }
      },

      updateFactureStatut: async (id, statut) => {
        const f = get().factures.find((x) => x.id === id);
        if (!f) return;
        if (!canTransitionFacture(f.statut, statut)) {
          throw new Error(`Transition non autorisée : ${f.statut} → ${statut}.`);
        }
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
        
        await get().addAuditLog(
          "Factures",
          "Modification",
          `Facture ${f.numero} → ${statut}`,
          f.clientId,
          { sourceType: "facture", sourceId: id },
        );
      },

      recordFacturePaiement: async (id, montant) => {
        const fact = get().factures.find((f) => f.id === id);
        if (!fact) return;
        if (fact.statut === "Brouillon" || fact.statut === "Annulée" || fact.statut === "Soldée") {
          throw new Error(`Impossible d'enregistrer un paiement sur une facture ${fact.statut}.`);
        }

        const reste = resteAPayer({ montantInvesti: fact.montantTTC, montantPaye: fact.montantPaye });
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
          `Encaissement de ${effective.toLocaleString("fr-FR")} FCFA sur la facture ${fact.numero}`,
          fact.clientId,
          { sourceType: "facture", sourceId: fact.id },
        );
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
            societe_id: input.societeId,
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
          .select("*, bons_sortie_caisse_lignes(*), societes(nom)")
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
