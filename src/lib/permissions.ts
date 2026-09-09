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
    id: "recus-paiement",
    label: "Reçus de paiement",
    permissions: [
      { key: "recus-paiement:read", label: "Lecture", action: "read" },
      { key: "recus-paiement:write", label: "Écriture", action: "write" },
    ],
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
  {
    id: "documents",
    label: "Documents & OCR",
    permissions: [
      { key: "documents:read", label: "Lecture", action: "read" },
      { key: "documents:write", label: "Écriture", action: "write" },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.key),
);

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  Administrateur: [...ALL_PERMISSION_KEYS],
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
    "stock:read",
    "bons:read",
    "fournisseurs:read",
    "fournisseurs:write",
    "transporteurs:read",
    "transporteurs:write",
    "contrats:read",
    "archives:read",
    "archives:write",
    "documents:read",
    "documents:write",
    "parametres:read",
  ],
  Comptable: [
    "dashboard:read",
    "clients:read",
    "devis:read",
    "contrats:read",
    "contrats:write",
    "dossiers:read",
    "factures:read",
    "factures:write",
    "bons:read",
    "bons:write-caisse",
    "fournisseurs:read",
    "transporteurs:read",
    "comptabilite:read",
    "comptabilite:write",
    "recus-paiement:read",
    "recus-paiement:write",
    "rapports:read",
    "archives:read",
    "documents:read",
    "parametres:read",
  ],
};

export interface PermissionUser {
  role: UserRole;
  permissions: string[];
  actif?: boolean;
}

export function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return "Administrateur";
  const r = String(role).trim();
  switch (r) {
    case "ADMIN":
    case "Administrateur":
    case "DIRECTION":
    case "Direction":
    case "Directeur":
      return "Administrateur";
    case "TRANSITAIRE":
    case "AGENT_TRANSIT":
    case "Agent de transit":
    case "COMMERCIAL":
    case "Commercial":
    case "MAGASINIER":
    case "OPERATEUR":
    case "Magasinier":
      return "Agent de transit";
    case "COMPTABLE":
    case "Comptable":
      return "Comptable";
    default:
      return "Administrateur";
  }
}

export function hasPermission(user: PermissionUser | null | undefined, perm: string): boolean {
  if (!user || user.actif === false) return false;
  const role = normalizeRole(user.role);
  if (role === "Administrateur") return true;
  const perms = user.permissions && user.permissions.length > 0
    ? normalizePermissions(user.permissions)
    : (ROLE_DEFAULT_PERMISSIONS[role] ?? []);
  return perms.includes(perm);
}

/**
 * Résout l'utilisateur effectif pour les checks de permission.
 */
export function resolvePermissionUser(
  user: PermissionUser | null | undefined,
  fallbackRole?: string | null,
): PermissionUser | null {
  if (user) {
    if (user.actif === false) return null;
    const role = normalizeRole(user.role);
    const effectivePerms = user.permissions && user.permissions.length > 0
      ? normalizePermissions(user.permissions)
      : (ROLE_DEFAULT_PERMISSIONS[role] ?? []);
    return { ...user, role, permissions: effectivePerms };
  }
  if (fallbackRole) {
    const role = normalizeRole(fallbackRole);
    return {
      role,
      permissions: ROLE_DEFAULT_PERMISSIONS[role] ?? [],
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
