import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch (e) {
    throw new AuthError(
      e instanceof Error ? e.message : "Configuration Supabase admin manquante.",
      500,
    );
  }
}

export function getServerClient(token?: string) {
  try {
    return createServerClient(token);
  } catch (e) {
    throw new AuthError(
      e instanceof Error ? e.message : "Configuration Supabase manquante.",
      500,
    );
  }
}

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token d'authentification requis.", 401);
  }

  const token = authHeader.slice(7);
  const supabase = getServerClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Session invalide ou expirée.", 401);
  }

  const admin = getAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, nom, email, role, permissions, actif")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new AuthError("Profil introuvable.", 403);
  }

  if (!profile.actif || profile.role !== "Administrateur") {
    throw new AuthError("Accès réservé aux administrateurs.", 403);
  }

  return { user, profile, admin };
}

export async function requireUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token d'authentification requis.", 401);
  }

  const token = authHeader.slice(7);
  const supabase = getServerClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("Session invalide ou expirée.", 401);
  }

  const admin = getAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, nom, email, role, permissions, actif")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.actif) {
    throw new AuthError("Profil introuvable ou inactif.", 403);
  }

  return { user, profile, admin };
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Erreur serveur interne." }, { status: 500 });
}
