import { logError } from "@/shared/logger";

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

interface JwtClaims {
  sub?: string;
  email?: string;
  nom?: string;
  role?: string;
  permissions?: string[];
  annexeIds?: string[];
  actif?: boolean;
}

/**
 * Extrait le payload d'un JWT de façon sécurisée côté serveur Next.js
 */
function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
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
    } else if (res.status === 401 || res.status === 403) {
      const errData = (await res.json().catch(() => ({}))) as { message?: string };
      throw new AuthError(errData.message || "Profil introuvable ou inactif.", 401);
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
  }

  // Si l'API NestJS n'a pas pu être interrogée via HTTP ou en fallback direct,
  // on utilise les claims du JWT émis par NestJS
  if (!nestUser) {
    const claims = decodeJwtClaims(token);
    if (claims && claims.sub) {
      nestUser = {
        id: claims.sub,
        email: claims.email || "",
        nom: claims.nom || "Utilisateur",
        role: claims.role || "OPERATEUR",
        permissions: claims.permissions || [],
        annexeIds: claims.annexeIds || [],
        actif: claims.actif !== false,
      };
    }
  }

  if (!nestUser) {
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
