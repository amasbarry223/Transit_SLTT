import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { resetPasswordBodySchema, zodErrorMessage } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { isAdmin, profile: actorProfile } = await requireUserManager(request);
    const { id } = await context.params;
    const raw = await request.json();
    const parsed = resetPasswordBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { password } = parsed.data;

    const token = request.headers.get("authorization");

    if (!isAdmin) {
      // Vérifier que la cible n'est pas un Admin
      try {
        const targetRes = await fetch(`${API_URL}/users/${id}`, {
          headers: token ? { Authorization: token } : {},
          cache: "no-store",
        });
        if (targetRes.ok) {
          const target = await targetRes.json();
          const role = target.role === "ADMIN" ? "Administrateur" : target.role;
          if (role === "Administrateur") {
            throw new AuthError(
              "Seul un administrateur peut réinitialiser le mot de passe d'un compte Administrateur.",
              403,
            );
          }
        }
      } catch (err) {
        if (err instanceof AuthError) throw err;
      }
    }

    // Délégation à l'API NestJS
    const res = await fetch(`${API_URL}/users/${id}/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ motDePasse: password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de réinitialiser le mot de passe." }));
      throw new AuthError(errData.message || "Impossible de réinitialiser le mot de passe.", res.status);
    }

    await insertAdminAuditLog(null, actorProfile, {
      action: "Modification",
      detail: `Mot de passe réinitialisé pour l'utilisateur ${id}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
