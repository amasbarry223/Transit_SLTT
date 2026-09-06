import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FournisseursService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.fournisseur.findMany({
      where: search
        ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { nom: 'asc' },
      include: {
        _count: { select: { depenses: true } },
      },
    });
  }

  async findOne(id: string) {
    const fournisseur = await this.prisma.fournisseur.findUnique({
      where: { id },
      include: {
        depenses: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { depenses: true } },
      },
    });
    if (!fournisseur) throw new NotFoundException(`Fournisseur ${id} non trouvé`);
    return fournisseur;
  }

  async create(data: any) {
    const existing = await this.prisma.fournisseur.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException(`Le fournisseur avec le code ${data.code} existe déjà`);
    return this.prisma.fournisseur.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.fournisseur.update({ where: { id }, data });
  }
}
