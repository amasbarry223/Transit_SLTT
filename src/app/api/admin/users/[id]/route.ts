import { NextRequest } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { admin, user: adminUser } = await requireAdmin(request);
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
    const { admin, user: adminUser } = await requireAdmin(request);
    const { id } = await context.params;

    if (id === adminUser.id) {
      return Response.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte." },
        { status: 400 },
      );
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
