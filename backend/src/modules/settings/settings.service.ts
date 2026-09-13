import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
  async getAll() {
    const settings = await this.prisma.setting.findMany({
      orderBy: [{ groupName: 'asc' }, { cle: 'asc' }],
    });
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

  async getByKey(cle: string) {
    const setting = await this.prisma.setting.findUnique({ where: { cle } });
    if (!setting) return null;
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

