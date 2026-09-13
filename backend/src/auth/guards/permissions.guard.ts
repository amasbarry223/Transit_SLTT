import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../shared/decorators';
import type { CurrentUserType } from '../auth.types';

/**
 * Guard de permissions.
 * L'Administrateur bypass toutes les permissions.
 *
 * Deux vocabulaires de permission coexistent dans le projet :
 *   - backend / seed : "module.verbe"  (dossiers.creer, factures.modifier…)
 *   - front / UI admin : "module:action" (dossiers:write, factures:read…)
 * Un compte provisionné par l'UI ne contient donc jamais "dossiers.creer" et
 * se voyait refuser TOUTES les écritures. On normalise les deux formes vers
 * "module:read" / "module:write" avant comparaison, sans jamais restreindre
 * un accès qui passait déjà (correspondance exacte toujours acceptée).
 */

const VERB_TO_ACTION: Record<string, 'read' | 'write'> = {
  read: 'read',
  lire: 'read',
  consulter: 'read',
  voir: 'read',
  list: 'read',
  creer: 'write',
  modifier: 'write',
  supprimer: 'write',
  valider: 'write',
  encaisser: 'write',
  decaisser: 'write',
  gerer: 'write',
  upload: 'write',
  transition: 'write',
  write: 'write',
};

// Modules backend sans équivalent 1:1 côté front.
const MODULE_ALIAS: Record<string, string> = {
  caisse: 'comptabilite',
  depenses: 'comptabilite',
  annexes: 'parametres',
  settings: 'parametres',
  cotations: 'devis',
  tracking: 'dossiers',
};

/** "module.verbe" ou "module:action" -> "module:read" | "module:write". */
export function canonicalPermission(perm: string): string {
  const sep = perm.includes(':') ? ':' : '.';
  const [rawModule, rawVerb = 'read'] = perm.split(sep);
  const mod = MODULE_ALIAS[rawModule] ?? rawModule;
  const action = VERB_TO_ACTION[rawVerb] ?? (rawVerb.includes('write') ? 'write' : 'read');
  return `${mod}:${action}`;
}

/**
 * Un jeu de permissions utilisateur satisfait-il la permission `required` ?
 * Accepte les deux vocabulaires + implication write=>read + droit au module.
 */
export function userSatisfiesPermission(userPerms: string[], required: string): boolean {
  const held = new Set(userPerms);
  if (held.has(required)) return true;
  const heldCanon = new Set(userPerms.map(canonicalPermission));
  const need = canonicalPermission(required);
  if (heldCanon.has(need)) return true;
  if (need.endsWith(':read') && heldCanon.has(need.replace(':read', ':write'))) return true;
  if (held.has(need.split(':')[0])) return true;
  return false;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: CurrentUserType }>();
    const user = request.user;

    if (!user) throw new ForbiddenException('Non authentifié');

    // Administrateur / ADMIN = accès total
    if (user.role === 'ADMIN' || user.role === 'Administrateur' || user.permissions?.includes('*')) {
      return true;
    }

    const perms = user.permissions ?? [];
    const hasAll = required.every((perm) => userSatisfiesPermission(perms, perm));
    if (!hasAll) {
      throw new ForbiddenException(`Permission requise : ${required.join(', ')}`);
    }

    return true;
  }
}
