import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { assertAnnexeCeiling, assertCanTouchTarget } from "@/lib/auth/user-guards";

type RouteContext = { params: Promise<{ id: string }> };

/** Remplace intégralement les annexes assignées à un utilisateur (delete + insert). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user, admin, isAdmin } = await requireUserManager(request);
    const { id } = await context.params;
    await assertCanTouchTarget(admin, id, isAdmin);

    const raw = await request.json();
    const annexeIds = Array.isArray(raw?.annexeIds)
      ? raw.annexeIds.filter((v: unknown) => typeof v === "string")
      : null;
    if (!annexeIds || annexeIds.length === 0) {
      throw new AuthError("Au moins une annexe doit être assignée à l'utilisateur.", 400);
    }
    await assertAnnexeCeiling(admin, user.id, annexeIds, isAdmin);

    const { error: deleteError } = await admin.from("user_annexes").delete().eq("user_id", id);
    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 400 });
    }

    const { error: insertError } = await admin
      .from("user_annexes")
      .insert(annexeIds.map((annexeId: string) => ({ user_id: id, annexe_id: annexeId })));
    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 400 });
    }

    return Response.json({ annexeIds });
  } catch (error) {
    return authErrorResponse(error);
  }
}
