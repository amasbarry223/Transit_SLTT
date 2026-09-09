import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { assertPermissionCeiling } from "@/lib/auth/user-guards";
import { normalizePermissions } from "@/lib/permissions";
import { createUserBodySchema, zodErrorMessage } from "@/lib/api/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, profile: actorProfile } = await requireUserManager(request);
    const raw = await request.json();
    const parsed = createUserBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }

    const { nom, email, role, permissions, password } = parsed.data;

    if (role === "Administrateur" && !isAdmin) {
      throw new AuthError("Seul un administrateur peut créer un compte Administrateur.", 403);
    }

    const normalizedPerms = normalizePermissions(permissions || []);
    assertPermissionCeiling(actorProfile.permissions, normalizedPerms, isAdmin);

    // Délégation à l'API NestJS
    const token = request.headers.get("authorization");
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        role: role === "Administrateur" ? "ADMIN" : role,
        permissions: normalizedPerms,
        password,
        annexeIds: [],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de créer l'utilisateur." }));
      throw new AuthError(errData.message || "Impossible de créer l'utilisateur.", res.status);
    }

    const user = await res.json();

    await insertAdminAuditLog(null, actorProfile, {
      action: "Création",
      detail: `Utilisateur ${nom.trim()} créé`,
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
