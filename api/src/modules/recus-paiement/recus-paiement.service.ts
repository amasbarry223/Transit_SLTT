import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecusPaiementService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; annexeId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;
    if (params?.search) {
      where.OR = [
        { reference: { contains: params.search } },
        { nom: { contains: params.search } },
        { prenom: { contains: params.search } },
        { motif: { contains: params.search } },
      ];
    }
    return this.prisma.recuPaiement.findMany({
      where,
      include: { annexe: { select: { id: true, nom: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.recuPaiement.findUnique({
      where: { id },
      include: { annexe: true },
    });
    if (!item) throw new NotFoundException(`Reçu ${id} non trouvé`);
    return item;
  }

  async create(data: any) {
    const somme = Number(data.somme || 0);
    const montantPaye = Number(data.montantPaye || 0);
    const reste = Math.max(0, somme - montantPaye);
    const statut = reste === 0 ? 'SOLDE' : montantPaye > 0 ? 'PARTIEL' : 'EN_ATTENTE';

    return this.prisma.recuPaiement.create({
      data: {
        reference: data.reference,
        annexeId: data.annexeId,
        nom: data.nom,
        prenom: data.prenom,
        somme,
        motif: data.motif || '',
        montantPaye,
        reste,
        statut,
        creePar: data.creePar || null,
      },
      include: { annexe: true },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.somme !== undefined || data.montantPaye !== undefined) {
      const current = await this.findOne(id);
      const somme = data.somme !== undefined ? Number(data.somme) : current.somme;
      const montantPaye = data.montantPaye !== undefined ? Number(data.montantPaye) : current.montantPaye;
      updateData.somme = somme;
      updateData.montantPaye = montantPaye;
      updateData.reste = Math.max(0, somme - montantPaye);
      updateData.statut = updateData.reste === 0 ? 'SOLDE' : montantPaye > 0 ? 'PARTIEL' : 'EN_ATTENTE';
    }

    return this.prisma.recuPaiement.update({
      where: { id },
      data: updateData,
      include: { annexe: true },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.recuPaiement.delete({ where: { id } });
  }
}
