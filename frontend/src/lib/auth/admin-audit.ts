import { logError } from "@/shared/logger";
import type { AuditAction } from "@/lib/audit";
import { resolveServerApiUrl } from "@/lib/api/server-api-url";
import { extractCookieValue } from "@/lib/auth/require-admin";
import { CSRF_COOKIE_NAME } from "@/lib/auth/csrf-cookie";

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
  const apiUrl = resolveServerApiUrl();
  // POST /audit-logs est protégé par CsrfGuard côté NestJS comme toute autre
  // requête d'état — sans cet en-tête, l'écriture échoue en 403 et est
  // avalée silencieusement par le catch ci-dessous (voir profile/route.ts
  // pour la même justification côté cookie+CSRF relayés explicitement).
  const csrfToken = extractCookieValue(cookieHeader, CSRF_COOKIE_NAME);
  try {
    await fetch(`${apiUrl}/audit-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
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
