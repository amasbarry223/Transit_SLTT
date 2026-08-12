import { NextRequest } from "next/server";
import { AuthError, authErrorResponse, getServerClient, requireUser } from "@/lib/auth/require-admin";
import { changePasswordBodySchema, zodErrorMessage } from "@/lib/api/schemas";

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile, admin } = await requireUser(request);
    const raw = await request.json();
    const parsed = changePasswordBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AuthError(zodErrorMessage(parsed.error), 400);
    }
    const { currentPassword, newPassword } = parsed.data;

    const verifyClient = getServerClient();
    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new AuthError("Mot de passe actuel incorrect.", 400);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      throw new AuthError(updateError.message, 400);
    }

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
