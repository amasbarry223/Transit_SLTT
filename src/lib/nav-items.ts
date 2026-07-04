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
  /** Regroupement visuel dans la sidebar — reflète le cycle métier, pas juste l'ordre alphabétique. */
  section?: "Cycle commercial" | "Logistique" | "Finance";
}

// Ordre voulu : la séquence chronologique réelle du métier, pas l'alphabet.
// Clients d'abord (prérequis de données : un devis/dossier a toujours besoin
// d'un client existant), puis Devis → Dossier → Facture dans l'ordre où ils
// sont réellement créés — pour qu'un nouvel utilisateur comprenne le cycle
// juste en lisant le menu de haut en bas.
export const navItems: NavItem[] = [
  { key: "dashboard",    label: "Tableau de bord",      icon: LayoutDashboard },

  { key: "clients",      label: "Clients",              icon: Users,         roles: ["Administrateur", "Agent de transit", "Commercial", "Comptable"], section: "Cycle commercial" },
  { key: "devis",        label: "Devis",                icon: ClipboardList, roles: ["Administrateur", "Agent de transit", "Commercial"], section: "Cycle commercial" },
  { key: "dossiers",     label: "Dossiers de transit",  icon: FolderKanban,  roles: ["Administrateur", "Agent de transit", "Comptable"], section: "Cycle commercial" },
  { key: "factures",     label: "Factures",              icon: Receipt,       roles: ["Administrateur", "Comptable", "Agent de transit"], section: "Cycle commercial" },

  { key: "entreposage",  label: "Entreposage",          icon: Warehouse,     roles: ["Administrateur", "Magasinier"], section: "Logistique" },
  { key: "bons",         label: "Bons de sortie",       icon: FileOutput,    roles: ["Administrateur", "Magasinier", "Commercial"], section: "Logistique" },
  { key: "fournisseurs", label: "Fournisseurs",          icon: Building2,     roles: ["Administrateur", "Agent de transit", "Comptable"], section: "Logistique" },
  { key: "transporteurs",label: "Transporteurs",        icon: Truck,         roles: ["Administrateur", "Agent de transit"], section: "Logistique" },
  { key: "calendrier",   label: "Calendrier",           icon: CalendarDays, section: "Logistique" },

  { key: "comptabilite", label: "Comptabilité",         icon: Wallet,        roles: ["Administrateur", "Comptable"], section: "Finance" },
  { key: "bilans",       label: "Bilans & rapports",    icon: BarChart3,     roles: ["Administrateur", "Comptable"], section: "Finance" },

  { key: "parametres",   label: "Paramètres",           icon: Settings,      roles: ["Administrateur"] },
];
