import { NextRequest } from "next/server";
import { authErrorResponse, getServerClient, requireUser } from "@/lib/auth/require-admin";

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile, admin } = await requireUser(request);
    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Mot de passe actuel et nouveau mot de passe requis." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }

    const verifyClient = getServerClient();
    const { error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });

    if (verifyError) {
      return Response.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
