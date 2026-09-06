import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnnexesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.annexe.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const annexe = await this.prisma.annexe.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dossiers: true, factures: true, caisses: true },
        },
      },
    });
    if (!annexe) throw new NotFoundException(`Annexe ${id} non trouvée`);
    return annexe;
  }

  async create(data: {
    code: string;
    nom: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    email?: string;
    estSiege?: boolean;
  }) {
    const existing = await this.prisma.annexe.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Une annexe avec le code ${data.code} existe déjà`);
    return this.prisma.annexe.create({ data });
  }

  async update(id: string, data: Partial<{
    nom: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    email?: string;
    estSiege?: boolean;
    actif?: boolean;
  }>) {
    await this.findOne(id);
    return this.prisma.annexe.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.annexe.update({ where: { id }, data: { actif: false } });
  }
}
