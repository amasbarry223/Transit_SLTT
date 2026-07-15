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
