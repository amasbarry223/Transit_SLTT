import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";

type RouteContext = { params: Promise<{ id: string }> };
type AdminClient = Awaited<ReturnType<typeof requireUserManager>>["admin"];

const VALID_ROLES: UserRole[] = ["Administrateur", "Agent de transit", "Comptable", "Magasinier"];

/** Bloque toute action d'un non-admin sur un compte qui est déjà Administrateur. */
async function assertCanTouchTarget(admin: AdminClient, targetId: string, isAdmin: boolean) {
  if (isAdmin) return;
  const { data: target } = await admin.from("profiles").select("role").eq("id", targetId).single();
  if (target?.role === "Administrateur") {
    throw new AuthError("Seul un administrateur peut modifier un compte Administrateur.", 403);
  }
}

/** Empêche de désactiver, rétrograder ou supprimer le dernier compte Administrateur actif. */
async function assertNotLastActiveAdmin(admin: AdminClient, targetId: string) {
  const { data: target } = await admin.from("profiles").select("role, actif").eq("id", targetId).single();
  if (target?.role !== "Administrateur" || !target.actif) return;
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "Administrateur")
    .eq("actif", true);
  if ((count ?? 0) <= 1) {
    throw new AuthError("Impossible de retirer les droits du dernier administrateur actif.", 400);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { admin, user: adminUser, isAdmin } = await requireUserManager(request);
    const { id } = await context.params;
    const body = await request.json();
    const { nom, email, role, permissions, actif } = body as {
      nom: string;
      email: string;
      role: UserRole;
      permissions: string[];
      actif?: boolean;
    };

    if (id === adminUser.id && actif === false) {
      return Response.json(
        { error: "Vous ne pouvez pas désactiver votre propre compte." },
        { status: 400 },
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return Response.json({ error: "Rôle invalide." }, { status: 400 });
    }

    if (role === "Administrateur" && !isAdmin) {
      return Response.json(
        { error: "Seul un administrateur peut promouvoir un compte en Administrateur." },
        { status: 403 },
      );
    }

    await assertCanTouchTarget(admin, id, isAdmin);
    if (role !== "Administrateur" || actif === false) {
      await assertNotLastActiveAdmin(admin, id);
    }

    const normalizedPerms = normalizePermissions(permissions || []);

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
      email: email.trim().toLowerCase(),
      user_metadata: {
        nom: nom.trim(),
        role,
        permissions: normalizedPerms,
      },
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      role,
      permissions: normalizedPerms,
    };

    if (typeof actif === "boolean") {
      updatePayload.actif = actif;
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (profileError) {
      return Response.json({ error: profileError.message }, { status: 400 });
    }

    return Response.json({ user: profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { admin, user: adminUser, isAdmin } = await requireUserManager(request);
    const { id } = await context.params;

    if (id === adminUser.id) {
      return Response.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte." },
        { status: 400 },
      );
    }

    await assertCanTouchTarget(admin, id, isAdmin);
    await assertNotLastActiveAdmin(admin, id);

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
