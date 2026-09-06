import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

@Injectable()
export class DossiersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Filtre par annexe selon les droits de l'utilisateur */
  private buildAnnexeFilter(user: CurrentUserType) {
    if (user.role === 'ADMIN') return {};
    return { annexeId: { in: user.annexeIds } };
  }

  async findAll(
    user: CurrentUserType,
    query: {
      search?: string;
      statut?: any;
      type?: any;
      annexeId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const annexeFilter = this.buildAnnexeFilter(user);
    if (query.annexeId) {
      if (user.role !== 'ADMIN' && !user.annexeIds.includes(query.annexeId)) {
        throw new ForbiddenException("Accès non autorisé à cette annexe");
      }
    }

    const where: any = {
      ...annexeFilter,
      ...(query.annexeId ? { annexeId: query.annexeId } : {}),
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { numero: { contains: query.search, mode: 'insensitive' } },
              { numeroBl: { contains: query.search, mode: 'insensitive' } },
              { client: { nom: { contains: query.search, mode: 'insensitive' } } },
              { numeroDeclaration: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.dossier.count({ where }),
      this.prisma.dossier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, nom: true, code: true } },
          annexe: { select: { id: true, nom: true, code: true } },
          conteneurs: true,
          _count: { select: { documents: true, factures: true, depenses: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: CurrentUserType) {
    const dossier = await this.prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        annexe: true,
        conteneurs: true,
        etapes: { orderBy: { ordre: 'asc' } },
        documents: true,
        factures: { include: { lignes: true } },
        depenses: true,
        trackingPublic: true,
        creePar: { select: { id: true, nom: true, email: true } },
      },
    });

    if (!dossier) throw new NotFoundException(`Dossier ${id} non trouvé`);

    if (user.role !== 'ADMIN' && !user.annexeIds.includes(dossier.annexeId)) {
      throw new ForbiddenException("Accès non autorisé à ce dossier");
    }

    return dossier;
  }

  async create(user: CurrentUserType, data: any) {
    if (user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException("Vous ne pouvez pas créer de dossier dans cette annexe");
    }

    // Vérifier l'unicité du numéro
    const existing = await this.prisma.dossier.findUnique({ where: { numero: data.numero } });
    if (existing) throw new ConflictException(`Le numéro de dossier ${data.numero} existe déjà`);

    const { conteneurs, ...dossierData } = data;

    // Création transactionnelle avec conteneurs et code tracking
    return this.prisma.$transaction(async (tx: any) => {
      const dossier = await tx.dossier.create({
        data: {
          ...dossierData,
          creeParId: user.id,
          conteneurs: conteneurs?.length
            ? {
                create: conteneurs.map((c: any) => ({
                  numero: c.numero,
                  type: c.type,
                  plomb: c.plomb,
                  statut: c.statut || 'EN_TRANSIT',
                })),
              }
            : undefined,
        },
      });

      // Création automatique du tracking public
      const codeTracking = `TRK-${dossier.numero}`;
      await tx.trackingPublic.create({
        data: {
          dossierId: dossier.id,
          codeTracking,
          statutAffiche: dossier.statut,
        },
      });

      // Étapes par défaut pour le suivi
      const etapesDefaut = [
        { titre: 'Ouverture du dossier', ordre: 1, completee: true, dateEffective: new Date() },
        { titre: 'Réception des documents', ordre: 2, completee: false },
        { titre: 'Déclaration en douane', ordre: 3, completee: false },
        { titre: 'Visite douanière & Liquidation', ordre: 4, completee: false },
        { titre: 'Paiement des droits de douane', ordre: 5, completee: false },
        { titre: 'Bon à enlever (BAE)', ordre: 6, completee: false },
        { titre: 'Livraison client', ordre: 7, completee: false },
      ];

      await tx.etapeDossier.createMany({
        data: etapesDefaut.map((e) => ({ ...e, dossierId: dossier.id })),
      });

      return dossier;
    });
  }

  async update(id: string, user: CurrentUserType, data: any) {
    const existing = await this.findOne(id, user);

    const { conteneurs, ...updateData } = data;

    return this.prisma.dossier.update({
      where: { id },
      data: updateData,
      include: { conteneurs: true, client: true, annexe: true },
    });
  }

  async updateStatut(id: string, user: CurrentUserType, statut: any) {
    const existing = await this.findOne(id, user);

    const updated = await this.prisma.dossier.update({
      where: { id },
      data: { statut },
    });

    // Mettre à jour le statut affiché sur le tracking public
    await this.prisma.trackingPublic.updateMany({
      where: { dossierId: id },
      data: { statutAffiche: statut },
    });

    return updated;
  }

  async remove(id: string, user: CurrentUserType) {
    await this.findOne(id, user);
    return this.prisma.dossier.delete({ where: { id } });
  }
}
