import { NextRequest } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { admin } = await requireAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const { password } = body as { password: string };

    if (!password || password.length < 8) {
      return Response.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
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
