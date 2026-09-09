import { logError } from "@/shared/logger";
import type { AuditAction } from "@/lib/audit";

type ActorProfile = {
  id: string;
  nom: string;
};

/**
 * Journalise une action de gestion des comptes via l'API NestJS.
 * `authorization` = l'en-tête Authorization de la requête de l'appelant :
 * indispensable, `POST /audit-logs` exige désormais un token (garde global).
 */
export async function insertAdminAuditLog(
  authorization: string | null,
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
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({
        userName: actor.nom,
        module: "Utilisateurs",
        action: params.action,
        detail: params.detail,
      }),
    });
  } catch (error) {
    logError("[audit] Échec insert admin Utilisateurs", error, { detail: params.detail });
  }
}
