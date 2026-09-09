import { AuthError } from "@/lib/auth/require-admin";
import { normalizePermissions } from "@/lib/permissions";

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
 * laquelle il n'a lui-même pas accès.
 */
export async function assertAnnexeCeiling(
  _admin: null,
  actorId: string,
  requestedAnnexeIds: string[],
  isAdmin: boolean,
) {
  if (isAdmin) return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  try {
    const res = await fetch(`${apiUrl}/users/${actorId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const actor = await res.json();
      const allowed = new Set<string>(
        (actor.userAnnexes || []).map((ua: { annexe?: { id: string }; annexeId?: string }) =>
          ua.annexe?.id || ua.annexeId || "",
        ),
      );
      const overflow = requestedAnnexeIds.filter((id) => !allowed.has(id));
      if (overflow.length > 0) {
        throw new AuthError(
          "Annexes hors périmètre délégué : vous ne pouvez assigner que des annexes auxquelles vous avez vous-même accès.",
          403,
        );
      }
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
    // En cas d'erreur réseau, on laisse passer
  }
}
