import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevisService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(clientId?: string) {
    return this.prisma.devis.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const devis = await this.prisma.devis.findUnique({
      where: { id },
      include: { client: true, lignes: true },
    });
    if (!devis) throw new NotFoundException(`Devis ${id} non trouvé`);
    return devis;
  }

  async create(data: any) {
    const existing = await this.prisma.devis.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro de devis ${data.numero} existe déjà`);

    const { lignes, ...devisData } = data;
    let montantHt = 0;
    const lignesFormatted = (lignes || []).map((l: any) => {
      const total = (Number(l.quantite) || 1) * (Number(l.prixUnitaire) || 0);
      montantHt += total;
      return {
        designation: l.designation,
        quantite: Number(l.quantite) || 1,
        prixUnitaire: Number(l.prixUnitaire) || 0,
        montantTotal: total,
      };
    });

    const montantTva = (montantHt * 18) / 100;
    const montantTtc = montantHt + montantTva;

    const dateEmission = devisData.dateEmission ? new Date(devisData.dateEmission) : new Date();
    const dateValidite = devisData.dateValidite ? new Date(devisData.dateValidite) : undefined;

    return this.prisma.devis.create({
      data: {
        ...devisData,
        dateEmission,
        dateValidite,
        montantHt,
        montantTva,
        montantTtc,
        lignes: { create: lignesFormatted },
      },
      include: { lignes: true, client: true },
    });
  }
}
