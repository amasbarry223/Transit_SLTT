import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { assertAnnexeCeiling } from "@/lib/auth/user-guards";
import { updateUserAnnexesBodySchema, zodErrorMessage } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Remplace intégralement les annexes assignées à un utilisateur. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user, isAdmin, profile: actorProfile } = await requireUserManager(request);
    const { id } = await context.params;

    const raw = await request.json();
    const parsed = updateUserAnnexesBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { annexeIds } = parsed.data;
    await assertAnnexeCeiling(null, user.id, annexeIds, isAdmin);

    const token = request.headers.get("authorization");

    // Délégation à l'API NestJS
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ annexeIds }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de mettre à jour les annexes." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour les annexes.", res.status);
    }

    await insertAdminAuditLog(null, actorProfile, {
      action: "Modification",
      detail: `Annexes de l'utilisateur ${id} mises à jour`,
    });

    return Response.json({ annexeIds });
  } catch (error) {
    return authErrorResponse(error);
  }
}
