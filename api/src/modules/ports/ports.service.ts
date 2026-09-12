import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.port.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const port = await this.prisma.port.findUnique({ where: { id } });
    if (!port) throw new NotFoundException(`Port ${id} non trouvé`);
    return port;
  }

  async create(data: { code: string; nom: string; ville?: string; pays?: string }) {
    const existing = await this.prisma.port.findUnique({ where: { code: data.code } });
    if (existing) {
      // `code` porte une contrainte unique en base : un port désactivé
      // (actif: false, remove() ne fait jamais de vraie suppression) occupe
      // toujours son code, donc un simple re-create échouerait en conflit
      // permanent. Recréer avec le même code = réactiver ce port existant
      // plutôt que bloquer indéfiniment la réutilisation du code.
      if (!existing.actif) {
        const { nom, ville, pays } = data;
        return this.prisma.port.update({
          where: { id: existing.id },
          data: { nom, ville, pays, actif: true },
        });
      }
      throw new ConflictException(`Un port avec le code ${data.code} existe déjà`);
    }
    const { code, nom, ville, pays } = data;
    return this.prisma.port.create({ data: { code, nom, ville, pays } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = {};
    for (const k of ['code', 'nom', 'ville', 'pays', 'actif'] as const) {
      if (data[k] !== undefined) updateData[k] = data[k];
    }
    return this.prisma.port.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.port.update({ where: { id }, data: { actif: false } });
  }
}
