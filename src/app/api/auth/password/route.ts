import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUser } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { changePasswordBodySchema, zodErrorMessage } from "@/lib/api/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile } = await requireUser(request);
    const raw = await request.json();
    const parsed = changePasswordBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { currentPassword, newPassword } = parsed.data;

    const token = request.headers.get("authorization");

    // Appel direct au endpoint /auth/password de NestJS (accessible à tout utilisateur authentifié)
    const updateRes = await fetch(`${API_URL}/auth/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({ message: "Impossible de mettre à jour le mot de passe." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour le mot de passe.", updateRes.status);
    }

    await insertAdminAuditLog(token, profile, {
      action: "Modification",
      detail: "Mot de passe modifié par l'utilisateur",
    });

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
