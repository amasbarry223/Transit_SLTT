import type { UserRole } from "@/lib/domain-types";
import type { ComptaTab, ViewKey } from "@/lib/nav-store";
import { Wallet, BarChart3, Warehouse, FileOutput, ClipboardList, Settings, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DossierIcon } from "@/shared/components/icons/dossier-icon";

export interface RoleShortcut {
  key: ViewKey;
  label: string;
  icon: LucideIcon | typeof DossierIcon;
  comptaTab?: ComptaTab;
}

export const ROLE_SHORTCUTS: Partial<Record<UserRole, RoleShortcut[]>> = {
  Comptable: [
    { key: "comptabilite", label: "Comptabilité", icon: Wallet },
    { key: "bilans", label: "Bilans", icon: BarChart3 },
  ],
  Magasinier: [
    { key: "entreposage", label: "Entreposage", icon: Warehouse },
    { key: "bons", label: "Bons de sortie", icon: FileOutput },
  ],
  "Agent de transit": [
    { key: "dossiers", label: "Dossiers", icon: DossierIcon },
    { key: "devis", label: "Devis", icon: ClipboardList },
  ],
  Administrateur: [
    { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { key: "parametres", label: "Paramètres", icon: Settings },
  ],
};
