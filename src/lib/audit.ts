import { logError, logWarn } from "@/shared/logger";

export type AuditAction =
  | "Connexion"
  | "Création"
  | "Modification"
  | "Validation"
  | "Paiement"
  | "Export"
  | "Suppression";

export type AuditModule =
  | "Authentification"
  | "Dossiers"
  | "Comptabilité"
  | "Reçus de paiement"
  | "Factures"
  | "Stock"
  | "Bons"
  | "Clients"
  | "Transporteurs"
  | "Fournisseurs"
  | "Devis"
  | "Utilisateurs"
  | "Contrats"
  | "Dépenses"
  | "Sociétés"
  | "Annexes"
  | "Ports"
  | "Archives"
  | "Documents"
  | "Système";

/** Modules d'audit utilisés par les slices du store (sous-ensemble de `AuditModule`). */
export const AUDIT_MODULE = {
  Dossiers: "Dossiers",
  Fournisseurs: "Fournisseurs",
  Utilisateurs: "Utilisateurs",
  Stock: "Stock",
  Societes: "Sociétés",
  Transporteurs: "Transporteurs",
  Clients: "Clients",
  Devis: "Devis",
  Archives: "Archives",
  Bons: "Bons",
  Annexes: "Annexes",
  Ports: "Ports",
  Contrats: "Contrats",
  Depenses: "Dépenses",
  Documents: "Documents",
  Comptabilite: "Comptabilité",
  RecusPaiement: "Reçus de paiement",
  Factures: "Factures",
  Systeme: "Système",
} as const satisfies Record<string, AuditModule>;

/** Actions d'audit utilisées par les slices du store (sous-ensemble de `AuditAction`). */
export const AUDIT_ACTION = {
  Creation: "Création",
  Modification: "Modification",
  Suppression: "Suppression",
  Validation: "Validation",
  Paiement: "Paiement",
} as const satisfies Record<string, AuditAction>;

export type AuditSourceType =
  | "dossier"
  | "ecriture"
  | "facture"
  | "document"
  | "operation_comptable"
  | "cloture_caisse"
  | "recu_paiement";

export type AuditSourceRef = {
  sourceType: AuditSourceType;
  sourceId: string;
};

export type AuditEntry = {
  id: string;
  date: string;
  user: string;
  module: AuditModule;
  action: AuditAction;
  detail: string;
  ip: string;
  /** Client concerné par le mouvement, quand applicable (Classeur, suivi 3.3). */
  clientId?: string;
  sourceType?: AuditSourceType;
  sourceId?: string;
  /** Annexe dans le contexte de laquelle l'action a été réalisée (cloisonnement audit_logs). */
  annexeId?: string;
};

let cachedClientIp: string | null = null;

/** Résout l'IP client via l'API Next (cache en mémoire pour la session). */
async function resolveClientIp(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;
  try {
    const res = await fetch("/api/client-ip", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      cachedClientIp = data.ip?.trim() || "N/A";
      return cachedClientIp;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      logWarn("[audit] Impossible de résoudre l'IP client", err);
    }
  }
  cachedClientIp = "N/A";
  return cachedClientIp;
}

import { api } from "@/lib/api-client";

export function mapAuditLogFromDb(row: Record<string, unknown>): AuditEntry {
  const donnees = (row.donnees as Record<string, any>) || {};
  const userObj = (row.user as Record<string, any>) || {};
  const userName = String(
    userObj.nom ||
    donnees.userName ||
    row.user_name ||
    row.user_nom ||
    "Système",
  );
  const detail = String(donnees.detail || row.detail || row.action || "");

  return {
    id: String(row.id),
    date: String(row.createdAt ?? row.date ?? row.created_at ?? new Date().toISOString()),
    user: userName,
    module: (row.entite || row.module || "Système") as AuditModule,
    action: (row.action as AuditAction) || "Modification",
    detail,
    ip: String(row.adresseIp ?? row.ip ?? "N/A"),
    clientId: row.clientId ? String(row.clientId) : (row.client_id ? String(row.client_id) : undefined),
    sourceType: (row.sourceType || row.source_type) as AuditSourceType | undefined,
    sourceId: (row.sourceId || row.source_id || row.entiteId) as string | undefined,
    annexeId: (row.annexeId || row.annexe_id) as string | undefined,
  };
}

/** Insère une entrée d'audit en base de données. Retourne l'entrée créée. */
export async function insertAuditLog(params: {
  module: AuditModule;
  action: AuditAction;
  detail: string;
  userName: string;
  ip?: string;
  /** Client concerné, pour un suivi structuré côté Classeur plutôt qu'une correspondance texte. */
  clientId?: string;
  source?: AuditSourceRef;
  /** Annexe dans le contexte de laquelle l'action a été réalisée (cloisonnement audit_logs_select). */
  annexeId?: string;
}): Promise<AuditEntry | null> {
  const ip = params.ip ?? (await resolveClientIp());
  let dbId = crypto.randomUUID();

  try {
    const created = await api.auditLogs.log({
      action: params.action,
      entite: params.module,
      entiteId: params.source?.sourceId,
      detail: params.detail,
      userName: params.userName || "Système",
      ip,
      donnees: {
        detail: params.detail,
        userName: params.userName,
        clientId: params.clientId,
        annexeId: params.annexeId,
        source: params.source,
      },
    });
    if (created?.id) dbId = created.id;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      logWarn("[audit] Échec de persistance du log d'audit (mode local)", err);
    }
  }

  return {
    id: dbId,
    date: new Date().toISOString(),
    user: params.userName || "Système",
    module: params.module,
    action: params.action,
    detail: params.detail,
    ip,
    clientId: params.clientId,
    sourceType: params.source?.sourceType,
    sourceId: params.source?.sourceId,
    annexeId: params.annexeId,
  };
}
