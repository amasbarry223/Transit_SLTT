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
        annexe: { select: { id: true, nom: true, code: true } },
        lignes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const devis = await this.prisma.devis.findUnique({
      where: { id },
      include: { client: true, annexe: true, lignes: true },
    });
    if (!devis) throw new NotFoundException(`Devis ${id} non trouvé`);
    return devis;
  }

  async create(data: any) {
    const existing = await this.prisma.devis.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro de devis ${data.numero} existe déjà`);

    const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(data.lignes);

    return this.prisma.devis.create({
      data: {
        numero: data.numero,
        clientId: data.clientId,
        annexeId: data.annexeId || null,
        dossierId: data.dossierId || null,
        nature: data.nature || null,
        dateEmission: data.dateEmission ? new Date(data.dateEmission) : new Date(),
        dateValidite: data.dateValidite ? new Date(data.dateValidite) : undefined,
        notes: data.notes ?? null,
        montantHt,
        montantTva,
        montantTtc,
        lignes: { create: lignesFormatted },
      },
      include: { lignes: true, client: true, annexe: true },
    });
  }

  async update(id: string, data: any) {
    const current = await this.findOne(id);
    const updateData: any = {};

    // Liste blanche : le front renvoie parfois l'entité mappée entière.
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.annexeId !== undefined) updateData.annexeId = data.annexeId || null;
    if (data.dossierId !== undefined) {
      // Un devis déjà converti ne se rattache pas à un autre dossier.
      if (current.dossierId && data.dossierId && current.dossierId !== data.dossierId) {
        throw new ConflictException('Ce devis est déjà rattaché à un dossier.');
      }
      updateData.dossierId = data.dossierId || null;
    }
    if (data.nature !== undefined) updateData.nature = data.nature || null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.dateEmission) updateData.dateEmission = new Date(data.dateEmission);
    if (data.dateValidite) updateData.dateValidite = new Date(data.dateValidite);

    if (data.lignes) {
      const { montantHt, montantTva, montantTtc, lignesFormatted } = computeDevisTotals(data.lignes);
      updateData.montantHt = montantHt;
      updateData.montantTva = montantTva;
      updateData.montantTtc = montantTtc;
      updateData.lignes = { create: lignesFormatted };
    }

    return this.prisma.$transaction(async (tx: any) => {
      if (data.lignes) {
        await tx.ligneDevis.deleteMany({ where: { devisId: id } });
      }
      return tx.devis.update({
        where: { id },
        data: updateData,
        include: { lignes: true, client: true, annexe: true },
      });
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.devis.delete({ where: { id } });
  }
}
