import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const TAUX_TVA_DEVIS = 18;

/** Recalcule HT / TVA / TTC d'un devis à partir de ses lignes (arrondi au centime). */
function computeDevisTotals(lignes: any[]) {
  let montantHt = 0;
  const lignesFormatted = (lignes || []).map((l: any) => {
    const quantite = Number(l.quantite) || 1;
    const prixUnitaire = Number(l.prixUnitaire) || 0;
    const montantTotal = quantite * prixUnitaire;
    montantHt += montantTotal;
    return { designation: l.designation, quantite, prixUnitaire, montantTotal };
  });
  const montantTva = Math.round(((montantHt * TAUX_TVA_DEVIS) / 100) * 100) / 100;
  return { montantHt, montantTva, montantTtc: montantHt + montantTva, lignesFormatted };
}

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

    const { lignes, id: _id, statut: _st, montantHt: _mht, montantTva: _mtva, montantTtc: _mttc, ...devisData } = data;
    const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(lignes);

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
    const { lignes, id: _id, montantHt: _mht, montantTva: _mtva, montantTtc: _mttc, ...devisData } = data;
    const updateData: any = { ...devisData };

    if (devisData.dateEmission) updateData.dateEmission = new Date(devisData.dateEmission);
    if (devisData.dateValidite) updateData.dateValidite = new Date(devisData.dateValidite);

    if (lignes) {
      const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(lignes);
      updateData.montantHt = montantHt;
      updateData.montantTva = montantTva;
      updateData.montantTtc = montantTtc;
      updateData.lignes = { create: lignesFormatted };
    }

    return this.prisma.$transaction(async (tx: any) => {
      if (lignes) {
        await tx.ligneDevis.deleteMany({ where: { devisId: id } });
      }
      return tx.devis.update({
        where: { id },
        data: updateData,
        include: { lignes: true, client: true },
      });
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.devis.delete({ where: { id } });
  }
}
