import { ForbiddenException } from '@nestjs/common';
import type { CurrentUserType } from '../auth/auth.types';

/**
 * Construit le filtre Prisma pour cloisonner les données par annexe selon les droits utilisateur.
 * Les administrateurs ont accès à toutes les annexes.
 */
export function buildAnnexeScopeFilter(
  user: CurrentUserType,
  options?: { allowUnassigned?: boolean },
): Record<string, any> {
  if (user.role === 'ADMIN') return {};
  if (options?.allowUnassigned) {
    return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
  }
  return { annexeId: { in: user.annexeIds } };
}

/**
 * Valide que l'utilisateur a le droit d'interagir avec une annexe donnée.
 * Les administrateurs contournent cette vérification.
 */
export function assertAnnexeAccess(
  user: CurrentUserType,
  annexeId?: string | null,
  resourceName = 'cette annexe',
): void {
  if (annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(annexeId)) {
    throw new ForbiddenException(`Accès non autorisé à ${resourceName}`);
  }
}
