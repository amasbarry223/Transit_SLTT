import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class ContratsService {
  constructor(private prisma: PrismaService) {}

  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  async findAll(user: CurrentUserType, params?: { search?: string; annexeId?: string; clientId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }

    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
        params?.clientId ? { clientId: params.clientId } : {},
        params?.search
          ? {
              OR: [
                { reference: { contains: params.search } },
                { objet: { contains: params.search } },
                { client: { nom: { contains: params.search } } },
              ],
            }
          : {},
      ],
    };

    return this.prisma.contrat.findMany({
      where,
      include: {
        annexe: { select: { id: true, nom: true, code: true } },
        client: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const contrat = await this.prisma.contrat.findUnique({
      where: { id },
      include: {
        annexe: true,
        client: true,
      },
    });

    if (!contrat) throw new NotFoundException(`Contrat ${id} non trouvé`);
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(contrat.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce contrat');
    }
    return contrat;
  }

  async create(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de contrat pour cette annexe');
    }
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

  async update(id: string, user: CurrentUserType, data: any) {
    await this.findOne(id, user);
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce contrat à cette annexe');
    }

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

  async delete(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    return this.prisma.contrat.delete({ where: { id } });
  }
}
