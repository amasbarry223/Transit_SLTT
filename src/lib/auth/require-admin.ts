import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/shared/logger";

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

/** Authentifie la requête et charge le profil appelant — brique commune à requireUserManager/requireUser. */
async function getAuthenticatedProfile(request: Request) {
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

  return { user, profile, admin, supabase };
}

/**
 * Gestion des comptes utilisateurs, avec délégation bornée : un Administrateur
 * y a toujours accès ; un non-admin doit avoir la permission "utilisateurs:manage"
 * — mais ne peut jamais créer, promouvoir, modifier ou supprimer un compte
 * Administrateur (voir les gardes dédiées dans chaque route). `isAdmin` indique
 * lequel des deux cas s'applique à l'appelant.
 */
export async function requireUserManager(request: Request) {
  const { user, profile, admin, supabase } = await getAuthenticatedProfile(request);

  const isAdmin = profile.role === "Administrateur";
  // has_permission() (Postgres) fait autorité — appelée ici plutôt que
  // réimplémentée en TS, pour ne jamais diverger de la même règle qui
  // protège déjà les policies RLS (cf. doc.md §6).
  const { data: canManageUsers, error: permError } = await supabase.rpc("has_permission", {
    perm: "utilisateurs:manage",
  });
  if (permError) {
    throw new AuthError("Erreur de vérification des permissions.", 500);
  }

  if (!profile.actif || !(isAdmin || canManageUsers)) {
    throw new AuthError("Accès réservé à la gestion des utilisateurs.", 403);
  }

  return { user, profile, admin, isAdmin };
}

export async function requireUser(request: Request) {
  const { user, profile, admin } = await getAuthenticatedProfile(request);

  if (!profile.actif) {
    throw new AuthError("Profil introuvable ou inactif.", 403);
  }

  return { user, profile, admin };
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  logError("Auth error response", error);
  return Response.json({ error: "Erreur serveur interne." }, { status: 500 });
}
