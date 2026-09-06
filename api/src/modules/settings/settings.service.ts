import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.setting.findMany();
    // Retourne sous forme de tableau et d'objet clé-valeur
    const map: Record<string, string> = {};
    settings.forEach((s: any) => {
      map[s.cle] = s.valeur;
    });
    return { list: settings, map };
  }

  async getByKey(cle: string) {
    return this.prisma.setting.findUnique({ where: { cle } });
  }

  async setKey(cle: string, valeur: string, description?: string) {
    return this.prisma.setting.upsert({
      where: { cle },
      create: { cle, valeur, description },
      update: { valeur, description },
    });
  }

  async setMany(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([cle, valeur]) =>
      this.prisma.setting.upsert({
        where: { cle },
        create: { cle, valeur },
        update: { valeur },
      }),
    );
    return this.prisma.$transaction(operations);
  }
}
