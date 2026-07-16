import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { admin, isAdmin } = await requireUserManager(request);
    const { id } = await context.params;
    const body = await request.json();
    const { password } = body as { password: string };

    if (!password || password.length < 8) {
      return Response.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }

    if (!isAdmin) {
      const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
      if (target?.role === "Administrateur") {
        throw new AuthError("Seul un administrateur peut réinitialiser le mot de passe d'un compte Administrateur.", 403);
      }
    }

    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
