import { NextRequest } from "next/server";
import { authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";
import type { UserRole } from "@/lib/domain-types";

const VALID_ROLES: UserRole[] = ["Administrateur", "Agent de transit", "Comptable", "Magasinier"];

export async function POST(request: NextRequest) {
  try {
    const { admin, isAdmin } = await requireUserManager(request);
    const body = await request.json();
    const { nom, email, role, permissions, password } = body as {
      nom: string;
      email: string;
      role: UserRole;
      permissions: string[];
      password: string;
    };

    if (!nom?.trim() || !email?.trim() || !password || password.length < 8) {
      return Response.json(
        { error: "Nom, e-mail et mot de passe (8 caractères min.) requis." },
        { status: 400 },
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return Response.json({ error: "Rôle invalide." }, { status: 400 });
    }

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
