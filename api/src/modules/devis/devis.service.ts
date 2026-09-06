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

  async update(id: string, data: any) {
    await this.findOne(id);
    const { lignes, ...devisData } = data;
    const updateData: any = { ...devisData };

    if (devisData.dateEmission) updateData.dateEmission = new Date(devisData.dateEmission);
    if (devisData.dateValidite) updateData.dateValidite = new Date(devisData.dateValidite);

    if (lignes) {
      await this.prisma.ligneDevis.deleteMany({ where: { devisId: id } });
      let montantHt = 0;
      const lignesFormatted = lignes.map((l: any) => {
        const total = (Number(l.quantite) || 1) * (Number(l.prixUnitaire) || 0);
        montantHt += total;
        return {
          designation: l.designation,
          quantite: Number(l.quantite) || 1,
          prixUnitaire: Number(l.prixUnitaire) || 0,
          montantTotal: total,
        };
      });
      updateData.montantHt = montantHt;
      updateData.montantTva = (montantHt * 18) / 100;
      updateData.montantTtc = montantHt + updateData.montantTva;
      updateData.lignes = { create: lignesFormatted };
    }

    return this.prisma.devis.update({
      where: { id },
      data: updateData,
      include: { lignes: true, client: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.devis.delete({ where: { id } });
  }
}
