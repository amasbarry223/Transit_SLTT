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

/**
 * Empêche un délégué `utilisateurs:manage` d'assigner à autrui une annexe à
 * laquelle il n'a lui-même pas accès (sinon il pourrait s'octroyer indirectement
 * une visibilité cross-annexe via un compte tiers).
 */
export async function assertAnnexeCeiling(
  admin: { from: (table: string) => any },
  actorId: string,
  requestedAnnexeIds: string[],
  isAdmin: boolean,
) {
  if (isAdmin) return;
  const { data: rows } = await admin.from("user_annexes").select("annexe_id").eq("user_id", actorId);
  const allowed = new Set((rows ?? []).map((r: { annexe_id: string }) => r.annexe_id));
  const overflow = requestedAnnexeIds.filter((id) => !allowed.has(id));
  if (overflow.length > 0) {
    throw new AuthError(
      "Annexes hors périmètre délégué : vous ne pouvez assigner que des annexes auxquelles vous avez vous-même accès.",
      403,
    );
  }
}
