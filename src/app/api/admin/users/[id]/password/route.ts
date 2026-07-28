import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { resetPasswordBodySchema, zodErrorMessage } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { admin, isAdmin } = await requireUserManager(request);
    const { id } = await context.params;
    const raw = await request.json();
    const parsed = resetPasswordBodySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }
    const { password } = parsed.data;

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
