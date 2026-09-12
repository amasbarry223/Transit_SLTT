import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, extractCookieValue, requireUser } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { updateOwnProfileBodySchema, zodErrorMessage } from "@/lib/api/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
// Doit correspondre à CSRF_COOKIE dans api/src/auth/cookie.config.ts.
const CSRF_COOKIE_NAME = "transit_sltt_csrf";

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile } = await requireUser(request);
    const raw = await request.json();
    const parsed = updateOwnProfileBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }

    const nom = parsed.data.nom.trim();
    const email = parsed.data.email.trim().toLowerCase();

    const cookieHeader = request.headers.get("cookie");
    const csrfToken = extractCookieValue(cookieHeader, CSRF_COOKIE_NAME);

    // Délégation à l'API NestJS — cookie de session ET jeton CSRF relayés
    // explicitement (appel serveur-à-serveur, pas un fetch du navigateur :
    // NestJS exige un en-tête X-CSRF-Token distinct du cookie sur toute
    // requête d'état, cf. CsrfGuard).
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify({ nom, email }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de mettre à jour le profil." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour le profil.", res.status);
    }

    const updated = await res.json();

    await insertAdminAuditLog(cookieHeader, { id: user.id, nom }, {
      action: "Modification",
      detail: `Profil de ${nom} mis à jour`,
    });

    return Response.json({ user: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
