import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { assertCanTouchTarget, assertPermissionCeiling } from "@/lib/auth/user-guards";
import { normalizePermissions } from "@/lib/permissions";
import { updateUserBodySchema, zodErrorMessage } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };
type AdminClient = Awaited<ReturnType<typeof requireUserManager>>["admin"];

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
    const { admin, user: adminUser, isAdmin, profile: actorProfile } = await requireUserManager(request);
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

    await assertCanTouchTarget(admin, id, isAdmin);
    if (role !== "Administrateur" || actif === false) {
      await assertNotLastActiveAdmin(admin, id);
    }

    const normalizedPerms = normalizePermissions(permissions || []);
    assertPermissionCeiling(actorProfile.permissions, normalizedPerms, isAdmin);

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
      email: email.trim().toLowerCase(),
      user_metadata: {
        nom: nom.trim(),
        role,
        permissions: normalizedPerms,
      },
    });

    if (authError) {
      throw new AuthError(authError.message, 400);
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
      throw new AuthError(profileError.message, 400);
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
      throw new AuthError("Vous ne pouvez pas supprimer votre propre compte.", 400);
    }

    await assertCanTouchTarget(admin, id, isAdmin);
    await assertNotLastActiveAdmin(admin, id);

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      throw new AuthError(error.message, 400);
    }

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
