import { AuthError } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";

/** Bloque toute action d'un non-admin sur un compte qui est déjà Administrateur. */
export async function assertCanTouchTarget(
  admin: { from: (table: string) => any },
  targetId: string,
  isAdmin: boolean,
) {
  if (isAdmin) return;
  const { data: target } = await admin.from("profiles").select("role").eq("id", targetId).single();
  if (target?.role === "Administrateur") {
    throw new AuthError("Seul un administrateur peut modifier un compte Administrateur.", 403);
  }
}

/**
 * Empêche un délégué `utilisateurs:manage` de s'auto-attribuer (ou d'attribuer
 * à autrui) des permissions qu'il ne possède pas lui-même.
 */
export function assertPermissionCeiling(
  actorPermissions: string[] | null | undefined,
  requestedPermissions: string[],
  isAdmin: boolean,
) {
  if (isAdmin) return;
  const allowed = new Set(normalizePermissions(actorPermissions ?? []));
  const overflow = normalizePermissions(requestedPermissions).filter((p) => !allowed.has(p));
  if (overflow.length > 0) {
    throw new AuthError(
      `Permissions hors périmètre délégué : ${overflow.join(", ")}.`,
      403,
    );
  }
}
