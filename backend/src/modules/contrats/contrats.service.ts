import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserType } from '../../auth/auth.types';

// Le front pose `min={0}` sur ce champ (contrat-form-modal.tsx) : 0 reste un
// montant valide (contrat sans valeur chiffrée), seul le négatif est rejeté.
function toNonNegativeMontant(value: unknown): number {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n < 0) {
    throw new BadRequestException('Le montant du contrat ne peut pas être négatif.');
  }
  return n;
}

@Injectable()
export class ContratsService {
  constructor(private prisma: PrismaService) {}

  /** Transitions manuelles autorisées — même matrice que le frontend
   *  (frontend/src/lib/status-flow.ts CONTRAT_ALLOWED_TRANSITIONS), dupliquée
   *  ici faute de package partagé front/back : à maintenir synchronisée si
   *  l'une des deux change. Avant ce garde-fou, `statut` était une colonne
   *  texte libre sans AUCUNE validation serveur — un appel API direct pouvait
   *  réouvrir un contrat "Clôturé" ou sauter vers n'importe quelle valeur,
   *  la matrice n'existant que côté store Zustand (contournable).
   */
  private static readonly STATUT_TRANSITIONS: Record<string, string[]> = {
    'En cours': ['Exécuté'],
    'Exécuté': ['En cours'],
    Actif: ['Exécuté', 'En cours', 'Suspendu', 'Clôturé'],
    Suspendu: ['En cours', 'Exécuté', 'Actif', 'Clôturé'],
    'Clôturé': ['En cours', 'Exécuté', 'Actif'],
  };

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
    let contrat = await this.prisma.contrat.findUnique({
      where: { id },
      include: {
        annexe: true,
        client: true,
      },
    });
    if (!contrat) {
      contrat = await this.prisma.contrat.findUnique({
        where: { reference: id },
        include: {
          annexe: true,
          client: true,
        },
      });
    }

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
        montant: toNonNegativeMontant(data.montant),
        statut: data.statut || 'Actif',
        notes: data.notes || undefined,
        // Attribution fiable : nom de l'auteur pris du JWT, jamais d'un
        // champ texte libre fourni par le client.
        creePar: user.nom,
      },
      include: {
        annexe: true,
        client: true,
      },
    });
  }

  async update(id: string, user: CurrentUserType, data: any) {
    const contrat = await this.findOne(id, user);
    if (data.annexeId && user.role !== 'ADMIN' && !user.annexeIds.includes(data.annexeId)) {
      throw new ForbiddenException('Vous ne pouvez pas rattacher ce contrat à cette annexe');
    }
    if (data.statut !== undefined && data.statut !== contrat.statut) {
      const allowed = ContratsService.STATUT_TRANSITIONS[contrat.statut] ?? [];
      if (!allowed.includes(data.statut)) {
        throw new BadRequestException(
          `Transition de statut interdite : ${contrat.statut} → ${data.statut}.`,
        );
      }
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
    if (data.montant !== undefined) updateData.montant = toNonNegativeMontant(data.montant);
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.notes !== undefined) updateData.notes = data.notes;
    // creePar n'est pas modifiable après création — c'est l'auteur
    // d'origine, pas la personne qui édite le contrat aujourd'hui.

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
    const contrat = await this.findOne(id, user);
    return this.prisma.contrat.delete({ where: { id: contrat.id } });
  }
}
