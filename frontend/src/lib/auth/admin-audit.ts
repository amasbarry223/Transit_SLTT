import { logError } from "@/shared/logger";
import type { AuditAction } from "@/lib/audit";

type ActorProfile = {
  id: string;
  nom: string;
};

/**
 * Journalise une action de gestion des comptes via l'API NestJS.
 * `cookieHeader` = l'en-tête Cookie brut de la requête de l'appelant, relayé
 * tel quel — appel serveur-à-serveur, la session vit en cookie httpOnly
 * posé par NestJS, pas dans un en-tête Authorization.
 */
export async function insertAdminAuditLog(
  cookieHeader: string | null,
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
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
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
