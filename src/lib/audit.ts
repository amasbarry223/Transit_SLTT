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
  | "Utilisateurs";

export type AuditEntry = {
  id: string;
  date: string;
  user: string;
  module: AuditModule;
  action: AuditAction;
  detail: string;
  ip: string;
};

let cachedClientIp: string | null = null;

/** Résout l'IP client via l'API Next (cache en mémoire pour la session). */
export async function resolveClientIp(): Promise<string> {
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
  };
}

/** Insère une entrée d'audit en base. Retourne l'entrée créée ou null en cas d'échec. */
export async function insertAuditLog(params: {
  module: AuditModule;
  action: AuditAction;
  detail: string;
  userName: string;
  ip?: string;
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
      })
      .select()
      .single();

    if (error) throw error;
    return mapAuditLogFromDb(data as Record<string, unknown>);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[audit] Échec insert (${params.module}/${params.action}):`, message);
    return null;
  }
}

/** Journalise un export CSV/Excel sans bloquer l'UI. */
export function logExportAudit(
  module: AuditModule,
  filename: string,
  rowCount: number,
  userName: string,
): void {
  void insertAuditLog({
    module,
    action: "Export",
    detail: `Export ${filename} — ${rowCount} ligne${rowCount !== 1 ? "s" : ""}`,
    userName,
  });
}
