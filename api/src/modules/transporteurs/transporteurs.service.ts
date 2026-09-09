import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransporteursService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; annexeId?: string }) {
    const where: any = {};
    if (params?.annexeId) where.annexeId = params.annexeId;
    if (params?.search) {
      where.OR = [
        { nom: { contains: params.search } },
        { immatriculation: { contains: params.search } },
        { telephone: { contains: params.search } },
      ];
    }
    return this.prisma.transporteur.findMany({
      where,
      include: { annexe: { select: { id: true, nom: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.transporteur.findUnique({
      where: { id },
      include: { annexe: true },
    });
    if (!item) throw new NotFoundException(`Transporteur ${id} non trouvé`);
    return item;
  }

  async create(data: any) {
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

  async update(id: string, data: any) {
    await this.findOne(id);
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

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.transporteur.delete({ where: { id } });
  }
}
