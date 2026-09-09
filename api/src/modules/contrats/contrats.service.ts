import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContratsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; annexeId?: string; clientId?: string }) {
    const where: any = {};

    if (params?.annexeId) {
      where.annexeId = params.annexeId;
    }
    if (params?.clientId) {
      where.clientId = params.clientId;
    }
    if (params?.search) {
      where.OR = [
        { reference: { contains: params.search } },
        { objet: { contains: params.search } },
        { client: { nom: { contains: params.search } } },
      ];
    }

    return this.prisma.contrat.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        client: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contrat = await this.prisma.contrat.findUnique({
      where: { id },
      include: {
        annexe: true,
        client: true,
      },
    });

    if (!contrat) throw new NotFoundException(`Contrat ${id} non trouvé`);
    return contrat;
  }

  async create(data: any) {
    if (data.reference) {
      const existing = await this.prisma.contrat.findUnique({ where: { reference: data.reference } });
      if (existing) throw new ConflictException(`La référence de contrat ${data.reference} existe déjà`);
    }

    const dateDebut = data.dateDebut ? new Date(data.dateDebut) : new Date();
    const dateFin = data.dateFin ? new Date(data.dateFin) : undefined;

    return this.prisma.contrat.create({
      data: {
        reference: data.reference,
        annexeId: data.annexeId,
        clientId: data.clientId,
        objet: data.objet,
        dateDebut,
        dateFin,
        montant: Number(data.montant) || 0,
        statut: data.statut || 'Actif',
        notes: data.notes || undefined,
        creePar: data.creePar || undefined,
      },
      include: {
        annexe: true,
        client: true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.reference !== undefined) {
      const clash = await this.prisma.contrat.findUnique({ where: { reference: data.reference } });
      if (clash && clash.id !== id) {
        throw new ConflictException(`La référence de contrat ${data.reference} existe déjà`);
      }
      updateData.reference = data.reference;
    }
    if (data.annexeId !== undefined) updateData.annexeId = data.annexeId;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.objet !== undefined) updateData.objet = data.objet;
    if (data.dateDebut !== undefined) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin !== undefined) updateData.dateFin = data.dateFin ? new Date(data.dateFin) : null;
    if (data.montant !== undefined) updateData.montant = Number(data.montant) || 0;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.creePar !== undefined) updateData.creePar = data.creePar;

    return this.prisma.contrat.update({
      where: { id },
      data: updateData,
      include: {
        annexe: true,
        client: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.contrat.delete({ where: { id } });
  }
}
