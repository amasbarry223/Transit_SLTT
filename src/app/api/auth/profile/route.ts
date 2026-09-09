import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUser } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { updateOwnProfileBodySchema, zodErrorMessage } from "@/lib/api/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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

    const token = request.headers.get("authorization");

    // Délégation à l'API NestJS
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ nom, email }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de mettre à jour le profil." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour le profil.", res.status);
    }

    const updated = await res.json();

    await insertAdminAuditLog(token, { id: user.id, nom }, {
      action: "Modification",
      detail: `Profil de ${nom} mis à jour`,
    });

    return Response.json({ user: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
