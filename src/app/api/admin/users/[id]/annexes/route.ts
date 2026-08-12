import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, requireUserManager } from "@/lib/auth/require-admin";
import { assertAnnexeCeiling, assertCanTouchTarget } from "@/lib/auth/user-guards";
import { updateUserAnnexesBodySchema, zodErrorMessage } from "@/lib/api/schemas";

type RouteContext = { params: Promise<{ id: string }> };

/** Remplace intégralement les annexes assignées à un utilisateur (delete + insert). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user, admin, isAdmin } = await requireUserManager(request);
    const { id } = await context.params;
    await assertCanTouchTarget(admin, id, isAdmin);

    const raw = await request.json();
    const parsed = updateUserAnnexesBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { annexeIds } = parsed.data;
    await assertAnnexeCeiling(admin, user.id, annexeIds, isAdmin);

    const { error: deleteError } = await admin.from("user_annexes").delete().eq("user_id", id);
    if (deleteError) {
      throw new AuthError(deleteError.message, 400);
    }

    const { error: insertError } = await admin
      .from("user_annexes")
      .insert(annexeIds.map((annexeId) => ({ user_id: id, annexe_id: annexeId })));
    if (insertError) {
      throw new AuthError(insertError.message, 400);
    }

    return Response.json({ annexeIds });
  } catch (error) {
    return authErrorResponse(error);
  }
}
