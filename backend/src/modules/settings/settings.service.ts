import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { userSatisfiesPermission } from '../../auth/guards/permissions.guard';
import type { CurrentUserType } from '../../auth/auth.types';

const MAX_SETTING_VALUE_LENGTH = 10_000;
const VALID_SETTING_TYPES = new Set(['string', 'number', 'boolean', 'json']);

/** getAll()/getByKey() n'étaient protégés que par JwtAuthGuard (pas de
 *  @RequirePermission) et renvoyaient TOUTES les lignes de `Setting` sans
 *  filtre — n'importe quel compte authentifié, quel que soit son rôle,
 *  pouvait donc lire des réglages métier sensibles (taux de commission,
 *  délai de session, etc.).
 *
 *  On ne filtre PAS sur la colonne `isPublic` : plusieurs réglages de
 *  branding société (societe_logo_url, societe_rccm, societe_nif,
 *  societe_signataire_dg/pdg...) ne sont dans aucun seed et n'ont donc
 *  jamais été créés avec `isPublic: true` explicite — leur upsert (plain
 *  string, cf. societes-slice.ts::updateSociete) passe par la branche
 *  `create` de setMany(), qui laisse `isPublic` au défaut Prisma `false`.
 *  Filtrer sur `isPublic` masquerait donc le logo/RCCM/NIF/signataires à
 *  tout utilisateur sans accès Paramètres, alors que ces informations
 *  s'affichent normalement partout dans l'app (en-têtes, documents
 *  imprimés) pour tout le monde. On masque à la place une liste explicite
 *  des clés réellement sensibles (mêmes clés que la sweep de review qui a
 *  signalé cette faille), plus sûre à faire évoluer sur une app déjà en
 *  prod dont on ne peut pas relire l'état réel des colonnes `isPublic`. */
const SENSITIVE_SETTING_KEYS = new Set([
  'commission_rate',
  'delai_echeance_jours',
  'session_timeout_min',
  'default_stock_seuil',
  'max_upload_size_mb',
  'security_mfa_enabled',
]);

function canSeePrivateSettings(user: CurrentUserType): boolean {
  const role = String(user.role || '').toUpperCase();
  if (role === 'ADMIN') return true;
  const perms = user.permissions ?? [];
  if (perms.includes('*')) return true;
  return userSatisfiesPermission(perms, 'settings.consulter');
}

/** setKey/setMany n'avaient jusque-là aucune validation (Record<string, any>
 *  accepté tel quel) : n'importe quelle valeur, de n'importe quelle taille,
 *  pouvait être stockée sous n'importe quelle clé par un titulaire de
 *  `settings.modifier` — notamment `societe_logo_url`, réinjecté sans
 *  échappement HTML lisible par un `<img src>` à l'impression d'une facture
 *  (corrigé côté rendu dans facture.ts, mais mieux vaut aussi rejeter une
 *  valeur manifestement invalide à l'écriture). */
function assertValidSettingValue(cle: string, valeur: unknown, type?: string): void {
  if (typeof valeur !== 'string' && typeof valeur !== 'number' && typeof valeur !== 'boolean') {
    throw new BadRequestException(`Valeur invalide pour le paramètre "${cle}".`);
  }
  if (String(valeur).length > MAX_SETTING_VALUE_LENGTH) {
    throw new BadRequestException(
      `La valeur du paramètre "${cle}" dépasse la taille maximale autorisée (${MAX_SETTING_VALUE_LENGTH} caractères).`,
    );
  }
  if (type !== undefined && !VALID_SETTING_TYPES.has(type)) {
    throw new BadRequestException(`Type de paramètre invalide pour "${cle}" : "${type}".`);
  }
}

function parseValue(valeur: string, type?: string): any {
  if (type === 'number') {
    const n = Number(valeur);
    return Number.isFinite(n) ? n : 0;
  }
  if (type === 'boolean') {
    return valeur === 'true' || valeur === '1';
  }
  if (type === 'json') {
    try {
      return JSON.parse(valeur);
    } catch {
      return valeur;
    }
  }
  return valeur;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retourne tous les paramètres publics accessibles sans authentification (branding, devise, TVA, contact).
   */
  async getPublicSettings() {
    const settings = await this.prisma.setting.findMany({
      where: { isPublic: true },
    });
    const result: Record<string, any> = {};
    settings.forEach((s: any) => {
      result[s.cle] = parseValue(s.valeur, s.type);
    });
    return result;
  }

  /**
   * Retourne tous les paramètres avec tableau, dictionnaire et groupes.
   */
  async getAll(user: CurrentUserType) {
    const allSettings = await this.prisma.setting.findMany({
      orderBy: [{ groupName: 'asc' }, { cle: 'asc' }],
    });
    const settings = canSeePrivateSettings(user)
      ? allSettings
      : allSettings.filter((s: any) => !SENSITIVE_SETTING_KEYS.has(s.cle));
    const map: Record<string, string> = {};
    const parsedMap: Record<string, any> = {};
    const groups: Record<string, any[]> = {};

    settings.forEach((s: any) => {
      map[s.cle] = s.valeur;
      parsedMap[s.cle] = parseValue(s.valeur, s.type);
      const group = s.groupName || 'general';
      if (!groups[group]) groups[group] = [];
      groups[group].push(s);
    });

    return { list: settings, map, parsedMap, groups };
  }

  async getByKey(cle: string, user: CurrentUserType) {
    const setting = await this.prisma.setting.findUnique({ where: { cle } });
    if (!setting) return null;
    if (SENSITIVE_SETTING_KEYS.has(cle) && !canSeePrivateSettings(user)) return null;
    return {
      ...setting,
      parsedValue: parseValue(setting.valeur, setting.type),
    };
  }

  async setKey(
    cle: string,
    valeur: string,
    description?: string,
    type?: string,
    isPublic?: boolean,
    groupName?: string,
  ) {
    assertValidSettingValue(cle, valeur, type);
    return this.prisma.setting.upsert({
      where: { cle },
      create: {
        cle,
        valeur: String(valeur),
        description,
        type: type || 'string',
        isPublic: isPublic ?? false,
        groupName: groupName || 'general',
      },
      update: {
        valeur: String(valeur),
        ...(description !== undefined ? { description } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
        ...(groupName !== undefined ? { groupName } : {}),
      },
    });
  }

  async setMany(settings: Record<string, string | { valeur: string; description?: string; type?: string; isPublic?: boolean; groupName?: string }>) {
    const operations = Object.entries(settings).map(([cle, data]) => {
      if (typeof data === 'object' && data !== null) {
        assertValidSettingValue(cle, data.valeur, data.type);
        return this.prisma.setting.upsert({
          where: { cle },
          create: {
            cle,
            valeur: String(data.valeur),
            description: data.description,
            type: data.type || 'string',
            isPublic: data.isPublic ?? false,
            groupName: data.groupName || 'general',
          },
          update: {
            valeur: String(data.valeur),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.type !== undefined ? { type: data.type } : {}),
            ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
            ...(data.groupName !== undefined ? { groupName: data.groupName } : {}),
          },
        });
      }
      assertValidSettingValue(cle, data);
      return this.prisma.setting.upsert({
        where: { cle },
        create: { cle, valeur: String(data) },
        update: { valeur: String(data) },
      });
    });
    return this.prisma.$transaction(operations);
  }

  /**
   * Statuts et typologies dynamiques.
   */
  async getStatusOptions(entityType?: string) {
    const where: any = { isActive: true };
    if (entityType) {
      where.entityType = entityType;
    }
    return this.prisma.statusConfig.findMany({
      where,
      orderBy: [{ entityType: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  async setStatusOption(data: {
    entityType: string;
    value: string;
    label: string;
    color?: string;
    icon?: string;
    orderIndex?: number;
    isActive?: boolean;
  }) {
    return this.prisma.statusConfig.upsert({
      where: {
        entityType_value: {
          entityType: data.entityType,
          value: data.value,
        },
      },
      create: {
        entityType: data.entityType,
        value: data.value,
        label: data.label,
        color: data.color,
        icon: data.icon,
        orderIndex: data.orderIndex ?? 0,
        isActive: data.isActive ?? true,
      },
      update: {
        label: data.label,
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }
}

