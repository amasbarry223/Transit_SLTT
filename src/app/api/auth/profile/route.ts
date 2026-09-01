import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUser } from "@/lib/auth/require-admin";
import { insertAdminAuditLog } from "@/lib/auth/admin-audit";
import { updateOwnProfileBodySchema, zodErrorMessage } from "@/lib/api/schemas";

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile, admin } = await requireUser(request);
    const raw = await request.json();
    const parsed = updateOwnProfileBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }

    const nom = parsed.data.nom.trim();
    const email = parsed.data.email.trim().toLowerCase();

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      email,
      user_metadata: { nom },
    });
    if (authError) {
      throw new AuthError(authError.message, 400);
    }

    const { data: updated, error: profileError } = await admin
      .from("profiles")
      .update({ nom, email })
      .eq("id", user.id)
      .select("*")
      .single();

    if (profileError || !updated) {
      throw new AuthError(profileError?.message || "Impossible de mettre à jour le profil.", 400);
    }

    await insertAdminAuditLog(admin, { id: user.id, nom }, {
      action: "Modification",
      detail: `Profil de ${nom} mis à jour`,
    });

    return Response.json({ user: updated });
  } catch (error) {
    return authErrorResponse(error);
  }
}
