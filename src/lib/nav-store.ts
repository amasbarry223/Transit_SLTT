"use client";

import { create } from "zustand";

export type ComptaTab = "ecritures" | "journal";

export type ViewKey =
  | "dashboard"
  | "dossiers"
  | "dossier-form"
  | "dossier-detail"
  | "dossier-ocr-review"
  | "comptabilite"
  | "recus-paiement"
  | "bilans"
  | "entreposage"
  | "bons"
  | "clients"
  | "client-fiche"
  | "devis"
  | "devis-detail"
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
  description: string;
  montant: number;
} | null;

interface NavState {
  view: ViewKey;
  selectedId: string | null;
  dossierFormMode: "create" | "edit";
  devisEditMode: boolean;
  /** Sous-onglet actif de l'écran Comptabilité (écritures dossiers vs journal de caisse). */
  comptaTab: ComptaTab;
  /** Canal transitoire (non persisté) pour préremplir une facture depuis une prestation optionnelle F6. */
  pendingFacturePrefill: PendingFacturePrefill;
  /** Contrôle de l'ouverture du drawer de navigation sur mobile (depuis Topbar ou BottomNav) */
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  go: (view: ViewKey, opts?: { id?: string | null; comptaTab?: ComptaTab }) => void;
  openDossier: (id: string | null, mode?: "create" | "edit") => void;
  openDossierDetail: (id: string) => void;
  openDossierOcrReview: (documentId: string) => void;
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
  comptaTab: "ecritures",
  pendingFacturePrefill: null,
  mobileMenuOpen: false,

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  go: (view, opts) =>
    set({
      view,
      selectedId: opts?.id ?? null,
      mobileMenuOpen: false,
      ...(opts?.comptaTab ? { comptaTab: opts.comptaTab } : {}),
    }),
  openDossier: (id, mode = "edit") =>
    set({ view: "dossier-form", selectedId: id, dossierFormMode: mode, mobileMenuOpen: false }),
  openDossierDetail: (id) =>
    set({ view: "dossier-detail", selectedId: id, mobileMenuOpen: false }),
  openDossierOcrReview: (documentId) =>
    set({ view: "dossier-ocr-review", selectedId: documentId, mobileMenuOpen: false }),
  openDevisDetail: (id, edit = false) =>
    set({ view: "devis-detail", selectedId: id, devisEditMode: edit, mobileMenuOpen: false }),
  openClient: (id) => set({ view: "client-fiche", selectedId: id, mobileMenuOpen: false }),
  openContratDetail: (id) => set({ view: "contrat-detail", selectedId: id, mobileMenuOpen: false }),
  setPendingFacturePrefill: (p) => set({ pendingFacturePrefill: p }),
  resetNavigation: () =>
    set({
      view: "dashboard",
      selectedId: null,
      dossierFormMode: "create",
      devisEditMode: false,
      comptaTab: "ecritures",
      pendingFacturePrefill: null,
      mobileMenuOpen: false,
    }),
}));
