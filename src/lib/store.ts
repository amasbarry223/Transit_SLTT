"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useNav } from "@/lib/nav-store";
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
} from "@/lib/mock-data";

export type {
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
  | "Stock"
  | "Bons"
  | "Clients"
  | "Transporteurs"
  | "Utilisateurs";

export type AuditEntry = {
  id: string;
  date: string;
  user: string;
  module: AuditModule;
  action: AuditAction;
  detail: string;
  ip: string;
};

/** Input for creating/editing a dossier (without generated id/reference). */
export interface DossierInput {
  clientId: string;
  clientNom: string;
  nature: string;
  bl: string;
  camion: string;
  date: string;
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

/** Retrouve l'article de stock lié à un bon : par id si disponible (fiable), sinon par nom (bons historiques). */
function findStockForBon(stock: StockItem[], ref: { stockId?: string; marchandise: string }): StockItem | undefined {
  if (ref.stockId) return stock.find((s) => s.id === ref.stockId);
  return stock.find((s) => s.marchandise === ref.marchandise);
}

function syncClientStats(dossiers: Dossier[], clients: Client[]): Client[] {
  return clients.map((c) => {
    const cd = dossiers.filter((d) => d.clientId === c.id);
    return {
      ...c,
      nbDossiers: cd.length,
      totalPaye: cd.reduce((s, d) => s + d.montantPaye, 0),
      totalDu: cd.reduce((s, d) => s + Math.max(0, d.montantInvesti - d.montantPaye), 0),
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

  // Counters for reference generation
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

  // ---- Audit ----
  addAuditLog: (module: AuditModule, action: AuditAction, detail: string) => void;

  // ---- Dossiers ----
  addDossier: (input: DossierInput) => Dossier;
  updateDossier: (id: string, input: DossierInput) => void;
  removeDossier: (id: string) => void;
  getDossier: (id: string) => Dossier | undefined;
  transitionDossier: (id: string, newStatut: DossierStatut, montantRecu?: number, modePaiement?: PaiementMode, transitionNote?: string) => void;

  // ---- Clients ----
  addClient: (input: ClientInput) => Client;
  updateClient: (id: string, input: ClientInput) => void;
  getClient: (id: string) => Client | undefined;

  // ---- Comptabilité ----
  recordPayment: (
    ecritureId: string,
    montant: number,
    mode: PaiementMode,
    date: string,
    note: string,
  ) => void;
  addEcriture: (e: Omit<Ecriture, "id">) => Ecriture;

  // ---- Stock ----
  addStockItem: (input: StockItemInput) => StockItem;
  addStockEntry: (stockId: string, quantite: number, responsable: string) => void;
  addStockExit: (stockId: string, quantite: number, responsable: string, bonRef?: string) => void;

  // ---- Bons de sortie ----
  addBon: (input: BonInput) => BonSortie;
  /** Valide un bon brouillon et décrémente le stock. Retourne false si le stock disponible était insuffisant (quantité ramenée à 0). */
  validateBon: (id: string) => boolean;

  // ---- Users ----
  addUser: (input: UserInput) => User;
  updateUser: (id: string, input: UserInput) => void;
  toggleUserActive: (id: string) => void;
  removeUser: (id: string) => void;
  updateLastLogin: (id: string) => void;

  // ---- Sous-dossiers ----
  addSubDossier: (input: SubDossierInput) => SubDossier;
  updateSubDossier: (id: string, nom: string, description?: string) => void;
  deleteSubDossier: (id: string) => void;

  // ---- Fichiers ----
  addFichier: (input: FichierInput) => DossierFichier;
  deleteFichier: (id: string) => void;
  deleteFichiersByDossier: (dossierId: string) => void;

  // ---- Commentaires dossiers ----
  comments: DossierComment[];
  commentSeq: number;
  addComment: (dossierId: string, texte: string) => DossierComment;
  deleteComment: (id: string) => void;

  // ---- Devis ----
  devis: Devis[];
  devisSeq: number;
  addDevis: (input: DevisInput) => Devis;
  updateDevis: (id: string, input: DevisInput) => void;
  updateDevisStatut: (id: string, statut: DevisStatut) => void;
  /** LM-06: Met à jour en store les devis dont la date de validité est dépassée et le statut non terminal. */
  expireDevisObsoletes: () => void;
  convertDevisToDossier: (id: string) => Dossier | null;
  removeDevis: (id: string) => void;

  // ---- Transporteurs ----
  transporteurs: Transporteur[];
  transporteurSeq: number;
  addTransporteur: (input: TransporteurInput) => Transporteur;
  updateTransporteur: (id: string, input: TransporteurInput) => void;
  updateTransporteurStatut: (id: string, statut: TransporteurStatut) => void;
  removeTransporteur: (id: string) => void;

  // ---- Reset ----
  resetAll: () => void;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

/** Séquences initiales partagées entre l'initialisation et resetAll (ARCH-04). */
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
      auditLogs: initialAuditLogs,
      ...INITIAL_SEQUENCES,

      // ---- Audit ----
      addAuditLog: (module, action, detail) => {
        const seq = get().auditSeq;
        const id = `A-${pad(seq, 3)}`;
        const newLog: AuditEntry = {
          id,
          date: new Date().toISOString(),
          user: getConnectedUserName(),
          module,
          action,
          detail,
          ip: "N/A",
        };
        set((s) => ({
          auditLogs: [newLog, ...s.auditLogs],
          auditSeq: seq + 1,
        }));
      },

      // ---- Dossiers ----
      addDossier: (input) => {
        const seq = get().dossierSeq;
        const id = `D-${pad(seq, 4)}`;
        const year = new Date().getFullYear();
        const reference = `SLTT-TR-${year}-${pad(seq, 4)}`;
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
            clients: syncClientStats(updatedDossiers, s.clients),
          };
        });
        get().addAuditLog("Dossiers", "Création", `Dossier ${reference} créé — Client ${input.clientNom}`);
        return newDossier;
      },
      updateDossier: (id, input) => {
        const existing = get().dossiers.find((d) => d.id === id);
        set((s) => {
          const updatedDossiers = s.dossiers.map((d) => d.id === id ? { ...d, ...input } : d);
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.clients),
          };
        });
        if (existing) {
          get().addAuditLog("Dossiers", "Modification", `Dossier ${existing.reference} modifié`);
        }
      },
      removeDossier: (id) => {
        const dossier = get().dossiers.find((d) => d.id === id);
        set((s) => {
          const updatedDossiers = s.dossiers.filter((d) => d.id !== id);
          return {
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.clients),
            ecritures: s.ecritures.filter((e) => e.dossierId !== id),
            fichiers: s.fichiers.filter((f) => f.dossierId !== id),
            subDossiers: s.subDossiers.filter((sd) => sd.dossierId !== id),
            comments: s.comments.filter((c) => c.dossierId !== id),
          };
        });
        if (dossier) {
          // LM-04 Option B: BonSortie n'a pas de champ dossierId — pas de nettoyage possible.
          // On logue les bons orphelins potentiels pour traçabilité.
          const orphanBons = get().bons.filter((b) => b.reference.includes(dossier.reference));
          const orphanNote = orphanBons.length > 0 ? ` — ${orphanBons.length} bon(s) potentiellement orphelin(s) à vérifier` : "";
          get().addAuditLog("Dossiers", "Suppression", `Dossier ${dossier.reference} supprimé — Client ${dossier.clientNom}${orphanNote}`);
        }
      },
      getDossier: (id) => get().dossiers.find((d) => d.id === id),
      transitionDossier: (id, newStatut, montantRecu, modePaiement, transitionNote) => {
        const dossier = get().dossiers.find((d) => d.id === id);
        if (!dossier) return;
        const updatedMontantPaye =
          montantRecu !== undefined
            ? Math.min(dossier.montantInvesti, dossier.montantPaye + montantRecu)
            : dossier.montantPaye;

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
              // Met à jour l'écriture existante plutôt que d'en créer une nouvelle
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
            clients: syncClientStats(updatedDossiers, s.clients),
          };
        });
        get().addAuditLog(
          "Dossiers",
          "Validation",
          `Dossier ${dossier.reference} → ${newStatut}${montantRecu ? ` — ${montantRecu.toLocaleString("fr-FR")} FCFA reçus` : ""}`,
        );
      },

      // ---- Clients ----
      addClient: (input) => {
        const seq = get().clientSeq;
        const id = `C-${pad(seq, 3)}`;
        const newClient: Client = {
          id,
          ...input,
          nbDossiers: 0,
          totalDu: 0,
          totalPaye: 0,
        };
        set((s) => ({ clients: [newClient, ...s.clients], clientSeq: seq + 1 }));
        get().addAuditLog("Clients", "Création", `Client « ${input.nom} » ajouté`);
        return newClient;
      },
      updateClient: (id, input) => {
        set((s) => {
          const updatedClients = s.clients.map((c) => c.id === id ? { ...c, ...input } : c);
          // Cascade du nom sur les dossiers et écritures existants
          const updatedDossiers = s.dossiers.map((d) =>
            d.clientId === id ? { ...d, clientNom: input.nom } : d,
          );
          const updatedEcritures = s.ecritures.map((e) =>
            e.clientId === id ? { ...e, clientNom: input.nom } : e,
          );
          return { clients: updatedClients, dossiers: updatedDossiers, ecritures: updatedEcritures };
        });
      },
      getClient: (id) => get().clients.find((c) => c.id === id),

      // ---- Comptabilité ----
      recordPayment: (ecritureId, montant, mode, date, note) => {
        const ecriture = get().ecritures.find((e) => e.id === ecritureId);
        if (!ecriture) return;
        set((s) => {
          const updatedEcritures = s.ecritures.map((e) =>
            e.id === ecritureId
              ? {
                  ...e,
                  montantPaye: Math.min(e.montantInvesti, e.montantPaye + montant),
                  modePaiement: mode,
                  datePaiement: date,
                  note: note || e.note,
                }
              : e,
          );
          if (!ecriture.dossierId) return { ecritures: updatedEcritures };
          const totalPaye = updatedEcritures
            .filter((e) => e.dossierId === ecriture.dossierId)
            .reduce((sum, e) => sum + e.montantPaye, 0);
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === ecriture.dossierId
              ? { ...d, montantPaye: Math.min(d.montantInvesti, totalPaye) }
              : d,
          );
          return {
            ecritures: updatedEcritures,
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.clients),
          };
        });
        get().addAuditLog(
          "Comptabilité",
          "Paiement",
          `Paiement ${montant.toLocaleString("fr-FR")} FCFA — Écriture ${ecritureId}`,
        );
      },
      addEcriture: (e) => {
        const seq = get().ecritureSeq;
        const id = `E-${seq}`;
        const newEcriture: Ecriture = { id, ...e };
        set((s) => {
          const updatedEcritures = [newEcriture, ...s.ecritures];
          if (!e.dossierId) return { ecritures: updatedEcritures, ecritureSeq: seq + 1 };
          const totalPaye = updatedEcritures
            .filter((ec) => ec.dossierId === e.dossierId)
            .reduce((sum, ec) => sum + ec.montantPaye, 0);
          const updatedDossiers = s.dossiers.map((d) =>
            d.id === e.dossierId
              ? { ...d, montantPaye: Math.min(d.montantInvesti, totalPaye) }
              : d,
          );
          return {
            ecritures: updatedEcritures,
            ecritureSeq: seq + 1,
            dossiers: updatedDossiers,
            clients: syncClientStats(updatedDossiers, s.clients),
          };
        });
        return newEcriture;
      },

      // ---- Stock ----
      addStockItem: (input) => {
        const seq = get().stockSeq;
        const id = `S-${pad(seq, 2)}`;
        const newItem: StockItem = { id, ...input };
        set((s) => ({ stock: [...s.stock, newItem], stockSeq: seq + 1 }));
        return newItem;
      },
      addStockEntry: (stockId, quantite, responsable) => {
        const now = new Date();
        const seq = get().mouvementSeq;
        const mvt: Mouvement = {
          id: `M-${pad(seq, 3)}`,
          date: now.toISOString().slice(0, 10),
          type: "Entrée",
          marchandise: get().stock.find((s) => s.id === stockId)?.marchandise ?? "",
          quantite,
          unite: get().stock.find((s) => s.id === stockId)?.unite ?? "",
          responsable,
          bonRef: "—",
        };
        set((s) => ({
          stock: s.stock.map((it) =>
            it.id === stockId
              ? { ...it, quantite: it.quantite + quantite }
              : it,
          ),
          mouvements: [mvt, ...s.mouvements],
          mouvementSeq: seq + 1,
        }));
      },
      addStockExit: (stockId, quantite, responsable, bonRef) => {
        const now = new Date();
        const seq = get().mouvementSeq;
        const item = get().stock.find((s) => s.id === stockId);
        const mvt: Mouvement = {
          id: `M-${pad(seq, 3)}`,
          date: now.toISOString().slice(0, 10),
          type: "Sortie",
          marchandise: item?.marchandise ?? "",
          quantite,
          unite: item?.unite ?? "",
          responsable,
          bonRef: bonRef ?? "—",
        };
        set((s) => ({
          stock: s.stock.map((it) =>
            it.id === stockId
              ? { ...it, quantite: Math.max(0, it.quantite - quantite) }
              : it,
          ),
          mouvements: [mvt, ...s.mouvements],
          mouvementSeq: seq + 1,
        }));
      },

      // ---- Bons de sortie ----
      addBon: (input) => {
        const seq = get().bonSeq;
        const id = `B-${pad(seq, 4)}`;
        const year = new Date().getFullYear();
        const reference = `BS-${year}-${pad(seq, 4)}`;
        // LM-07: si statut est undefined, traiter comme brouillon (sécurité)
        const isBrouillon = input.statut !== "Validé";
        const newBon: BonSortie = {
          id,
          reference,
          ...input,
          statut: isBrouillon ? "Brouillon" : "Validé",
        };
        const item = !isBrouillon ? findStockForBon(get().stock, input) : undefined;
        set((s) => ({
          bons: [newBon, ...s.bons],
          bonSeq: seq + 1,
          stock: item
            ? s.stock.map((it) =>
                it.id === item.id
                  ? { ...it, quantite: Math.max(0, it.quantite - input.quantite) }
                  : it,
              )
            : s.stock,
          mouvements: item
            ? [
                {
                  id: `M-${pad(s.mouvementSeq, 3)}`,
                  date: input.date,
                  type: "Sortie" as const,
                  marchandise: input.marchandise,
                  quantite: input.quantite,
                  unite: input.unite,
                  responsable: getConnectedUserName(),
                  bonRef: reference,
                },
                ...s.mouvements,
              ]
            : s.mouvements,
          mouvementSeq: item ? s.mouvementSeq + 1 : s.mouvementSeq,
        }));
        return newBon;
      },
      validateBon: (id) => {
        const bon = get().bons.find((b) => b.id === id);
        if (!bon || bon.statut !== "Brouillon") return false;
        const item = findStockForBon(get().stock, bon);
        const stockSuffisant = item === undefined || item.quantite >= bon.quantite;
        set((s) => ({
          bons: s.bons.map((b) => (b.id === id ? { ...b, statut: "Validé" } : b)),
          stock: item
            ? s.stock.map((it) =>
                it.id === item.id
                  ? { ...it, quantite: Math.max(0, it.quantite - bon.quantite) }
                  : it,
              )
            : s.stock,
          mouvements: item
            ? [
                {
                  id: `M-${pad(s.mouvementSeq, 3)}`,
                  date: bon.date,
                  type: "Sortie" as const,
                  marchandise: bon.marchandise,
                  quantite: bon.quantite,
                  unite: bon.unite,
                  responsable: getConnectedUserName(),
                  bonRef: bon.reference,
                },
                ...s.mouvements,
              ]
            : s.mouvements,
          mouvementSeq: item ? s.mouvementSeq + 1 : s.mouvementSeq,
        }));
        return stockSuffisant;
      },

      // ---- Users ----
      addUser: (input) => {
        const seq = get().userSeq;
        const id = `U-${pad(seq, 2)}`;
        const newUser: User = {
          id,
          nom: input.nom,
          email: input.email,
          role: input.role,
          permissions: input.permissions,
          motDePasse: input.motDePasse ?? "sltt2026",
          actif: true,
          derniereConnexion: new Date().toISOString(),
        };
        set((s) => ({ users: [...s.users, newUser], userSeq: seq + 1 }));
        get().addAuditLog("Utilisateurs", "Création", `Utilisateur ${input.nom} (${input.role}) ajouté`);
        return newUser;
      },
      toggleUserActive: (id) => {
        const u = get().users.find((x) => x.id === id);
        set((s) => ({
          users: s.users.map((x) =>
            x.id === id ? { ...x, actif: !x.actif } : x,
          ),
        }));
        if (u) get().addAuditLog("Utilisateurs", "Modification", `${u.nom} marqué ${u.actif ? "inactif" : "actif"}`);
      },
      updateUser: (id, input) => {
        const existing = get().users.find((u) => u.id === id);
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, ...input } : u,
          ),
        }));
        if (existing) get().addAuditLog("Utilisateurs", "Modification", `Utilisateur ${existing.nom} modifié — rôle : ${input.role}`);
      },
      removeUser: (id) => {
        const u = get().users.find((x) => x.id === id);
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
        if (u) get().addAuditLog("Utilisateurs", "Suppression", `Utilisateur ${u.nom} supprimé`);
      },
      updateLastLogin: (id) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, derniereConnexion: new Date().toISOString() } : u,
          ),
        }));
      },

      // ---- Sous-dossiers ----
      addSubDossier: (input) => {
        const seq = get().subDossierSeq;
        const id = `SD-${pad(seq, 4)}`;
        const newSD: SubDossier = {
          id,
          ...input,
          dateCreation: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ subDossiers: [newSD, ...s.subDossiers], subDossierSeq: seq + 1 }));
        return newSD;
      },
      updateSubDossier: (id, nom, description) => {
        set((s) => ({
          subDossiers: s.subDossiers.map((sd) =>
            sd.id === id ? { ...sd, nom, description } : sd,
          ),
        }));
      },
      deleteSubDossier: (id) => {
        set((s) => ({
          subDossiers: s.subDossiers.filter((sd) => sd.id !== id),
          fichiers: s.fichiers.filter((f) => f.sousDossierId !== id),
        }));
      },

      // ---- Fichiers ----
      addFichier: (input) => {
        const seq = get().fichierSeq;
        const id = `F-${pad(seq, 4)}`;
        const newF: DossierFichier = {
          id,
          ...input,
          dateUpload: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ fichiers: [newF, ...s.fichiers], fichierSeq: seq + 1 }));
        return newF;
      },
      deleteFichier: (id) => {
        set((s) => ({ fichiers: s.fichiers.filter((f) => f.id !== id) }));
      },
      deleteFichiersByDossier: (dossierId) => {
        set((s) => ({ fichiers: s.fichiers.filter((f) => f.dossierId !== dossierId) }));
      },

      // ---- Commentaires ----
      addComment: (dossierId, texte) => {
        const seq = get().commentSeq;
        const id = `CMT-${pad(seq, 4)}`;
        const newComment: DossierComment = {
          id,
          dossierId,
          userName: getConnectedUserName(),
          texte,
          date: new Date().toISOString(),
        };
        set((s) => ({ comments: [...s.comments, newComment], commentSeq: seq + 1 }));
        return newComment;
      },
      deleteComment: (id) => {
        set((s) => ({ comments: s.comments.filter((c) => c.id !== id) }));
      },

      // ---- Devis ----
      addDevis: (input) => {
        const seq = get().devisSeq;
        const year = new Date().getFullYear();
        const id = `DV-${pad(seq, 3)}`;
        const reference = `DEVIS-${year}-${pad(seq, 4)}`;
        const total = input.droitDouane + input.fraisCircuit + input.fraisPrestation;
        const newDevis: Devis = {
          id,
          reference,
          ...input,
          total,
          statut: "Brouillon",
          dateCreation: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ devis: [newDevis, ...s.devis], devisSeq: seq + 1 }));
        get().addAuditLog("Dossiers", "Création", `Devis ${reference} créé — ${input.clientNom}`);
        return newDevis;
      },
      updateDevis: (id, input) => {
        const total = input.droitDouane + input.fraisCircuit + input.fraisPrestation;
        set((s) => ({
          devis: s.devis.map((d) => d.id === id ? { ...d, ...input, total } : d),
        }));
      },
      updateDevisStatut: (id, statut) => {
        set((s) => ({
          devis: s.devis.map((d) => d.id === id ? { ...d, statut } : d),
        }));
      },
      expireDevisObsoletes: () => {
        const today = new Date().toISOString().slice(0, 10);
        set((s) => ({
          devis: s.devis.map((d) => {
            if (
              d.dateValidite < today &&
              d.statut !== "Accepté" &&
              d.statut !== "Refusé" &&
              d.statut !== "Expiré"
            ) {
              return { ...d, statut: "Expiré" as DevisStatut };
            }
            return d;
          }),
        }));
      },
      convertDevisToDossier: (id) => {
        const dv = get().devis.find((d) => d.id === id);
        if (!dv) return null;
        const newDossier = get().addDossier({
          clientId: dv.clientId,
          clientNom: dv.clientNom,
          nature: dv.nature,
          bl: "",
          camion: "",
          date: new Date().toISOString().slice(0, 10),
          droitDouane: dv.droitDouane,
          fraisCircuit: dv.fraisCircuit,
          fraisPrestation: dv.fraisPrestation,
          montantInvesti: dv.total,
          statut: "En cours",
          notes: dv.notes,
        });
        set((s) => ({
          devis: s.devis.map((d) => d.id === id ? { ...d, statut: "Accepté" } : d),
        }));
        return newDossier;
      },
      removeDevis: (id) => {
        const dv = get().devis.find((d) => d.id === id);
        set((s) => ({ devis: s.devis.filter((d) => d.id !== id) }));
        if (dv) get().addAuditLog("Dossiers", "Suppression", `Devis ${dv.reference} supprimé`);
      },

      // ---- Transporteurs ----
      addTransporteur: (input) => {
        const seq = get().transporteurSeq;
        const id = `TRP-${pad(seq, 3)}`;
        const t: Transporteur = {
          ...input,
          id,
          nbDossiers: 0,
          dateCreation: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ transporteurs: [t, ...s.transporteurs], transporteurSeq: seq + 1 }));
        get().addAuditLog("Transporteurs", "Création", `Transporteur ${t.nom} ajouté`);
        return t;
      },
      updateTransporteur: (id, input) => {
        set((s) => ({
          transporteurs: s.transporteurs.map((t) => t.id === id ? { ...t, ...input } : t),
        }));
        get().addAuditLog("Transporteurs", "Modification", `Transporteur ${id} mis à jour`);
      },
      updateTransporteurStatut: (id, statut) => {
        set((s) => ({
          transporteurs: s.transporteurs.map((t) => t.id === id ? { ...t, statut } : t),
        }));
      },
      removeTransporteur: (id) => {
        const t = get().transporteurs.find((x) => x.id === id);
        set((s) => ({ transporteurs: s.transporteurs.filter((x) => x.id !== id) }));
        if (t) get().addAuditLog("Transporteurs", "Suppression", `Transporteur ${t.nom} supprimé`);
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
          auditLogs: initialAuditLogs,
          transporteurs: seedTransporteurs,
          ...INITIAL_SEQUENCES,
        });
      },
    }),
    {
      name: "sltt-data-v5",
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
      // Only persist data, not the methods (methods are recreated by the store)
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
      }),
    },
  ),
);
