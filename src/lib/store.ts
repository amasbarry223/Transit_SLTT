"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import {
  createContratFichiersSlice,
  type ContratFichiersSlice,
} from "@/lib/store/contrat-fichiers-slice";
import { createArchivesSlice, type ArchivesSlice } from "@/lib/store/archives-slice";
import {
  createDocumentsSlice,
  type DocumentsSlice,
} from "@/lib/store/documents-slice";
import {
  createExcelWorkbooksSlice,
  type ExcelWorkbooksSlice,
} from "@/lib/store/excel-workbooks-slice";
import {
  createDossiersSlice,
  type DossiersSlice,
} from "@/lib/store/dossiers-slice";
import {
  createTransporteursSlice,
  type TransporteursSlice,
} from "@/lib/store/transporteurs-slice";
import {
  createSocietesSlice,
  type SocietesSlice,
} from "@/lib/store/societes-slice";
import {
  createAnnexesSlice,
  type AnnexesSlice,
} from "@/lib/store/annexes-slice";
import {
  createUsersSlice,
  type UsersSlice,
} from "@/lib/store/users-slice";
import {
  createClientsSlice,
  type ClientsSlice,
} from "@/lib/store/clients-slice";
import {
  createFournisseursSlice,
  type FournisseursSlice,
} from "@/lib/store/fournisseurs-slice";
import {
  createContratsSlice,
  type ContratsSlice,
} from "@/lib/store/contrats-slice";
import {
  createDevisSlice,
  type DevisSlice,
} from "@/lib/store/devis-slice";
import {
  createFacturesSlice,
  type FacturesSlice,
} from "@/lib/store/factures-slice";
import {
  createStockSlice,
  type StockSlice,
} from "@/lib/store/stock-slice";
import {
  createBonsSlice,
  type BonsSlice,
} from "@/lib/store/bons-slice";
import { createAuditSlice, type AuditSlice } from "@/lib/store/audit-slice";
import { createEcrituresSlice, type EcrituresSlice } from "@/lib/store/ecritures-slice";
import { createFichiersSlice, type FichiersSlice } from "@/lib/store/fichiers-slice";
import { createDataFetchSlice, type DataFetchSlice } from "@/lib/store/data-fetch-slice";
import {
  type AuditAction,
  type AuditEntry,
  type AuditModule,
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
  type Annexe,
  type AnnexeInput,
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
  Annexe,
  AnnexeInput,
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
  annexeId: string;
  date: string;
  dateEcheance: string;
  lignes: Array<{
    description: string;
    quantite: number;
    prixUnitaire: number;
    compagnie?: string;
    bordereauLivraison?: string;
  }>;
  tauxTVA: number;
  notes: string;
}

export interface DossierInput {
  societeId: string;
  annexeId: string;
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
  annexeId: string;
}

export interface BonInput {
  date: string;
  clientId: string;
  clientNom: string;
  societeId: string;
  annexeId: string;
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
  annexeId: string;
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
  annexeIds: string[];
}

export interface SLTTState extends ContratFichiersSlice, ArchivesSlice, DocumentsSlice, ExcelWorkbooksSlice, DossiersSlice, TransporteursSlice, SocietesSlice, AnnexesSlice, UsersSlice, ClientsSlice, FournisseursSlice, ContratsSlice, DevisSlice, FacturesSlice, StockSlice, BonsSlice, AuditSlice, EcrituresSlice, FichiersSlice, DataFetchSlice {
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
      ...createAnnexesSlice(set, get, api),
      ...createUsersSlice(set, get, api),
      ...createClientsSlice(set, get, api),
      ...createFournisseursSlice(set, get, api),
      ...createContratsSlice(set, get, api),
      ...createDevisSlice(set, get, api),
      ...createFacturesSlice(set, get, api),
      ...createStockSlice(set, get, api),
      ...createBonsSlice(set, get, api),
      ...createAuditSlice(set, get, api),
      ...createEcrituresSlice(set, get, api),
      ...createFichiersSlice(set, get, api),
      ...createDataFetchSlice(set, get, api),
      ...INITIAL_SEQUENCES,
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

