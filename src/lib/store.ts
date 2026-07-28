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
  createDocumentsSlice,
  mapDocumentFromDb,
  mapDocumentVersionFromDb,
  mapOcrJobFromDb,
  mapOcrFieldFromDb,
  type DocumentsSlice,
} from "@/lib/store/documents-slice";
import {
  createExcelWorkbooksSlice,
  type ExcelWorkbooksSlice,
} from "@/lib/store/excel-workbooks-slice";
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
import {
  createFacturesSlice,
  mapFactureFromDb,
  type FacturesSlice,
} from "@/lib/store/factures-slice";
import {
  createStockSlice,
  mapMouvementFromDb,
  mapStockItemFromDb,
  type StockSlice,
} from "@/lib/store/stock-slice";
import {
  createBonsSlice,
  mapBonFromDb,
  mapBonSortieCaisseFromDb,
  type BonsSlice,
} from "@/lib/store/bons-slice";
import { syncDossierPayeFromEcritures } from "@/lib/store/sync-helpers";
import {
  FETCH_SOFT_CAPS,
  fetchAllPaged,
  pagedSelect,
} from "@/lib/store/fetch-pages";
import type {
  EcritureRow,
  SubDossierRow,
  DossierFichierRow,
  ProfilePublicRow,
} from "@/lib/db-rows";
import { DEFAULT_PAIEMENT_MODE } from "@/lib/constants";
import { syncClientStats } from "@/lib/client-stats";
import { syncContratStats } from "@/lib/contrat-stats";
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
  societeId: string;
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

export interface SLTTState extends ContratFichiersSlice, ArchivesSlice, DocumentsSlice, ExcelWorkbooksSlice, DossiersSlice, TransporteursSlice, SocietesSlice, UsersSlice, ClientsSlice, FournisseursSlice, ContratsSlice, DevisSlice, FacturesSlice, StockSlice, BonsSlice {
  // Data
  ecritures: Ecriture[];
  subDossiers: SubDossier[];
  fichiers: DossierFichier[];
  auditLogs: AuditEntry[];

  // Counters for local reference fallback
  dossierSeq: number;
  auditSeq: number;
  ecritureSeq: number;
  clientSeq: number;
  userSeq: number;
  subDossierSeq: number;
  fichierSeq: number;
  devisSeq: number;
  transporteurSeq: number;
  fournisseurSeq: number;
  dossierFournisseurSeq: number;
  contratSeq: number;
  contratFichierSeq: number;
  depenseSeq: number;
  contratPrestationSeq: number;

  // Supabase sync
  dataLoading: boolean;
  loadError: string | null;
  /** Échec non bloquant d'une des requêtes secondaires (stock, bons, devis, contrats…) : les données core ont chargé mais certains écrans peuvent être incomplets/obsolètes. */
  partialLoadWarning: string | null;
  lastSyncedAt: number | null;
  fetchData: () => Promise<void>;
  clearLoadError: () => void;
  clearPartialLoadWarning: () => void;

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
  /** Patch partiel écriture (classeur éditable). */
  patchEcriture: (
    id: string,
    patch: { note?: string; montantInvesti?: number; montantPaye?: number },
  ) => Promise<void>;
  /** Patch montants / libellé dossier (classeur éditable). */
  patchDossierClasseur: (
    id: string,
    patch: { montantInvesti?: number; montantPaye?: number; nature?: string; bl?: string },
  ) => Promise<void>;
  // ---- Sous-dossiers ----
  addSubDossier: (input: SubDossierInput) => Promise<SubDossier>;
  updateSubDossier: (id: string, nom: string, description?: string) => Promise<void>;
  deleteSubDossier: (id: string) => Promise<void>;

  // ---- Fichiers ----
  addFichier: (input: FichierInput) => Promise<DossierFichier>;
  deleteFichier: (id: string) => Promise<void>;
  deleteFichiersByDossier: (dossierId: string) => Promise<void>;

  refetchData: () => Promise<void>;
}

const INITIAL_SEQUENCES = {
  dossierSeq: 1,
  auditSeq: 1,
  ecritureSeq: 1,
  clientSeq: 1,
  userSeq: 1,
  subDossierSeq: 1,
  fichierSeq: 1,
  devisSeq: 1,
  transporteurSeq: 1,
  fournisseurSeq: 1,
  dossierFournisseurSeq: 1,
  contratSeq: 1,
  contratFichierSeq: 1,
  depenseSeq: 1,
  contratPrestationSeq: 1,
} as const;

export const useStore = create<SLTTState>()(
  persist(
    (set, get, api) => ({
      ...createContratFichiersSlice(set, get, api),
      ...createArchivesSlice(set, get, api),
      ...createDocumentsSlice(set, get, api),
      ...createExcelWorkbooksSlice(set, get, api),
      ...createDossiersSlice(set, get, api),
      ...createTransporteursSlice(set, get, api),
      ...createSocietesSlice(set, get, api),
      ...createUsersSlice(set, get, api),
      ...createClientsSlice(set, get, api),
      ...createFournisseursSlice(set, get, api),
      ...createContratsSlice(set, get, api),
      ...createDevisSlice(set, get, api),
      ...createFacturesSlice(set, get, api),
      ...createStockSlice(set, get, api),
      ...createBonsSlice(set, get, api),
      ecritures: [],
      subDossiers: [],
      fichiers: [],
      auditLogs: [],
      dataLoading: false,
      loadError: null,
      partialLoadWarning: null,
      lastSyncedAt: null,
      ...INITIAL_SEQUENCES,

      clearLoadError: () => set({ loadError: null }),
      clearPartialLoadWarning: () => set({ partialLoadWarning: null }),

      fetchData: async () => {
        set({ dataLoading: true, loadError: null, partialLoadWarning: null });
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
            fetchAllPaged(() => pagedSelect(supabase, "clients", "*"), { softCap: 2_000 }),
            fetchAllPaged(
              () => pagedSelect(supabase, "dossiers", "*, clients(nom), societes(nom)"),
              { softCap: 2_000 },
            ),
            fetchAllPaged(
              () => pagedSelect(supabase, "ecritures", "*, clients(nom), societes(nom)"),
              { softCap: 2_000 },
            ),
            fetchAllPaged(
              () =>
                pagedSelect(
                  supabase,
                  "factures",
                  "*, facture_lignes(*), clients(nom), societes(nom)",
                ),
              { softCap: 2_000 },
            ),
            fetchAllPaged(() => pagedSelect(supabase, "profiles", "*"), { softCap: 500 }),
            fetchAllPaged(() => pagedSelect(supabase, "societes", "*"), { softCap: 100 }),
          ]);

          const coreError = coreResults.find((r) => r.error)?.error;
          if (coreError) throw coreError;

          const [
            { data: clients, truncated: truncClients },
            { data: dossiers, truncated: truncDossiers },
            { data: ecritures, truncated: truncEcritures },
            { data: factures, truncated: truncFactures },
            { data: profiles },
            { data: societes },
          ] = coreResults;

          const coreTruncated =
            truncClients || truncDossiers || truncEcritures || truncFactures;

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

          const mappedClients = (clients as any[]).map(mapClientFromDb);
          const mappedDossiers = (dossiers as any[]).map(mapDossierFromDb);
          const mappedFactures = (factures as any[]).map(mapFactureFromDb);
          const mappedEcritures = (ecritures as any[]).map(mapEcritureFromDb);

          set((s) => {
            const nextState = {
              ...s,
              clients: syncClientStats(mappedDossiers, mappedFactures, mappedEcritures, mappedClients),
              dossiers: mappedDossiers,
              ecritures: mappedEcritures,
              factures: mappedFactures,
              users: (profiles as any[]).map(mapProfileFromDb),
              usersPublic: (
                profilesPublic ?? (profiles as any[])
              ).map((x: ProfilePublicRow) => ({
                id: x.id,
                nom: x.nom,
                role: x.role as UserRole,
                actif: x.actif,
                derniereConnexion: x.derniere_connexion || "",
              })),
              societes: (societes as any[]).map(mapSocieteFromDb),
              loadError: null,
              dataLoading: false,
            };
            return {
              ...nextState,
              ...syncSequencesFromData(nextState),
            };
          });

          const secondarySpecs = [
            {
              key: "stock",
              q: () =>
                fetchAllPaged(
                  () => pagedSelect(supabase, "stock_items", "*, clients(nom), societes(nom)"),
                  { softCap: 2_000 },
                ),
            },
            {
              key: "mouvements",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(supabase, "mouvements", "*, societes(nom)", {
                      column: "date",
                      ascending: false,
                    }),
                  { softCap: FETCH_SOFT_CAPS.mouvements },
                ),
            },
            {
              key: "bons",
              q: () =>
                fetchAllPaged(
                  () => pagedSelect(supabase, "bons_sortie", "*, clients(nom), societes(nom)"),
                  { softCap: 2_000 },
                ),
            },
            {
              key: "subDossiers",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "sub_dossiers", "*"), { softCap: 2_000 }),
            },
            {
              key: "fichiers",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "dossier_fichiers", "*"), {
                  softCap: 2_000,
                }),
            },
            {
              key: "devis",
              q: () =>
                fetchAllPaged(
                  () => pagedSelect(supabase, "devis", "*, clients(nom)"),
                  { softCap: 2_000 },
                ),
            },
            {
              key: "transporteurs",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "transporteurs", "*"), { softCap: 1_000 }),
            },
            {
              key: "fournisseurs",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "fournisseurs", "*"), { softCap: 2_000 }),
            },
            {
              key: "dossierFournisseurs",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(
                      supabase,
                      "dossier_fournisseurs",
                      "*, fournisseurs(nom, type), dossiers(reference)",
                    ),
                  { softCap: 2_000 },
                ),
            },
            {
              key: "contrats",
              q: () =>
                fetchAllPaged(
                  () => pagedSelect(supabase, "contrats", "*, clients(nom), societes(nom)"),
                  { softCap: 2_000 },
                ),
            },
            {
              key: "contratFichiers",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "contrat_fichiers", "*"), {
                  softCap: 2_000,
                }),
            },
            {
              key: "depenses",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "depenses", "*"), { softCap: 2_000 }),
            },
            {
              key: "contratPrestations",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "contrat_prestations", "*"), {
                  softCap: 2_000,
                }),
            },
            {
              key: "bonsSortieCaisse",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(
                      supabase,
                      "bons_sortie_caisse",
                      "*, bons_sortie_caisse_lignes(*), societes(nom)",
                    ),
                  { softCap: 2_000 },
                ),
            },
            {
              key: "auditLogs",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(supabase, "audit_logs", "*", {
                      column: "date",
                      ascending: false,
                    }),
                  { softCap: FETCH_SOFT_CAPS.audit_logs },
                ),
            },
            {
              key: "archives",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "archives", "*"), { softCap: 1_000 }),
            },
            {
              key: "documents",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(supabase, "documents", "*", {
                      column: "created_at",
                      ascending: false,
                    }),
                  { softCap: FETCH_SOFT_CAPS.documents },
                ),
            },
            {
              key: "documentVersions",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(supabase, "document_versions", "*", {
                      column: "created_at",
                      ascending: false,
                    }),
                  { softCap: FETCH_SOFT_CAPS.document_versions },
                ),
            },
            {
              key: "ocrJobs",
              q: () =>
                fetchAllPaged(
                  () =>
                    pagedSelect(supabase, "ocr_jobs", "*", {
                      column: "created_at",
                      ascending: false,
                    }),
                  { softCap: FETCH_SOFT_CAPS.ocr_jobs },
                ),
            },
            {
              key: "ocrFields",
              q: () =>
                fetchAllPaged(() => pagedSelect(supabase, "ocr_fields", "*"), {
                  softCap: FETCH_SOFT_CAPS.ocr_fields,
                }),
            },
          ] as const;

          const secondaryResults = await Promise.all(
            secondarySpecs.map(async (spec) => {
              try {
                const res = await spec.q();
                return {
                  key: spec.key,
                  data: res.data,
                  error: res.error,
                  truncated: res.truncated,
                };
              } catch (e) {
                return {
                  key: spec.key,
                  data: null,
                  error: e instanceof Error ? e : { message: String(e) },
                  truncated: false,
                };
              }
            }),
          );

          const failed = secondaryResults.filter((r) => r.error);
          const anyTruncated =
            coreTruncated || secondaryResults.some((r) => r.truncated && !r.error);
          if (failed.length > 0) {
            console.warn(
              "[SLTT] Chargement secondaire partiel:",
              failed.map((f) => `${f.key}: ${f.error?.message || f.error}`),
            );
            set({
              partialLoadWarning:
                "Certaines données n'ont pas pu être rechargées ; l'affichage conserve le cache précédent pour ces modules.",
            });
          } else if (anyTruncated) {
            set({
              partialLoadWarning:
                "Volume important : certaines listes sont plafonnées côté client. Affinez les filtres ou archivez les anciens enregistrements.",
            });
          } else {
            set({ partialLoadWarning: null });
          }

          const byKey = Object.fromEntries(
            secondaryResults.map((r) => [r.key, r]),
          ) as unknown as Record<
            (typeof secondarySpecs)[number]["key"],
            { key: string; data: unknown[] | null; error: unknown }
          >;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ok = <T,>(key: (typeof secondarySpecs)[number]["key"], map: (rows: any[]) => T, fallback: T): T => {
            const r = byKey[key];
            if (r?.error || r?.data == null) return fallback;
            return map(r.data);
          };

          set((s) => {
            const mappedFournisseurs = ok(
              "fournisseurs",
              (rows) => rows.map(mapFournisseurFromDb),
              s.fournisseurs,
            );
            const mappedDossierFournisseurs = ok(
              "dossierFournisseurs",
              (rows) => rows.map(mapDossierFournisseurFromDb),
              s.dossierFournisseurs,
            );
            const mappedDepenses = ok("depenses", (rows) => rows.map(mapDepenseFromDb), s.depenses);
            const mappedPrestations = ok(
              "contratPrestations",
              (rows) => rows.map(mapContratPrestationFromDb),
              s.contratPrestations,
            );
            const mappedContratsRaw = ok("contrats", (rows) => rows.map(mapContratFromDb), s.contrats);

            const ocrFieldsRows = ok("ocrFields", (rows) => rows, null as unknown[] | null);
            const ocrJobsRows = ok("ocrJobs", (rows) => rows, null as unknown[] | null);

            let nextOcrJobs = s.ocrJobs;
            if (ocrJobsRows && ocrFieldsRows) {
              const fieldsByJob = new Map<string, ReturnType<typeof mapOcrFieldFromDb>[]>();
              for (const raw of ocrFieldsRows) {
                const f = mapOcrFieldFromDb(raw);
                const list = fieldsByJob.get(f.ocrJobId) || [];
                list.push(f);
                fieldsByJob.set(f.ocrJobId, list);
              }
              nextOcrJobs = ocrJobsRows.map((j) =>
                mapOcrJobFromDb(j, fieldsByJob.get((j as { id: string }).id) || []),
              );
            }

            const nextState = {
              ...s,
              stock: ok("stock", (rows) => rows.map(mapStockItemFromDb), s.stock),
              mouvements: ok("mouvements", (rows) => rows.map(mapMouvementFromDb), s.mouvements),
              bons: ok("bons", (rows) => rows.map(mapBonFromDb), s.bons),
              subDossiers: ok("subDossiers", (rows) => rows.map(mapSubDossierFromDb), s.subDossiers),
              fichiers: ok("fichiers", (rows) => rows.map(mapFichierFromDb), s.fichiers),
              devis: ok("devis", (rows) => rows.map(mapDevisFromDb), s.devis),
              transporteurs: ok("transporteurs", (rows) => rows.map(mapTransporteurFromDb), s.transporteurs),
              fournisseurs: byKey.fournisseurs?.error
                ? s.fournisseurs
                : syncFournisseurStats(mappedDossierFournisseurs, mappedFournisseurs),
              dossierFournisseurs: mappedDossierFournisseurs,
              contrats: byKey.contrats?.error
                ? s.contrats
                : syncContratStats(mappedDepenses, mappedPrestations, mappedContratsRaw),
              contratFichiers: ok("contratFichiers", (rows) => rows.map(mapContratFichierFromDb), s.contratFichiers),
              depenses: mappedDepenses,
              contratPrestations: mappedPrestations,
              bonsSortieCaisse: ok(
                "bonsSortieCaisse",
                (rows) => rows.map(mapBonSortieCaisseFromDb),
                s.bonsSortieCaisse,
              ),
              auditLogs: ok("auditLogs", (rows) => rows.map(mapAuditLogFromDb), s.auditLogs),
              archives: ok("archives", (rows) => rows.map(mapArchiveFromDb), s.archives),
              documents: ok("documents", (rows) => rows.map(mapDocumentFromDb), s.documents),
              documentVersions: ok(
                "documentVersions",
                (rows) => rows.map(mapDocumentVersionFromDb),
                s.documentVersions,
              ),
              ocrJobs: nextOcrJobs,
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

        const { data, error } = await supabase.rpc("record_ecriture_paiement", {
          p_ecriture_id: ecritureId,
          p_montant: montant,
          p_mode: mode,
          p_date: date,
          p_note: note || null,
        });
        if (error) throw error;
        const row = data as {
          montant_paye: number;
          mode_paiement: string;
          date_paiement: string;
          note: string | null;
          dossier_id: string | null;
        };

        set((s) => {
          const updatedEcritures = s.ecritures.map((e) =>
            e.id === ecritureId
              ? {
                  ...e,
                  montantPaye: Number(row.montant_paye),
                  modePaiement: (row.mode_paiement || mode) as typeof e.modePaiement,
                  datePaiement: row.date_paiement || date,
                  note: row.note || note || e.note,
                }
              : e,
          );
          let updatedDossiers = s.dossiers;
          if (row.dossier_id) {
            const sumPaye = updatedEcritures
              .filter((e) => e.dossierId === row.dossier_id)
              .reduce((acc, e) => acc + e.montantPaye, 0);
            updatedDossiers = s.dossiers.map((d) =>
              d.id === row.dossier_id ? { ...d, montantPaye: sumPaye } : d,
            );
          }
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

      patchEcriture: async (id, patch) => {
        const existing = get().ecritures.find((e) => e.id === id);
        if (!existing) throw new Error("Écriture introuvable");
        const payload: Record<string, unknown> = {};
        if (patch.note !== undefined) payload.note = patch.note;
        if (patch.montantInvesti !== undefined) payload.montant_investi = Math.max(0, patch.montantInvesti);
        if (patch.montantPaye !== undefined) payload.montant_paye = Math.max(0, patch.montantPaye);

        const { error } = await supabase.from("ecritures").update(payload).eq("id", id);
        if (error) throw error;

        set((s) => {
          const updatedEcritures = s.ecritures.map((e) =>
            e.id === id
              ? {
                  ...e,
                  note: patch.note ?? e.note,
                  montantInvesti: patch.montantInvesti ?? e.montantInvesti,
                  montantPaye: patch.montantPaye ?? e.montantPaye,
                }
              : e,
          );
          return {
            ecritures: updatedEcritures,
            clients: syncClientStats(s.dossiers, s.factures, updatedEcritures, s.clients),
          };
        });

        await get().addAuditLog(
          "Comptabilité",
          "Modification",
          `Écriture ${id.slice(0, 8)} modifiée (classeur)`,
          existing.clientId,
          { sourceType: "ecriture", sourceId: id },
        );
      },

      patchDossierClasseur: async (id, patch) => {
        const existing = get().dossiers.find((d) => d.id === id);
        if (!existing) throw new Error("Dossier introuvable");
        const payload: Record<string, unknown> = {};
        if (patch.montantInvesti !== undefined) payload.montant_investi = Math.max(0, patch.montantInvesti);
        if (patch.montantPaye !== undefined) payload.montant_paye = Math.max(0, patch.montantPaye);
        if (patch.nature !== undefined) payload.nature = patch.nature;
        if (patch.bl !== undefined) payload.bl = patch.bl;

        const { error } = await supabase.from("dossiers").update(payload).eq("id", id);
        if (error) throw error;

        set((s) => {
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === id
              ? {
                  ...d,
                  montantInvesti: patch.montantInvesti ?? d.montantInvesti,
                  montantPaye: patch.montantPaye ?? d.montantPaye,
                  nature: patch.nature ?? d.nature,
                  bl: patch.bl ?? d.bl,
                }
              : d,
          );
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.factures, s.ecritures, s.clients),
          };
        });

        await get().addAuditLog(
          "Dossiers",
          "Modification",
          `Dossier ${existing.reference} modifié (classeur)`,
          existing.clientId,
          { sourceType: "dossier", sourceId: id },
        );
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
        await get().addAuditLog("Dossiers", "Création", `Sous-dossier "${newSd.nom}" créé`);
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
        await get().addAuditLog("Dossiers", "Modification", `Sous-dossier "${nom}" modifié`);
      },

      deleteSubDossier: async (id) => {
        const subDossier = get().subDossiers.find((sd) => sd.id === id);

        const { error } = await supabase.from("sub_dossiers").delete().eq("id", id);
        if (error) throw error;


        set((s) => ({
          subDossiers: s.subDossiers.filter((sd) => sd.id !== id),
          fichiers: s.fichiers.filter((f) => f.sousDossierId !== id),
        }));
        if (subDossier) {
          await get().addAuditLog("Dossiers", "Suppression", `Sous-dossier "${subDossier.nom}" supprimé`);
        }
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
        await get().addAuditLog("Dossiers", "Création", `Fichier "${newFile.nom}" ajouté`);
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
