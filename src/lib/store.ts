"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clients as seedClients,
  dossiers as seedDossiers,
  ecritures as seedEcritures,
  stock as seedStock,
  mouvements as seedMouvements,
  bonsSortie as seedBons,
  users as seedUsers,
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
  marchandise: string;
  quantite: number;
  unite: string;
  motif: BonMotif;
  montant: number;
}

export interface UserInput {
  nom: string;
  email: string;
  role: UserRole;
  permissions: string[];
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

  // Counters for reference generation
  dossierSeq: number;
  bonSeq: number;

  // ---- Dossiers ----
  addDossier: (input: DossierInput) => Dossier;
  updateDossier: (id: string, input: DossierInput) => void;
  getDossier: (id: string) => Dossier | undefined;

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
  addStockEntry: (stockId: string, quantite: number, responsable: string) => void;
  addStockExit: (stockId: string, quantite: number, responsable: string, bonRef?: string) => void;

  // ---- Bons de sortie ----
  addBon: (input: BonInput) => BonSortie;

  // ---- Users ----
  addUser: (input: UserInput) => User;
  toggleUserActive: (id: string) => void;

  // ---- Reset ----
  resetAll: () => void;
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

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
      dossierSeq: 43, // next will be SLTT-TR-2026-0043
      bonSeq: 52, // next will be BS-2026-0052

      // ---- Dossiers ----
      addDossier: (input) => {
        const seq = get().dossierSeq;
        const id = `D-${pad(seq, 4)}`;
        const reference = `SLTT-TR-2026-${pad(seq, 4)}`;
        const newDossier: Dossier = {
          id,
          reference,
          ...input,
          montantPaye: 0,
          notes: input.notes ?? "",
        };
        set((s) => ({
          dossiers: [newDossier, ...s.dossiers],
          dossierSeq: seq + 1,
        }));
        return newDossier;
      },
      updateDossier: (id, input) => {
        set((s) => ({
          dossiers: s.dossiers.map((d) =>
            d.id === id ? { ...d, ...input } : d,
          ),
        }));
      },
      getDossier: (id) => get().dossiers.find((d) => d.id === id),

      // ---- Clients ----
      addClient: (input) => {
        const seq = get().clients.length + 8;
        const id = `C-${pad(seq, 3)}`;
        const newClient: Client = {
          id,
          ...input,
          nbDossiers: 0,
          totalDu: 0,
          totalPaye: 0,
        };
        set((s) => ({ clients: [newClient, ...s.clients] }));
        return newClient;
      },
      updateClient: (id, input) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...input } : c,
          ),
        }));
      },
      getClient: (id) => get().clients.find((c) => c.id === id),

      // ---- Comptabilité ----
      recordPayment: (ecritureId, montant, mode, date, note) => {
        set((s) => ({
          ecritures: s.ecritures.map((e) =>
            e.id === ecritureId
              ? {
                  ...e,
                  montantPaye: Math.min(
                    e.montantInvesti,
                    e.montantPaye + montant,
                  ),
                  modePaiement: mode,
                  note: note || e.note,
                }
              : e,
          ),
        }));
      },
      addEcriture: (e) => {
        const seq = get().ecritures.length + 1002;
        const id = `E-${seq}`;
        const newEcriture: Ecriture = { id, ...e };
        set((s) => ({ ecritures: [newEcriture, ...s.ecritures] }));
        return newEcriture;
      },

      // ---- Stock ----
      addStockEntry: (stockId, quantite, responsable) => {
        const now = new Date();
        const seq = get().mouvements.length + 22;
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
        }));
      },
      addStockExit: (stockId, quantite, responsable, bonRef) => {
        const now = new Date();
        const seq = get().mouvements.length + 22;
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
        }));
      },

      // ---- Bons de sortie ----
      addBon: (input) => {
        const seq = get().bonSeq;
        const id = `B-${pad(seq, 4)}`;
        const reference = `BS-2026-${pad(seq, 4)}`;
        const newBon: BonSortie = {
          id,
          reference,
          ...input,
          statut: "Validé",
        };
        // Decrement stock
        const item = get().stock.find(
          (s) => s.marchandise === input.marchandise,
        );
        set((s) => ({
          bons: [newBon, ...s.bons],
          bonSeq: seq + 1,
          stock: item
            ? s.stock.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      quantite: Math.max(0, it.quantite - input.quantite),
                    }
                  : it,
              )
            : s.stock,
          mouvements: item
            ? [
                {
                  id: `M-${pad(s.mouvements.length + 22, 3)}`,
                  date: input.date,
                  type: "Sortie" as const,
                  marchandise: input.marchandise,
                  quantite: input.quantite,
                  unite: input.unite,
                  responsable: "Oumar Cissé",
                  bonRef: reference,
                },
                ...s.mouvements,
              ]
            : s.mouvements,
        }));
        return newBon;
      },

      // ---- Users ----
      addUser: (input) => {
        const seq = get().users.length + 6;
        const id = `U-${pad(seq, 2)}`;
        const newUser: User = {
          id,
          ...input,
          actif: true,
          derniereConnexion: new Date().toISOString(),
        };
        set((s) => ({ users: [...s.users, newUser] }));
        return newUser;
      },
      toggleUserActive: (id) => {
        set((s) => ({
          users: s.users.map((u) =>
            u.id === id ? { ...u, actif: !u.actif } : u,
          ),
        }));
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
          dossierSeq: 43,
          bonSeq: 52,
        });
      },
    }),
    {
      name: "sltt-data-v1",
      // Only persist data, not the methods (methods are recreated by the store)
      partialize: (s) => ({
        clients: s.clients,
        dossiers: s.dossiers,
        ecritures: s.ecritures,
        stock: s.stock,
        mouvements: s.mouvements,
        bons: s.bons,
        users: s.users,
        dossierSeq: s.dossierSeq,
        bonSeq: s.bonSeq,
      }),
    },
  ),
);
