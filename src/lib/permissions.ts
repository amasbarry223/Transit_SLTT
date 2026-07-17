import type { UserRole } from "@/lib/domain-types";

export type PermissionAction = "read" | "write" | "transition" | "manage";

export interface PermissionDefinition {
  key: string;
  label: string;
  action: PermissionAction;
}

export interface PermissionModule {
  id: string;
  label: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    permissions: [{ key: "dashboard:read", label: "Lecture", action: "read" }],
  },
  {
    id: "clients",
    label: "Clients",
    permissions: [
      { key: "clients:read", label: "Lecture", action: "read" },
      { key: "clients:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "devis",
    label: "Devis",
    permissions: [
      { key: "devis:read", label: "Lecture", action: "read" },
      { key: "devis:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "dossiers",
    label: "Dossiers de transit",
    permissions: [
      { key: "dossiers:read", label: "Lecture", action: "read" },
      { key: "dossiers:write", label: "Écriture", action: "write" },
      { key: "dossiers:transition", label: "Changement de statut", action: "transition" },
    ],
  },
  {
    id: "factures",
    label: "Factures",
    permissions: [
      { key: "factures:read", label: "Lecture", action: "read" },
      { key: "factures:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "stock",
    label: "Entreposage",
    permissions: [
      { key: "stock:read", label: "Lecture", action: "read" },
      { key: "stock:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "bons",
    label: "Bons de sortie",
    permissions: [
      { key: "bons:read", label: "Lecture", action: "read" },
      { key: "bons:write", label: "Écriture (marchandise)", action: "write" },
      { key: "bons:write-caisse", label: "Décaissement de caisse", action: "write" },
    ],
  },
  {
    id: "contrats",
    label: "Contrats",
    permissions: [
      { key: "contrats:read", label: "Lecture", action: "read" },
      { key: "contrats:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "fournisseurs",
    label: "Fournisseurs",
    permissions: [
      { key: "fournisseurs:read", label: "Lecture", action: "read" },
      { key: "fournisseurs:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "transporteurs",
    label: "Transporteurs",
    permissions: [
      { key: "transporteurs:read", label: "Lecture", action: "read" },
      { key: "transporteurs:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "calendrier",
    label: "Calendrier",
    permissions: [{ key: "calendrier:read", label: "Lecture", action: "read" }],
  },
  {
    id: "comptabilite",
    label: "Comptabilité",
    permissions: [
      { key: "comptabilite:read", label: "Lecture", action: "read" },
      { key: "comptabilite:write", label: "Écriture", action: "write" },
    ],
  },
  {
    id: "rapports",
    label: "Bilans & rapports",
    permissions: [{ key: "rapports:read", label: "Lecture", action: "read" }],
  },
  {
    id: "parametres",
    label: "Paramètres",
    permissions: [
      { key: "parametres:read", label: "Lecture", action: "read" },
      { key: "parametres:write", label: "Écriture", action: "write" },
      { key: "audit:read", label: "Journal d'audit", action: "read" },
    ],
  },
  {
    id: "utilisateurs",
    label: "Gestion utilisateurs",
    permissions: [
      {
        key: "utilisateurs:manage",
        label: "Gestion des comptes (hors Administrateurs)",
        action: "manage",
      },
    ],
  },
  {
    id: "archives",
    label: "Archives",
    permissions: [
      { key: "archives:read", label: "Lecture", action: "read" },
      { key: "archives:write", label: "Écriture", action: "write" },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key),
);

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  Administrateur: [...ALL_PERMISSION_KEYS],
  Comptable: [
    "dashboard:read",
    "clients:read",
    "dossiers:read",
    "factures:read",
    "factures:write",
    "fournisseurs:read",
    "comptabilite:read",
    "comptabilite:write",
    "bons:read",
    "bons:write-caisse",
    "rapports:read",
    "calendrier:read",
    "contrats:read",
    "contrats:write",
    "archives:read",
    "archives:write",
  ],
  "Agent de transit": [
    "dashboard:read",
    "clients:read",
    "clients:write",
    "devis:read",
    "devis:write",
    "dossiers:read",
    "dossiers:write",
    "dossiers:transition",
    "factures:read",
    "fournisseurs:read",
    "fournisseurs:write",
    "transporteurs:read",
    "transporteurs:write",
    "calendrier:read",
    "contrats:read",
    "archives:read",
    "archives:write",
  ],
  Magasinier: [
    "dashboard:read",
    "stock:read",
    "stock:write",
    "bons:read",
    "bons:write",
    "calendrier:read",
    "contrats:read",
    "contrats:write",
    "archives:read",
  ],
};

export interface PermissionUser {
  role: UserRole;
  permissions: string[];
  actif?: boolean;
}

export function hasPermission(user: PermissionUser | null | undefined, perm: string): boolean {
  if (!user || user.actif === false) return false;
  if (user.role === "Administrateur") return true;
  // Les permissions stockées font foi telles quelles — y compris un tableau
  // vide, qui signifie "aucun accès" (un admin peut retirer tous les droits
  // d'un utilisateur sans changer son rôle). Retomber sur les permissions
  // par défaut du rôle ici contredirait la policy RLS has_permission() côté
  // base, qui ne fait elle-même aucun repli sur le rôle.
  return normalizePermissions(user.permissions).includes(perm);
}

/**
 * Résout l'utilisateur effectif pour les checks de permission.
 * Si le profil n'est pas encore dans le store (fetchData en cours),
 * on retombe sur les permissions par défaut du rôle de session —
 * sinon la sidebar reste vide jusqu'au chargement.
 */
export function resolvePermissionUser(
  user: PermissionUser | null | undefined,
  fallbackRole?: UserRole | null,
): PermissionUser | null {
  if (user) {
    if (user.actif === false) return null;
    // Cf. hasPermission : un tableau vide signifie "aucun accès", pas
    // "utiliser les permissions par défaut du rôle".
    return { ...user, permissions: normalizePermissions(user.permissions) };
  }
  if (fallbackRole) {
    return {
      role: fallbackRole,
      permissions: ROLE_DEFAULT_PERMISSIONS[fallbackRole] ?? [],
      actif: true,
    };
  }
  return null;
}

export function permissionsToSelection(permissions: string[]): Record<string, boolean> {
  const set = new Set(permissions);
  const selection: Record<string, boolean> = {};
  for (const key of ALL_PERMISSION_KEYS) {
    selection[key] = set.has(key);
  }
  return selection;
}

export function selectionToPermissions(selection: Record<string, boolean>): string[] {
  return ALL_PERMISSION_KEYS.filter((key) => selection[key]);
}

export function normalizePermissions(permissions: string[]): string[] {
  const legacyMap: Record<string, string[]> = {
    Dossiers: ["dossiers:read", "dossiers:write", "dossiers:transition"],
    Comptabilité: ["comptabilite:read", "comptabilite:write"],
    Stock: ["stock:read", "stock:write"],
    "Bons de sortie": ["bons:read", "bons:write"],
    Clients: ["clients:read", "clients:write"],
    Rapports: ["rapports:read"],
  };

  const result = new Set<string>();
  for (const perm of permissions) {
    if (ALL_PERMISSION_KEYS.includes(perm)) {
      result.add(perm);
    } else if (legacyMap[perm]) {
      legacyMap[perm].forEach((p) => result.add(p));
    }
  }
  return [...result];
}

export function getModuleSummary(permissions: string[]): string[] {
  const normalized = normalizePermissions(permissions);
  return PERMISSION_MODULES.filter((module) =>
    module.permissions.some((p) => normalized.includes(p.key)),
  ).map((m) => m.label);
}
