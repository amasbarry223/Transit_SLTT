import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(clientId?: string) {
    return this.prisma.cotation.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const cotation = await this.prisma.cotation.findUnique({
      where: { id },
      include: { client: true, lignes: true },
    });
    if (!cotation) throw new NotFoundException(`Cotation ${id} non trouvée`);
    return cotation;
  }

  async create(data: any) {
    const existing = await this.prisma.cotation.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro de cotation ${data.numero} existe déjà`);

    const { lignes, ...cotationData } = data;
    const total = (lignes || []).reduce((acc: number, l: any) => acc + (Number(l.montant) || 0), 0);

    return this.prisma.cotation.create({
      data: {
        ...cotationData,
        montantTotal: total,
        lignes: {
          create: (lignes || []).map((l: any) => ({
            rubrique: l.rubrique,
            montant: Number(l.montant) || 0,
          })),
        },
      },
      include: { lignes: true, client: true },
    });
  }
}
