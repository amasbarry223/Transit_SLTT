import { NextRequest } from "next/server";
import { authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import { createUserBodySchema, zodErrorMessage } from "@/lib/api/schemas";

export async function POST(request: NextRequest) {
  try {
    const { admin, isAdmin } = await requireUserManager(request);
    const raw = await request.json();
    const parsed = createUserBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }

    const { nom, email, role, permissions, password } = parsed.data;

    if (role === "Administrateur" && !isAdmin) {
      return Response.json(
        { error: "Seul un administrateur peut créer un compte Administrateur." },
        { status: 403 },
      );
    }

    const normalizedPerms = normalizePermissions(permissions || []);

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
      return Response.json(
        { error: createError?.message || "Impossible de créer l'utilisateur." },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .update({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        role,
        permissions: normalizedPerms,
        actif: true,
      })
      .eq("id", authUser.user.id)
      .select("*")
      .single();

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      return Response.json({ error: profileError.message }, { status: 400 });
    }

    return Response.json({ user: profile }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
