import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { assertPermissionCeiling } from "@/lib/auth/user-guards";
import { normalizePermissions } from "@/lib/permissions";
import { updateUserBodySchema, zodErrorMessage } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Empêche de désactiver, rétrograder ou supprimer le dernier compte Administrateur actif.
 *  Délègue la vérification à l'API NestJS. */
async function assertNotLastActiveAdmin(token: string | null, targetId: string) {
  try {
    const res = await fetch(`${API_URL}/users/${targetId}`, {
      headers: token ? { Authorization: token } : {},
      cache: "no-store",
    });
    if (!res.ok) return;
    const target = await res.json();
    const role = target.role === "ADMIN" ? "Administrateur" : target.role;
    if (role !== "Administrateur" || target.actif === false) return;

    const listRes = await fetch(`${API_URL}/users`, {
      headers: token ? { Authorization: token } : {},
      cache: "no-store",
    });
    if (!listRes.ok) return;
    const users: any[] = await listRes.json();
    const activeAdmins = users.filter(
      (u) => (u.role === "ADMIN" || u.role === "Administrateur") && u.actif !== false,
    );
    if (activeAdmins.length <= 1) {
      throw new AuthError("Impossible de retirer les droits du dernier administrateur actif.", 400);
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user: adminUser, isAdmin, profile: actorProfile } = await requireUserManager(request);
    const { id } = await context.params;
    const raw = await request.json();
    const parsed = updateUserBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { nom, email, role, permissions, actif } = parsed.data;

    if (id === adminUser.id && actif === false) {
      throw new AuthError("Vous ne pouvez pas désactiver votre propre compte.", 400);
    }

    if (role === "Administrateur" && !isAdmin) {
      throw new AuthError("Seul un administrateur peut promouvoir un compte en Administrateur.", 403);
    }

    const token = request.headers.get("authorization");

    if (!isAdmin) {
      // Vérifier que la cible n'est pas un Administrateur
      try {
        const targetRes = await fetch(`${API_URL}/users/${id}`, {
          headers: token ? { Authorization: token } : {},
          cache: "no-store",
        });
        if (targetRes.ok) {
          const target = await targetRes.json();
          const targetRole = target.role === "ADMIN" ? "Administrateur" : target.role;
          if (targetRole === "Administrateur") {
            throw new AuthError("Seul un administrateur peut modifier un compte Administrateur.", 403);
          }
        }
      } catch (err) {
        if (err instanceof AuthError) throw err;
      }
    }

    if (role !== "Administrateur" || actif === false) {
      await assertNotLastActiveAdmin(token, id);
    }

    const normalizedPerms = normalizePermissions(permissions || []);
    assertPermissionCeiling(actorProfile.permissions, normalizedPerms, isAdmin);

    // Délégation à l'API NestJS
    const updatePayload: Record<string, unknown> = {
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      role: role === "Administrateur" ? "ADMIN" : role,
      permissions: normalizedPerms,
    };
    if (typeof actif === "boolean") {
      updatePayload.actif = actif;
    }

    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(updatePayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de mettre à jour l'utilisateur." }));
      throw new AuthError(errData.message || "Impossible de mettre à jour l'utilisateur.", res.status);
    }

    const user = await res.json();

    await insertAdminAuditLog(null, actorProfile, {
      action: "Modification",
      detail: `Utilisateur ${nom.trim()} mis à jour`,
    });

    return Response.json({ user });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { user: adminUser, isAdmin, profile: actorProfile } = await requireUserManager(request);
    const { id } = await context.params;

    if (id === adminUser.id) {
      throw new AuthError("Vous ne pouvez pas supprimer votre propre compte.", 400);
    }

    const token = request.headers.get("authorization");

    if (!isAdmin) {
      // Vérifier que la cible n'est pas un Administrateur
      try {
        const targetRes = await fetch(`${API_URL}/users/${id}`, {
          headers: token ? { Authorization: token } : {},
          cache: "no-store",
        });
        if (targetRes.ok) {
          const target = await targetRes.json();
          const targetRole = target.role === "ADMIN" ? "Administrateur" : target.role;
          if (targetRole === "Administrateur") {
            throw new AuthError("Seul un administrateur peut supprimer un compte Administrateur.", 403);
          }
        }
      } catch (err) {
        if (err instanceof AuthError) throw err;
      }
    }

    await assertNotLastActiveAdmin(token, id);

    // Récupérer le nom de la cible avant suppression pour le log d'audit
    let targetNom = id;
    try {
      const targetRes = await fetch(`${API_URL}/users/${id}`, {
        headers: token ? { Authorization: token } : {},
        cache: "no-store",
      });
      if (targetRes.ok) {
        const target = await targetRes.json();
        targetNom = target.nom || id;
      }
    } catch {
      // Continuer même si on ne peut pas récupérer le nom
    }

    // Délégation à l'API NestJS
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: token } : {},
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Impossible de supprimer l'utilisateur." }));
      throw new AuthError(errData.message || "Impossible de supprimer l'utilisateur.", res.status);
    }

    await insertAdminAuditLog(null, actorProfile, {
      action: "Suppression",
      detail: `Utilisateur ${targetNom} supprimé`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
