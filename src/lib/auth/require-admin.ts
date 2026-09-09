import { logError, logWarn } from "@/shared/logger";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  nom?: string;
  role?: string;
  permissions?: string[];
  annexeIds?: string[];
}

export interface AuthenticatedProfile {
  id: string;
  nom: string;
  email: string;
  role: string;
  permissions: string[];
  actif: boolean;
}

/** Forme d'un utilisateur renvoyé par `/auth/me` ou reconstruit depuis les claims JWT. */
interface NestUser {
  id: string;
  email?: string;
  nom?: string;
  role?: string;
  permissions?: string[];
  annexeIds?: string[];
  actif?: boolean;
}

/**
 * Authentifie la requête via l'API NestJS (ou décode le JWT émis par NestJS).
 * Remplace définitivement l'ancien auth Supabase.
 */
async function getAuthenticatedProfile(request: Request): Promise<{
  user: AuthenticatedUser;
  profile: AuthenticatedProfile;
  isAdmin: boolean;
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token d'authentification requis.", 401);
  }

  const token = authHeader.slice(7);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  let nestUser: NestUser | null = null;

  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      nestUser = (await res.json()) as NestUser;
    } else {
      // Toute réponse non-OK (401, 403, 500…) échoue fermé en 401. On NE
      // retombe PAS sur les claims du JWT : non vérifiés = forgeables. Seul
      // NestJS, qui détient le secret, fait autorité sur l'identité.
      const errData = (await res.json().catch(() => ({}))) as { message?: string };
      throw new AuthError(errData.message || "Profil introuvable ou inactif.", 401);
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
    logWarn("[auth] /auth/me injoignable", err);
    throw new AuthError("Session invalide ou expirée.", 401);
  }

  if (!nestUser?.id) {
    throw new AuthError("Session invalide ou expirée.", 401);
  }

  if (nestUser.actif === false) {
    throw new AuthError("Profil introuvable ou inactif.", 401);
  }

  const rawRole = nestUser.role ?? "OPERATEUR";
  const role = rawRole === "ADMIN" ? "Administrateur" : rawRole;
  const isAdmin = role === "Administrateur";
  const permissions = nestUser.permissions ?? (isAdmin ? ["*"] : []);

  const profile: AuthenticatedProfile = {
    id: nestUser.id,
    nom: nestUser.nom || "",
    email: nestUser.email || "",
    role,
    permissions,
    // Un profil inactif a déjà levé une AuthError plus haut.
    actif: true,
  };

  const user: AuthenticatedUser = {
    id: nestUser.id,
    email: nestUser.email || "",
    nom: nestUser.nom,
    role,
    permissions,
    annexeIds: nestUser.annexeIds,
  };

  return { user, profile, isAdmin };
}

export async function requireUser(request: Request) {
  return getAuthenticatedProfile(request);
}

export async function requireUserManager(request: Request) {
  const { user, profile, isAdmin } = await getAuthenticatedProfile(request);
  const canManageUsers =
    isAdmin ||
    profile.permissions.includes("utilisateurs:manage") ||
    profile.permissions.includes("*");

  if (!canManageUsers) {
    throw new AuthError("Accès réservé à la gestion des utilisateurs.", 403);
  }

  return { user, profile, isAdmin };
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status,
      headers: { "content-type": "application/json" },
    });
  }
  const message = error instanceof Error ? error.message : "Erreur interne.";
  logError("[authErrorResponse]", error);
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });
}
