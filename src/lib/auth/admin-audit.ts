import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/shared/logger";
import type { AuditAction } from "@/lib/audit";

type ActorProfile = {
  id: string;
  nom: string;
};

/** Journalise une action de gestion des comptes via service_role (identité = acteur API). */
export async function insertAdminAuditLog(
  admin: SupabaseClient,
  actor: ActorProfile,
  params: {
    action: AuditAction;
    detail: string;
  },
): Promise<void> {
  const { error } = await admin.from("audit_logs").insert({
    user_id: actor.id,
    user_name: actor.nom,
    module: "Utilisateurs",
    action: params.action,
    detail: params.detail,
    ip: "N/A",
  });
  if (error) {
    logError("[audit] Échec insert admin Utilisateurs", error, { detail: params.detail });
  }
}
