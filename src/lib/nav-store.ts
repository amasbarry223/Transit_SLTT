"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "dossiers"
  | "dossier-form"
  | "dossier-detail"
  | "comptabilite"
  | "bilans"
  | "entreposage"
  | "bons"
  | "clients"
  | "client-fiche"
  | "devis"
  | "devis-detail"
  | "calendrier"
  | "transporteurs"
  | "factures"
  | "facture-detail"
  | "fournisseurs"
  | "contrats"
  | "contrat-detail"
  | "archives"
  | "parametres";

export type PendingFacturePrefill = {
  clientId: string;
  clientNom: string;
  societeId?: string;
  description: string;
  montant: number;
} | null;

interface NavState {
  view: ViewKey;
  selectedId: string | null;
  dossierFormMode: "create" | "edit";
  devisEditMode: boolean;
  /** Canal transitoire (non persisté) pour préremplir une facture depuis une prestation optionnelle F6. */
  pendingFacturePrefill: PendingFacturePrefill;
  go: (view: ViewKey, opts?: { id?: string | null }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
  openDossierDetail: (id: string) => void;
  openDevisDetail: (id: string, edit?: boolean) => void;
  openClient: (id: string | null) => void;
  openContratDetail: (id: string) => void;
  setPendingFacturePrefill: (p: PendingFacturePrefill) => void;
  /** Remet la navigation au dashboard après déconnexion. */
  resetNavigation: () => void;
}

export const useNav = create<NavState>()((set) => ({
  view: "dashboard",
  selectedId: null,
  dossierFormMode: "create",
  devisEditMode: false,
  pendingFacturePrefill: null,

  go: (view, opts) => set({ view, selectedId: opts?.id ?? null }),
  openDossier: (id, mode = "edit") =>
    set({ view: "dossier-form", selectedId: id, dossierFormMode: mode }),
  openDossierDetail: (id) =>
    set({ view: "dossier-detail", selectedId: id }),
  openDevisDetail: (id, edit = false) =>
    set({ view: "devis-detail", selectedId: id, devisEditMode: edit }),
  openClient: (id) => set({ view: "client-fiche", selectedId: id }),
  openContratDetail: (id) => set({ view: "contrat-detail", selectedId: id }),
  setPendingFacturePrefill: (p) => set({ pendingFacturePrefill: p }),
  resetNavigation: () =>
    set({
      view: "dashboard",
      selectedId: null,
      dossierFormMode: "create",
      devisEditMode: false,
      pendingFacturePrefill: null,
    }),
}));
