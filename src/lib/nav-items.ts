import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  Warehouse,
  FileOutput,
  Users,
  BarChart3,
  Settings,
  ClipboardList,
  CalendarDays,
  Truck,
  Receipt,
  Building2,
  FileSignature,
  Archive,
  FileText,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";

export interface NavItem {
  /** Identifiant unique pour React / surbrillance sidebar (plusieurs items peuvent partager la même vue). */
  navId: string;
  key: ViewKey;
  label: string;
  /** Libellé court pour espaces restreints */
  shortLabel?: string;
  icon: LucideIcon;
  requiredPermission?: string;
  /** Regroupement visuel dans la sidebar — reflète le cycle métier, pas juste l'ordre alphabétique. */
  section?: "Cycle commercial" | "Logistique" | "Finance";
  /** Sous-onglet Comptabilité lorsque key === "comptabilite". */
  comptaTab?: ComptaTab;
}

export const navItems: NavItem[] = [
  { navId: "dashboard", key: "dashboard", label: "Tableau de bord", shortLabel: "Accueil", icon: LayoutDashboard, requiredPermission: "dashboard:read" },

  { navId: "clients", key: "clients", label: "Clients", icon: Users, requiredPermission: "clients:read", section: "Cycle commercial" },
  { navId: "devis", key: "devis", label: "Devis", icon: ClipboardList, requiredPermission: "devis:read", section: "Cycle commercial" },
  { navId: "dossiers", key: "dossiers", label: "Dossiers", shortLabel: "Dossiers", icon: FolderKanban, requiredPermission: "dossiers:read", section: "Cycle commercial" },
  { navId: "factures", key: "factures", label: "Factures", icon: Receipt, requiredPermission: "factures:read", section: "Cycle commercial" },

  { navId: "entreposage", key: "entreposage", label: "Entreposage", shortLabel: "Stock", icon: Warehouse, requiredPermission: "stock:read", section: "Logistique" },
  { navId: "contrats", key: "contrats", label: "Contrats", icon: FileSignature, requiredPermission: "contrats:read", section: "Logistique" },
  { navId: "bons", key: "bons", label: "Bons de sortie", shortLabel: "Bons", icon: FileOutput, requiredPermission: "bons:read", section: "Logistique" },
  { navId: "archives", key: "archives", label: "Archives", icon: Archive, requiredPermission: "archives:read", section: "Logistique" },
  { navId: "fournisseurs", key: "fournisseurs", label: "Fournisseurs", icon: Building2, requiredPermission: "fournisseurs:read", section: "Logistique" },
  { navId: "transporteurs", key: "transporteurs", label: "Transporteurs", icon: Truck, requiredPermission: "transporteurs:read", section: "Logistique" },
  { navId: "calendrier", key: "calendrier", label: "Calendrier", icon: CalendarDays, requiredPermission: "calendrier:read", section: "Logistique" },

  {
    navId: "comptabilite-ecritures",
    key: "comptabilite",
    label: "Paiements dossiers",
    shortLabel: "Paiements",
    icon: Wallet,
    comptaTab: "ecritures",
    requiredPermission: "comptabilite:read",
    section: "Finance",
  },
  {
    navId: "comptabilite-journal",
    key: "comptabilite",
    label: "Journal de caisse",
    shortLabel: "Journal",
    icon: ScrollText,
    comptaTab: "journal",
    requiredPermission: "comptabilite:read",
    section: "Finance",
  },
  { navId: "recus-paiement", key: "recus-paiement", label: "Gestion des reçus", shortLabel: "Reçus", icon: FileText, requiredPermission: "recus-paiement:read", section: "Finance" },
  { navId: "bilans", key: "bilans", label: "Bilans", shortLabel: "Bilans", icon: BarChart3, requiredPermission: "rapports:read", section: "Finance" },

  { navId: "parametres", key: "parametres", label: "Paramètres", shortLabel: "Réglages", icon: Settings, requiredPermission: "parametres:read" },
];

/**
 * Permission requise pour accéder à CHAQUE vue, y compris les écrans de
 * détail (dossier-detail, devis-detail…) absents de navItems car non liés
 * depuis la sidebar — mais atteignables par URL directe ou la palette de
 * commandes (⌘K), qui doivent donc appliquer la même règle que la liste
 * parente. Sans cette table, ces deux points d'entrée contournaient
 * totalement les permissions (cf. audit du 21/07/2026).
 */
export const VIEW_PERMISSIONS: Record<ViewKey, string | undefined> = {
  dashboard: "dashboard:read",
  dossiers: "dossiers:read",
  "dossier-form": "dossiers:read",
  "dossier-detail": "dossiers:read",
  comptabilite: "comptabilite:read",
  "recus-paiement": "recus-paiement:read",
  bilans: "rapports:read",
  entreposage: "stock:read",
  bons: "bons:read",
  clients: "clients:read",
  "client-fiche": "clients:read",
  devis: "devis:read",
  "devis-detail": "devis:read",
  calendrier: "calendrier:read",
  transporteurs: "transporteurs:read",
  factures: "factures:read",
  "facture-detail": "factures:read",
  fournisseurs: "fournisseurs:read",
  contrats: "contrats:read",
  "contrat-detail": "contrats:read",
  archives: "archives:read",
  parametres: "parametres:read",
};
