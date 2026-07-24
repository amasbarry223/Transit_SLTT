import { supabase } from "@/lib/supabase";

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
  | "Archives";

export type AuditSourceType = "dossier" | "ecriture" | "facture";

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
      console.warn("[audit] Impossible de résoudre l'IP client:", err);
    }
  }
  cachedClientIp = "N/A";
  return cachedClientIp;
}

export function mapAuditLogFromDb(x: Record<string, unknown>): AuditEntry {
  return {
    id: String(x.id),
    date: String(x.date ?? x.created_at ?? new Date().toISOString()),
    user: String(x.user_name ?? x.user_nom ?? "Système"),
    module: x.module as AuditModule,
    action: x.action as AuditAction,
    detail: String(x.detail),
    ip: String(x.ip ?? "N/A"),
    clientId: x.client_id ? String(x.client_id) : undefined,
    sourceType: x.source_type ? (String(x.source_type) as AuditSourceType) : undefined,
    sourceId: x.source_id ? String(x.source_id) : undefined,
  };
}

/** Insère une entrée d'audit en base. Retourne l'entrée créée ou null en cas d'échec. */
export async function insertAuditLog(params: {
  module: AuditModule;
  action: AuditAction;
  detail: string;
  userName: string;
  ip?: string;
  /** Client concerné, pour un suivi structuré côté Classeur plutôt qu'une correspondance texte. */
  clientId?: string;
  source?: AuditSourceRef;
}): Promise<AuditEntry | null> {
  const ip = params.ip ?? (await resolveClientIp());

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_name: params.userName,
        module: params.module,
        action: params.action,
        detail: params.detail,
        ip,
        client_id: params.clientId ?? null,
        source_type: params.source?.sourceType ?? null,
        source_id: params.source?.sourceId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapAuditLogFromDb(data as Record<string, unknown>);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
    console.error(`[audit] Échec insert (${params.module}/${params.action}):`, message);
    return null;
  }
}
