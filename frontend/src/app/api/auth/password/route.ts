import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, extractCookieValue, requireUser } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { changePasswordBodySchema, zodErrorMessage } from "@/lib/api/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
// Doit correspondre à CSRF_COOKIE dans api/src/auth/cookie.config.ts.
const CSRF_COOKIE_NAME = "transit_sltt_csrf";

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile } = await requireUser(request);
    const raw = await request.json();
    const parsed = changePasswordBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { currentPassword, newPassword } = parsed.data;

    const cookieHeader = request.headers.get("cookie");
    const csrfToken = extractCookieValue(cookieHeader, CSRF_COOKIE_NAME);

    // Appel direct au endpoint /auth/password de NestJS (accessible à tout
    // utilisateur authentifié) — cookie de session ET jeton CSRF relayés
    // explicitement (voir profile/route.ts pour la justification).
    const updateRes = await fetch(`${API_URL}/auth/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({ message: "Impossible de mettre à jour le mot de passe." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour le mot de passe.", updateRes.status);
    }

    await insertAdminAuditLog(cookieHeader, profile, {
      action: "Modification",
      detail: "Mot de passe modifié par l'utilisateur",
    });

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
