"use client";

import type { LucideIcon } from "lucide-react";
import { Shield, Truck, Wallet, Warehouse } from "lucide-react";
import { normalizePermissions, ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions";
import { defaultSelectionForRole } from "@/components/sltt/permission-matrix";
import type { UserRole } from "@/lib/store";

export const USERS_PAGE_SIZE = 5;

export const allRoles: UserRole[] = [
  "Administrateur",
  "Agent de transit",
  "Comptable",
  "Magasinier",
];

export const roleTone: Record<UserRole, "red" | "blue" | "emerald" | "amber" | "indigo"> = {
  Administrateur: "red",
  "Agent de transit": "blue",
  Comptable: "emerald",
  Magasinier: "amber",
};

export const roleMeta: Record<
  UserRole,
  { icon: LucideIcon; description: string; gradient: string }
> = {
  Administrateur: {
    icon: Shield,
    description: "Accès complet et gestion de l'équipe",
    gradient: "from-red-500/10 to-orange-500/10 border-red-200/60 dark:border-red-900/40",
  },
  "Agent de transit": {
    icon: Truck,
    description: "Dossiers, clients et opérations transit",
    gradient: "from-blue-500/10 to-cyan-500/10 border-blue-200/60 dark:border-blue-900/40",
  },
  Comptable: {
    icon: Wallet,
    description: "Comptabilité, factures et rapports",
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-200/60 dark:border-emerald-900/40",
  },
  Magasinier: {
    icon: Warehouse,
    description: "Entreposage et bons de sortie",
    gradient: "from-amber-500/10 to-yellow-500/10 border-amber-200/60 dark:border-amber-900/40",
  },
};

export type FormMode = "create" | "edit";
export type FormTab = "identity" | "access" | "permissions";
export type RoleFilter = "all" | UserRole;

export interface UserFormState {
  nom: string;
  email: string;
  role: UserRole;
  perms: Record<string, boolean>;
  password: string;
  confirmPassword: string;
  resetPassword: string;
  resetConfirmPassword: string;
  /** Annexes assignées — détermine le périmètre RLS de l'utilisateur. */
  annexeIds: string[];
}

/** True si les permissions de l'utilisateur s'écartent du standard de son rôle (LOGIC-audit). */
export function isCustomPermissionSet(role: UserRole, permissions: string[]): boolean {
  const actual = new Set(normalizePermissions(permissions));
  const standard = ROLE_DEFAULT_PERMISSIONS[role];
  if (actual.size !== standard.length) return true;
  return standard.some((p) => !actual.has(p));
}

export function emptyFormState(role: UserRole = "Agent de transit", annexeIds: string[] = []): UserFormState {
  return {
    nom: "",
    email: "",
    role,
    perms: defaultSelectionForRole(role),
    password: "",
    confirmPassword: "",
    resetPassword: "",
    resetConfirmPassword: "",
    annexeIds,
  };
}
