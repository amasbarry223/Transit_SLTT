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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ViewKey } from "@/lib/nav-store";

export interface NavItem {
  key: ViewKey;
  label: string;
  /** Libellé court pour espaces restreints */
  shortLabel?: string;
  icon: LucideIcon;
  requiredPermission?: string;
  /** Regroupement visuel dans la sidebar — reflète le cycle métier, pas juste l'ordre alphabétique. */
  section?: "Cycle commercial" | "Logistique" | "Finance";
}

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", shortLabel: "Accueil", icon: LayoutDashboard, requiredPermission: "dashboard:read" },

  { key: "clients", label: "Clients", icon: Users, requiredPermission: "clients:read", section: "Cycle commercial" },
  { key: "devis", label: "Devis", icon: ClipboardList, requiredPermission: "devis:read", section: "Cycle commercial" },
  { key: "dossiers", label: "Dossiers", shortLabel: "Dossiers", icon: FolderKanban, requiredPermission: "dossiers:read", section: "Cycle commercial" },
  { key: "factures", label: "Factures", icon: Receipt, requiredPermission: "factures:read", section: "Cycle commercial" },

  { key: "entreposage", label: "Entreposage", shortLabel: "Stock", icon: Warehouse, requiredPermission: "stock:read", section: "Logistique" },
  { key: "contrats", label: "Contrats", icon: FileSignature, requiredPermission: "contrats:read", section: "Logistique" },
  { key: "bons", label: "Bons de sortie", shortLabel: "Bons", icon: FileOutput, requiredPermission: "bons:read", section: "Logistique" },
  { key: "archives", label: "Archives", icon: Archive, requiredPermission: "archives:read", section: "Logistique" },
  { key: "fournisseurs", label: "Fournisseurs", icon: Building2, requiredPermission: "fournisseurs:read", section: "Logistique" },
  { key: "transporteurs", label: "Transporteurs", icon: Truck, requiredPermission: "transporteurs:read", section: "Logistique" },
  { key: "calendrier", label: "Calendrier", icon: CalendarDays, requiredPermission: "calendrier:read", section: "Logistique" },

  { key: "comptabilite", label: "Comptabilité", shortLabel: "Compta", icon: Wallet, requiredPermission: "comptabilite:read", section: "Finance" },
  { key: "bilans", label: "Bilans", shortLabel: "Bilans", icon: BarChart3, requiredPermission: "rapports:read", section: "Finance" },

  { key: "parametres", label: "Paramètres", shortLabel: "Réglages", icon: Settings, requiredPermission: "parametres:read" },
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
