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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ViewKey } from "@/lib/nav-store";
import type { UserRole } from "@/lib/mock-data";

export interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  { key: "dashboard",    label: "Tableau de bord",      icon: LayoutDashboard },
  { key: "dossiers",     label: "Dossiers de transit",  icon: FolderKanban,  roles: ["Administrateur", "Agent de transit", "Comptable"] },
  { key: "devis",        label: "Devis",                icon: ClipboardList, roles: ["Administrateur", "Agent de transit", "Commercial"] },
  { key: "factures",     label: "Factures",              icon: Receipt,       roles: ["Administrateur", "Comptable", "Agent de transit"] },
  { key: "fournisseurs", label: "Fournisseurs",          icon: Building2,     roles: ["Administrateur", "Agent de transit", "Comptable"] },
  { key: "calendrier",   label: "Calendrier",           icon: CalendarDays },
  { key: "comptabilite", label: "Comptabilité",         icon: Wallet,        roles: ["Administrateur", "Comptable"] },
  { key: "entreposage",  label: "Entreposage",          icon: Warehouse,     roles: ["Administrateur", "Magasinier"] },
  { key: "bons",         label: "Bons de sortie",       icon: FileOutput,    roles: ["Administrateur", "Magasinier", "Commercial"] },
  { key: "clients",      label: "Clients",              icon: Users,         roles: ["Administrateur", "Agent de transit", "Commercial"] },
  { key: "transporteurs",label: "Transporteurs",        icon: Truck,         roles: ["Administrateur", "Agent de transit"] },
  { key: "bilans",       label: "Bilans & rapports",    icon: BarChart3,     roles: ["Administrateur", "Comptable"] },
  { key: "parametres",   label: "Paramètres",           icon: Settings,      roles: ["Administrateur"] },
];
