import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class TransporteursService {
  constructor(private prisma: PrismaService) {}

  /** Comme clients/devis, un transporteur sans annexe reste visible de tous —
   *  seul un transporteur explicitement rattaché à une annexe est restreint. */
  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { OR: [{ annexeId: null }, { annexeId: { in: user.annexeIds } }] };
  }

  async findAll(user: CurrentUserType, params?: { search?: string; annexeId?: string }) {
    if (params?.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(params.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à cette annexe');
    }
    // AND (pas de spread au même niveau) : la clause OR du scoping par
    // annexe et celle de la recherche texte sont toutes deux nécessaires et
    // ne doivent pas s'écraser l'une l'autre (une seule clé `OR` par objet
    // `where` en Prisma — la seconde affectation effacerait la première).
    const where: any = {
      AND: [
        this.buildAnnexeFilter(user),
        params?.annexeId ? { annexeId: params.annexeId } : {},
        params?.search
          ? {
              OR: [
                { nom: { contains: params.search } },
                { immatriculation: { contains: params.search } },
                { telephone: { contains: params.search } },
              ],
            }
          : {},
      ],
    };
    return this.prisma.transporteur.findMany({
      where,
      include: { annexe: { select: { id: true, nom: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: CurrentUserType) {
    const item = await this.prisma.transporteur.findUnique({
      where: { id },
      include: { annexe: true },
    });
    if (!item) throw new NotFoundException(`Transporteur ${id} non trouvé`);
    if (item.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(item.annexeId)) {
      throw new ForbiddenException('Accès non autorisé à ce transporteur');
    }
    return item;
  }

  async create(user: CurrentUserType, data: any) {
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas créer de transporteur pour cette annexe');
    }
    return this.prisma.transporteur.create({
      data: {
        nom: data.nom,
        contact: data.contact || null,
        telephone: data.telephone,
        email: data.email || null,
        vehicule: data.vehicule,
        immatriculation: data.immatriculation,
        trajet: data.trajet || null,
        capacite: Number(data.capacite || 0),
        statut: data.statut || 'DISPONIBLE',
        dateCreation: data.dateCreation || new Date().toISOString().slice(0, 10),
        notes: data.notes || null,
        annexeId: data.annexeId || null,
      },
      include: { annexe: true },
    });
  }

  async update(id: string, user: CurrentUserType, data: any) {
    await this.findOne(id, user);
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce transporteur à cette annexe');
    }
    // Liste blanche : le front renvoie parfois l'entité mappée (annexeNom,
    // nbDossiers…) qui ferait planter Prisma sur un champ inconnu.
    const updateData: any = {};
    for (const k of ['nom', 'contact', 'telephone', 'email', 'vehicule', 'immatriculation', 'trajet', 'statut', 'notes', 'annexeId'] as const) {
      if (data[k] !== undefined) updateData[k] = data[k];
    }
    if (data.capacite !== undefined) updateData.capacite = Number(data.capacite) || 0;
    return this.prisma.transporteur.update({
      where: { id },
      data: updateData,
      include: { annexe: true },
    });
  }

  async delete(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    return this.prisma.transporteur.delete({ where: { id } });
  }
}
