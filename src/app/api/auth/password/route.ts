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

    // 1. Vérifier le mot de passe actuel via /auth/login
    const verifyRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: profile.email,
        password: currentPassword,
      }),
    });

    if (!verifyRes.ok) {
      throw new AuthError("Mot de passe actuel incorrect.", 400);
    }

    // 2. Mettre à jour le mot de passe via PUT /users/:id
    const updateRes = await fetch(`${API_URL}/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({ message: "Impossible de mettre à jour le mot de passe." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour le mot de passe.", updateRes.status);
    }

    await insertAdminAuditLog(null, profile, {
      action: "Modification",
      detail: "Mot de passe modifié par l'utilisateur",
    });

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
