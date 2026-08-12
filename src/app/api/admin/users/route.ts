import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { assertPermissionCeiling } from "@/lib/auth/user-guards";
import { normalizePermissions } from "@/lib/permissions";
import { createUserBodySchema, zodErrorMessage } from "@/lib/api/schemas";

export async function POST(request: NextRequest) {
  try {
    const { admin, isAdmin, profile: actorProfile } = await requireUserManager(request);
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

    const { data: authUser, error: createError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        nom: nom.trim(),
        role,
        permissions: normalizedPerms,
      },
    });

    if (createError || !authUser.user) {
      throw new AuthError(createError?.message || "Impossible de créer l'utilisateur.", 400);
    }

    // upsert plutôt qu'update : ne dépend pas silencieusement du trigger
    // on_auth_user_created pour que la ligne profiles existe déjà (cf.
    // 20260902_handle_new_user_trigger.sql — le trigger reste la voie
    // normale, mais cette route ne doit pas casser si jamais il est absent
    // ou en retard sur un environnement donné).
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: authUser.user.id,
          nom: nom.trim(),
          email: email.trim().toLowerCase(),
          role,
          permissions: normalizedPerms,
          actif: true,
        },
        { onConflict: "id" },
      )
      .select("*")
      .single();

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      throw new AuthError(profileError.message, 400);
    }

    return Response.json({ user: profile }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
