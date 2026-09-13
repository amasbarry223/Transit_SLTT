import { logError } from "@/shared/logger";
import type { AuditAction } from "@/lib/audit";

type ActorProfile = {
  id: string;
  nom: string;
};

/**
 * Journalise une action de gestion des comptes via l'API NestJS.
 * Remplace l'ancien insertAdminAuditLog qui utilisait le client Supabase service_role.
 */
export async function insertAdminAuditLog(
  _admin: null,
  actor: ActorProfile,
  params: {
    action: AuditAction;
    detail: string;
  },
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  try {
    await fetch(`${apiUrl}/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: actor.id,
        userName: actor.nom,
        module: "Utilisateurs",
        action: params.action,
        detail: params.detail,
        ip: "N/A",
      }),
    });
  } catch (error) {
    logError("[audit] Échec insert admin Utilisateurs", error, { detail: params.detail });
  }
}
